import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const activeSession = await prisma.workoutSession.findFirst({
      where: {
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

    // Fetch all-time best/highest weight and reps to beat for each exercise, plus last session sets
    const exerciseIds = Array.from(new Set(activeSession.sets.map((s) => s.exerciseId)));

    const previousPerformances: Record<string, any[]> = {};
    const recordsToBeat: Record<string, { maxWeight: number; maxReps: number }> = {};

    for (const exId of exerciseIds) {
      // 1. All completed sets across all finished workouts for this exercise
      const allCompletedSets = await prisma.workoutSet.findMany({
        where: {
          exerciseId: exId,
          isCompleted: true,
          workoutSession: {
            completedAt: { not: null },
            id: { not: activeSession.id },
          },
        },
        select: {
          weight: true,
          reps: true,
        },
      });

      let highestWeight = 0;
      let highestReps = 0;
      for (const s of allCompletedSets) {
        if (s.weight > highestWeight) highestWeight = s.weight;
        if (s.reps > highestReps) highestReps = s.reps;
      }
      recordsToBeat[exId] = { maxWeight: highestWeight, maxReps: highestReps };

      // 2. Previous session sets for relative set comparison
      const prevSets = await prisma.workoutSet.findMany({
        where: {
          exerciseId: exId,
          isCompleted: true,
          workoutSession: {
            completedAt: { not: null },
            id: { not: activeSession.id },
          },
        },
        orderBy: {
          completedAt: "desc",
        },
        take: 5,
        select: {
          setNumber: true,
          weight: true,
          reps: true,
          setType: true,
          rpe: true,
        },
      });

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
