import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    const userId = user?.id || "guest-user";

    const workouts = await prisma.workoutSession.findMany({
      where: {
        userId,
        completedAt: { not: null },
      },
      include: {
        routine: true,
        sets: {
          include: {
            exercise: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    // Compute summary stats for each workout
    const enhancedWorkouts = workouts.map((w) => {
      let totalVolume = 0;
      let completedSetsCount = 0;
      const exerciseSet = new Set<string>();

      for (const set of w.sets) {
        if (set.isCompleted) {
          completedSetsCount++;
          totalVolume += set.weight * set.reps;
        }
        exerciseSet.add(set.exercise.name);
      }

      return {
        ...w,
        totalVolume,
        completedSetsCount,
        exerciseNames: Array.from(exerciseSet),
      };
    });

    return NextResponse.json({ success: true, workouts: enhancedWorkouts });
  } catch (error: any) {
    console.error("Failed to fetch workouts:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch workouts" },
      { status: 500 }
    );
  }
}
