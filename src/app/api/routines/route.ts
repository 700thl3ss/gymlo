import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: true, routines: [] });
    }
    const userId = user.id;

    const routines = await prisma.routine.findMany({
      where: { userId },
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
      orderBy: [
        { orderIndex: "asc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({ success: true, routines });
  } catch (error: any) {
    console.error("Failed to fetch routines:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch routines" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Please log in or create an account to create a routine." },
        { status: 401 }
      );
    }
    const userId = user.id;

    const body = await request.json();
    const { name, description, exercises } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Routine name is required" },
        { status: 400 }
      );
    }

    const routine = await prisma.routine.create({
      data: {
        name,
        description: description || null,
        userId,
        exercises: {
          create: (exercises || []).map((item: any, idx: number) => ({
            exerciseId: item.exerciseId,
            orderIndex: idx,
            targetSets: item.targetSets || 2,
            targetReps: item.targetReps || "8-12",
            notes: item.notes || null,
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

    return NextResponse.json({ success: true, routine });
  } catch (error: any) {
    console.error("Failed to create routine:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create routine" },
      { status: 500 }
    );
  }
}
