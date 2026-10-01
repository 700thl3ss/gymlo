import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const muscle = searchParams.get("muscle") || "";
    const category = searchParams.get("category") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { primaryMuscle: { contains: search } },
        { equipment: { contains: search } },
      ];
    }

    if (muscle && muscle !== "All") {
      where.primaryMuscle = muscle;
    }

    if (category && category !== "All") {
      where.category = category;
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, exercises });
  } catch (error: any) {
    console.error("Failed to fetch exercises:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch exercises" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, primaryMuscle, equipment, instructions } = body;

    if (!name || !primaryMuscle) {
      return NextResponse.json(
        { success: false, error: "Name and primary muscle are required" },
        { status: 400 }
      );
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();

    const exercise = await prisma.exercise.create({
      data: {
        name,
        slug,
        category: category || "Other",
        primaryMuscle,
        equipment: equipment || "None",
        instructions: instructions || "",
        isCustom: true,
        userId: "guest-user",
      },
    });

    return NextResponse.json({ success: true, exercise });
  } catch (error: any) {
    console.error("Failed to create exercise:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create exercise" },
      { status: 500 }
    );
  }
}
