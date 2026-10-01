import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      },
    });

    if (!routine) {
      return NextResponse.json(
        { success: false, error: "Routine not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, routine });
  } catch (error: any) {
    console.error("Failed to fetch routine:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch routine" },
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
    const { name, description, exercises } = body;

    const existing = await prisma.routine.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Routine not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (typeof name === "string") updateData.name = name.trim();
    if (typeof description === "string") updateData.description = description.trim();

    // If updated exercises array provided, replace existing routine exercises
    if (Array.isArray(exercises)) {
      await prisma.routineExercise.deleteMany({
        where: { routineId: id },
      });

      await prisma.routineExercise.createMany({
        data: exercises.map((item: any, idx: number) => ({
          routineId: id,
          exerciseId: item.exerciseId,
          orderIndex: idx,
          targetSets: Number(item.targetSets) || 2,
          targetReps: String(item.targetReps || "8-12"),
          notes: item.notes || null,
        })),
      });
    }

    const updated = await prisma.routine.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json({ success: true, routine: updated });
  } catch (error: any) {
    console.error("Failed to update routine:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update routine" },
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
    await prisma.routine.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete routine:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete routine" },
      { status: 500 }
    );
  }
}
