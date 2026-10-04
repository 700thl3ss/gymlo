import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET: Preview a routine to import
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const routine = await prisma.routine.findUnique({
      where: { id },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            orderIndex: "asc",
          },
        },
        user: {
          select: { name: true },
        },
      },
    });

    if (!routine) {
      return NextResponse.json(
        { success: false, error: "Routine not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      routine: {
        id: routine.id,
        name: routine.name,
        description: routine.description,
        creatorName: routine.user?.name || "Gymlo Athlete",
        exercises: routine.exercises.map((re) => ({
          exerciseId: re.exerciseId,
          name: re.exercise.name,
          category: re.exercise.category,
          primaryMuscle: re.exercise.primaryMuscle,
          targetSets: re.targetSets,
          targetReps: re.targetReps,
          notes: re.notes,
        })),
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch share routine:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to preview routine" },
      { status: 500 }
    );
  }
}

// POST: Clone routine into current user's library
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    const userId = user?.id || "guest-user";

    const { id } = await params;
    const original = await prisma.routine.findUnique({
      where: { id },
      include: {
        exercises: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!original) {
      return NextResponse.json(
        { success: false, error: "Routine not found" },
        { status: 404 }
      );
    }

    // Determine next orderIndex for this user
    const userRoutinesCount = await prisma.routine.count({
      where: { userId },
    });

    const newRoutine = await prisma.routine.create({
      data: {
        name: original.name,
        description: original.description,
        userId,
        orderIndex: userRoutinesCount,
        exercises: {
          create: original.exercises.map((re, idx) => ({
            exerciseId: re.exerciseId,
            orderIndex: idx,
            targetSets: re.targetSets,
            targetReps: re.targetReps,
            notes: re.notes,
          })),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, routine: newRoutine });
  } catch (error: any) {
    console.error("Failed to clone shared routine:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to import routine" },
      { status: 500 }
    );
  }
}
