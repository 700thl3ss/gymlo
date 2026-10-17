import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: true, workout: null });
    }
    const userId = user.id;

    const activeSession = await prisma.workoutSession.findFirst({
      where: {
        userId,
        completedAt: null,
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
          orderBy: [
            { setNumber: "asc" },
          ],
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    if (!activeSession) {
      return NextResponse.json({ success: true, workout: null });
    }

    // Sort sets in activeSession so they follow routine exercise orderIndex
    if (activeSession.routine?.exercises?.length) {
      const orderMap = new Map(
        activeSession.routine.exercises.map((re: any, idx: number) => [
          re.exerciseId,
          re.orderIndex ?? idx,
        ])
      );
      activeSession.sets.sort((a: any, b: any) => {
        const orderA = orderMap.has(a.exerciseId) ? (orderMap.get(a.exerciseId) as number) : 9999;
        const orderB = orderMap.has(b.exerciseId) ? (orderMap.get(b.exerciseId) as number) : 9999;
        if (orderA !== orderB) return orderA - orderB;
        return a.setNumber - b.setNumber;
      });
    }

    const exerciseIds = Array.from(new Set(activeSession.sets.map((s) => s.exerciseId)));
    const routineId = activeSession.routineId;

    // Batch query 1: all-time completed sets for ALL exercises — for PR (recordsToBeat)
    const allTimeSets = await prisma.workoutSet.findMany({
      where: {
        exerciseId: { in: exerciseIds },
        isCompleted: true,
        workoutSession: {
          userId,
          completedAt: { not: null },
          id: { not: activeSession.id },
        },
      },
      select: {
        exerciseId: true,
        weight: true,
        reps: true,
      },
    });

    // Batch query 2: recent sets scoped to same routine (for "Prev:" display)
    const prevAllSets = await prisma.workoutSet.findMany({
      where: {
        exerciseId: { in: exerciseIds },
        isCompleted: true,
        workoutSession: {
          userId,
          completedAt: { not: null },
          id: { not: activeSession.id },
          // Scope to the same routine so upper day variants have independent histories
          ...(routineId ? { routineId } : {}),
        },
      },
      orderBy: { completedAt: "desc" },
      select: {
        exerciseId: true,
        setNumber: true,
        weight: true,
        reps: true,
        setType: true,
        rpe: true,
      },
    });

    // Group in memory for recordsToBeat (all-time PR per exercise)
    const previousPerformances: Record<string, any[]> = {};
    const recordsToBeat: Record<string, { maxWeight: number; maxReps: number }> = {};

    for (const exId of exerciseIds) {
      // All-time highest weight
      let highestWeight = 0;
      let repsAtHighestWeight = 0;
      for (const s of allTimeSets) {
        if (s.exerciseId !== exId) continue;
        if (s.weight > highestWeight) {
          highestWeight = s.weight;
          repsAtHighestWeight = s.reps;
        } else if (s.weight === highestWeight && s.reps > repsAtHighestWeight) {
          repsAtHighestWeight = s.reps;
        }
      }
      recordsToBeat[exId] = { maxWeight: highestWeight, maxReps: repsAtHighestWeight };

      // Previous 5 sets for this exercise from same-routine sessions (already sorted desc by completedAt)
      const prevSets = prevAllSets.filter((s) => s.exerciseId === exId).slice(0, 5);
      previousPerformances[exId] = prevSets;
    }

    return NextResponse.json({
      success: true,
      workout: activeSession,
      previousPerformances,
      recordsToBeat,
    });
  } catch (error: any) {
    console.error("Failed to fetch active workout:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch active workout" },
      { status: 500 }
    );
  }
}
