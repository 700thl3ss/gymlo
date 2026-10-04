import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    const userId = user?.id || "guest-user";

    const body = await request.json();
    const { routineId, name } = body;

    // Check if there is already an unfinished active session for THIS user
    const existingActive = await prisma.workoutSession.findFirst({
      where: {
        userId,
        completedAt: null,
      },
    });

    if (existingActive) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have an active workout session in progress. Please finish or cancel it first.",
          activeWorkoutId: existingActive.id,
        },
        { status: 400 }
      );
    }

    let workoutName = name || "Quick Workout";
    const initialSetsData: Array<{
      exerciseId: string;
      setNumber: number;
      setType: string;
      weight: number;
      reps: number;
      notes?: string | null;
    }> = [];

    if (routineId) {
      const routine = await prisma.routine.findUnique({
        where: { id: routineId },
        include: {
          exercises: {
            orderBy: { orderIndex: "asc" },
          },
        },
      });

      if (routine) {
        workoutName = routine.name;

        // For each routine exercise, prepare the default sets
        for (const re of routine.exercises) {
          // Check last used weight/reps for this exercise for THIS user
          const lastSet = await prisma.workoutSet.findFirst({
            where: {
              exerciseId: re.exerciseId,
              isCompleted: true,
              workoutSession: {
                userId,
              },
            },
            orderBy: {
              completedAt: "desc",
            },
          });

          let defaultWeight = lastSet ? lastSet.weight : 0;
          let defaultReps = lastSet ? lastSet.reps : 8;

          // If no previous set exists, parse preset weight from routine notes
          if (!lastSet && re.notes) {
            const parentheticalWeight = re.notes.match(/\((\d+(\.\d+)?)\s*lbs\)/i);
            if (parentheticalWeight) {
              defaultWeight = parseFloat(parentheticalWeight[1]);
            } else {
              const atWeight = re.notes.match(/@\s*(\d+(\.\d+)?)\s*lbs/i);
              if (atWeight) {
                defaultWeight = parseFloat(atWeight[1]);
              }
            }

            if (re.targetReps) {
              const repMatch = re.targetReps.match(/(\d+)/);
              if (repMatch) defaultReps = parseInt(repMatch[1], 10);
            }
          }

          const numSets = re.targetSets || 2;
          for (let s = 1; s <= numSets; s++) {
            initialSetsData.push({
              exerciseId: re.exerciseId,
              setNumber: s,
              setType: "NORMAL",
              weight: defaultWeight,
              reps: defaultReps,
              notes: re.notes || null,
            });
          }
        }
      }
    }

    const session = await prisma.workoutSession.create({
      data: {
        name: workoutName,
        routineId: routineId || null,
        userId,
        startedAt: new Date(),
        sets: {
          create: initialSetsData,
        },
      },
      include: {
        routine: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
              orderBy: {
                orderIndex: "asc",
              },
            },
          },
        },
        sets: {
          include: {
            exercise: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, workout: session });
  } catch (error: any) {
    console.error("Failed to start workout:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start workout" },
      { status: 500 }
    );
  }
}
