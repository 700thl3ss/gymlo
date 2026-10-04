import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateEstimated1RM } from "@/lib/utils";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workout = await prisma.workoutSession.findUnique({
      where: { id },
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
    });

    if (!workout) {
      return NextResponse.json(
        { success: false, error: "Workout not found" },
        { status: 404 }
      );
    }

    if (workout.routine?.exercises?.length) {
      const orderMap = new Map(
        workout.routine.exercises.map((re: any, idx: number) => [
          re.exerciseId,
          re.orderIndex ?? idx,
        ])
      );
      workout.sets.sort((a: any, b: any) => {
        const orderA = orderMap.has(a.exerciseId) ? (orderMap.get(a.exerciseId) as number) : 9999;
        const orderB = orderMap.has(b.exerciseId) ? (orderMap.get(b.exerciseId) as number) : 9999;
        if (orderA !== orderB) return orderA - orderB;
        return a.setNumber - b.setNumber;
      });
    }

    return NextResponse.json({ success: true, workout });
  } catch (error: any) {
    console.error("Failed to fetch workout:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch workout" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      notes,
      finishWorkout,
      sets,
      addSetForExerciseId,
      removeSetId,
      addExerciseId,
      removeExerciseId,
    } = body;

    // 1. Add new exercise to active workout
    if (addExerciseId) {
      const existingSets = await prisma.workoutSet.findMany({
        where: { workoutSessionId: id, exerciseId: addExerciseId },
      });

      if (existingSets.length === 0) {
        // Find previous set info for smart prefill
        const lastSet = await prisma.workoutSet.findFirst({
          where: { exerciseId: addExerciseId, isCompleted: true },
          orderBy: { completedAt: "desc" },
        });

        // Create 2 sets by default for the newly added exercise
        await prisma.workoutSet.createMany({
          data: [
            {
              workoutSessionId: id,
              exerciseId: addExerciseId,
              setNumber: 1,
              setType: "NORMAL",
              weight: lastSet ? lastSet.weight : 0,
              reps: lastSet ? lastSet.reps : 10,
            },
            {
              workoutSessionId: id,
              exerciseId: addExerciseId,
              setNumber: 2,
              setType: "NORMAL",
              weight: lastSet ? lastSet.weight : 0,
              reps: lastSet ? lastSet.reps : 10,
            },
          ],
        });
      }
    }

    // 2. Remove exercise completely from active workout
    if (removeExerciseId) {
      await prisma.workoutSet.deleteMany({
        where: { workoutSessionId: id, exerciseId: removeExerciseId },
      });
    }

    // 3. Add single set to an exercise in this workout
    if (addSetForExerciseId) {
      const currentSets = await prisma.workoutSet.findMany({
        where: { workoutSessionId: id, exerciseId: addSetForExerciseId },
        orderBy: { setNumber: "desc" },
      });

      const nextNum = (currentSets[0]?.setNumber || 0) + 1;
      const lastWeight = currentSets[0]?.weight || 0;
      const lastReps = currentSets[0]?.reps || 10;

      await prisma.workoutSet.create({
        data: {
          workoutSessionId: id,
          exerciseId: addSetForExerciseId,
          setNumber: nextNum,
          setType: "NORMAL",
          weight: lastWeight,
          reps: lastReps,
        },
      });
    }

    // 4. Remove a specific set
    if (removeSetId) {
      const setToDelete = await prisma.workoutSet.findUnique({
        where: { id: removeSetId },
      });
      if (setToDelete) {
        await prisma.workoutSet.delete({ where: { id: removeSetId } });
        // Renumber remaining sets for this exercise
        const remaining = await prisma.workoutSet.findMany({
          where: { workoutSessionId: id, exerciseId: setToDelete.exerciseId },
          orderBy: { setNumber: "asc" },
        });
        for (let i = 0; i < remaining.length; i++) {
          await prisma.workoutSet.update({
            where: { id: remaining[i].id },
            data: { setNumber: i + 1 },
          });
        }
      }
    }

    // 4b. Update notes across all sets for an exercise
    if (body.updateExerciseNotes) {
      const { exerciseId, notes: exNotes } = body.updateExerciseNotes;
      await prisma.workoutSet.updateMany({
        where: { workoutSessionId: id, exerciseId },
        data: { notes: exNotes || null },
      });
    }

    // 5. Bulk update sets data if provided
    if (Array.isArray(sets)) {
      for (const s of sets) {
        if (!s.id) continue;
        await prisma.workoutSet.update({
          where: { id: s.id },
          data: {
            weight: typeof s.weight === "number" ? s.weight : parseFloat(s.weight) || 0,
            reps: typeof s.reps === "number" ? s.reps : parseInt(s.reps, 10) || 0,
            rpe: s.rpe ? parseFloat(s.rpe) : null,
            setType: s.setType || "NORMAL",
            isCompleted: Boolean(s.isCompleted),
            completedAt: s.isCompleted ? (s.completedAt ? new Date(s.completedAt) : new Date()) : null,
            notes: s.notes || null,
          },
        });
      }
    }

    // 6. Basic info update
    const updateData: any = {};
    if (name) updateData.name = name;
    if (notes !== undefined) updateData.notes = notes;

    // 7. Finish Workout logic & PR Calculation
    let newPRs: any[] = [];
    if (finishWorkout) {
      const user = await getSessionUser(request);
      const existing = await prisma.workoutSession.findUnique({
        where: { id },
        include: { sets: true },
      });

      if (existing) {
        const currentUserId = user?.id || existing.userId || "guest-user";
        const completedAt = new Date();
        const durationSeconds = Math.max(
          1,
          Math.floor((completedAt.getTime() - new Date(existing.startedAt).getTime()) / 1000)
        );

        updateData.completedAt = completedAt;
        updateData.durationSeconds = durationSeconds;

        // Calculate and register Personal Records for completed sets
        for (const set of existing.sets) {
          if (!set.isCompleted || set.weight <= 0 || set.reps <= 0) continue;

          const est1RM = calculateEstimated1RM(set.weight, set.reps);

          // Check previous highest estimated 1RM for this exercise for THIS user
          const prev1RM = await prisma.personalRecord.findFirst({
            where: {
              userId: currentUserId,
              exerciseId: set.exerciseId,
              recordType: "ESTIMATED_1RM",
            },
            orderBy: { value: "desc" },
          });

          if (!prev1RM || est1RM > prev1RM.value) {
            const pr = await prisma.personalRecord.create({
              data: {
                userId: currentUserId,
                exerciseId: set.exerciseId,
                recordType: "ESTIMATED_1RM",
                value: est1RM,
                workoutSetId: set.id,
                achievedAt: completedAt,
              },
              include: { exercise: true },
            });
            newPRs.push(pr);
          }

          // Check previous highest single weight lifted for THIS user
          const prevWeight = await prisma.personalRecord.findFirst({
            where: {
              userId: currentUserId,
              exerciseId: set.exerciseId,
              recordType: "MAX_WEIGHT",
            },
            orderBy: { value: "desc" },
          });

          if (!prevWeight || set.weight > prevWeight.value) {
            await prisma.personalRecord.create({
              data: {
                userId: currentUserId,
                exerciseId: set.exerciseId,
                recordType: "MAX_WEIGHT",
                value: set.weight,
                workoutSetId: set.id,
                achievedAt: completedAt,
              },
            });
          }
        }
      }
    }

    const updatedWorkout = await prisma.workoutSession.update({
      where: { id },
      data: updateData,
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
    });

    if (updatedWorkout.routine?.exercises?.length) {
      const orderMap = new Map(
        updatedWorkout.routine.exercises.map((re: any, idx: number) => [
          re.exerciseId,
          re.orderIndex ?? idx,
        ])
      );
      updatedWorkout.sets.sort((a: any, b: any) => {
        const orderA = orderMap.has(a.exerciseId) ? (orderMap.get(a.exerciseId) as number) : 9999;
        const orderB = orderMap.has(b.exerciseId) ? (orderMap.get(b.exerciseId) as number) : 9999;
        if (orderA !== orderB) return orderA - orderB;
        return a.setNumber - b.setNumber;
      });
    }

    return NextResponse.json({
      success: true,
      workout: updatedWorkout,
      newPRs,
    });
  } catch (error: any) {
    console.error("Failed to update workout:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update workout" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.workoutSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete workout:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete workout" },
      { status: 500 }
    );
  }
}
