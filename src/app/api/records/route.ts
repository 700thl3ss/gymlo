import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    const userId = user?.id || "guest-user";

    // 1. Fetch personal records for THIS user
    const records = await prisma.personalRecord.findMany({
      where: { userId },
      include: {
        exercise: true,
      },
      orderBy: {
        achievedAt: "desc",
      },
    });

    // Group PRs by exercise
    const recordsByExercise: Record<string, any> = {};
    for (const rec of records) {
      if (!recordsByExercise[rec.exerciseId]) {
        recordsByExercise[rec.exerciseId] = {
          exerciseName: rec.exercise.name,
          primaryMuscle: rec.exercise.primaryMuscle,
          records: [],
        };
      }
      recordsByExercise[rec.exerciseId].records.push(rec);
    }

    // 2. Fetch all completed workouts for THIS user for overall stats
    const workouts = await prisma.workoutSession.findMany({
      where: {
        userId,
        completedAt: { not: null },
      },
      include: {
        sets: {
          where: { isCompleted: true },
        },
      },
      orderBy: {
        completedAt: "asc",
      },
    });

    let totalLifetimeVolume = 0;
    let totalCompletedSets = 0;
    let totalSeconds = 0;

    const volumeChartData = workouts.map((w) => {
      let sessionVolume = 0;
      for (const s of w.sets) {
        sessionVolume += s.weight * s.reps;
      }
      totalLifetimeVolume += sessionVolume;
      totalCompletedSets += w.sets.length;
      totalSeconds += w.durationSeconds;

      return {
        id: w.id,
        name: w.name,
        date: w.completedAt ? w.completedAt.toISOString().split("T")[0] : "",
        volume: sessionVolume,
        setsCount: w.sets.length,
        durationMinutes: Math.round(w.durationSeconds / 60),
      };
    });

    return NextResponse.json({
      success: true,
      records: Object.values(recordsByExercise),
      stats: {
        totalWorkouts: workouts.length,
        totalLifetimeVolume: Math.round(totalLifetimeVolume),
        totalCompletedSets,
        totalHours: Math.round((totalSeconds / 3600) * 10) / 10,
      },
      volumeChartData,
    });
  } catch (error: any) {
    console.error("Failed to fetch records & stats:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
