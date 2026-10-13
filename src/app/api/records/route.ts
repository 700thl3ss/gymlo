import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { calculateEstimated1RM } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({
        success: true,
        records: [],
        stats: {
          totalWorkouts: 0,
          totalLifetimeVolume: 0,
          totalCompletedSets: 0,
          totalHours: 0,
        },
        volumeChartData: [],
      });
    }
    const userId = user.id;

    // 1. Fetch personal records for THIS user (including workoutSet)
    const records = await prisma.personalRecord.findMany({
      where: { userId },
      include: {
        exercise: true,
        workoutSet: true,
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
          maxWeight: 0,
          repsAtMaxWeight: 0,
          est1RM: 0,
          records: [],
        };
      }
      recordsByExercise[rec.exerciseId].records.push(rec);
      if (rec.recordType === "MAX_WEIGHT" && rec.value > recordsByExercise[rec.exerciseId].maxWeight) {
        recordsByExercise[rec.exerciseId].maxWeight = rec.value;
        if (rec.workoutSet?.reps) {
          recordsByExercise[rec.exerciseId].repsAtMaxWeight = rec.workoutSet.reps;
        }
      }
      if (rec.recordType === "ESTIMATED_1RM" && rec.value > recordsByExercise[rec.exerciseId].est1RM) {
        recordsByExercise[rec.exerciseId].est1RM = rec.value;
      }
      if (rec.workoutSet && rec.workoutSet.weight > 0 && rec.workoutSet.reps > 0) {
        const est = calculateEstimated1RM(rec.workoutSet.weight, rec.workoutSet.reps);
        if (est > recordsByExercise[rec.exerciseId].est1RM) {
          recordsByExercise[rec.exerciseId].est1RM = est;
        }
      }
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
          include: { exercise: true },
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

        if (s.exercise) {
          if (!recordsByExercise[s.exerciseId]) {
            recordsByExercise[s.exerciseId] = {
              exerciseName: s.exercise.name,
              primaryMuscle: s.exercise.primaryMuscle,
              maxWeight: 0,
              repsAtMaxWeight: 0,
              est1RM: 0,
              records: [],
            };
          }
          if (s.weight > recordsByExercise[s.exerciseId].maxWeight) {
            recordsByExercise[s.exerciseId].maxWeight = s.weight;
            recordsByExercise[s.exerciseId].repsAtMaxWeight = s.reps;
          } else if (
            s.weight === recordsByExercise[s.exerciseId].maxWeight &&
            s.reps > recordsByExercise[s.exerciseId].repsAtMaxWeight
          ) {
            recordsByExercise[s.exerciseId].repsAtMaxWeight = s.reps;
          }

          if (s.weight > 0 && s.reps > 0) {
            const est = calculateEstimated1RM(s.weight, s.reps);
            if (est > recordsByExercise[s.exerciseId].est1RM) {
              recordsByExercise[s.exerciseId].est1RM = est;
            }
          }
        }
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

    // Fallback: ensure est1RM is calculated if maxWeight is present
    for (const group of Object.values(recordsByExercise)) {
      if (group.est1RM === 0 && group.maxWeight > 0) {
        group.est1RM = calculateEstimated1RM(group.maxWeight, group.repsAtMaxWeight || 1);
      }
    }

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
