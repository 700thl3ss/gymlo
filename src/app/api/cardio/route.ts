import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: true, cardio: null, cardioSessions: [] });
    }
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    if (active === "true") {
      const activeCardio = await prisma.cardioSession.findFirst({
        where: { userId, completedAt: null },
        orderBy: { startedAt: "desc" },
      });
      return NextResponse.json({ success: true, cardio: activeCardio });
    }

    const cardioSessions = await prisma.cardioSession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({ success: true, cardioSessions });
  } catch (error: any) {
    console.error("Failed to fetch cardio sessions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch cardio sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(request);
    const userId = user?.id || "guest-user";

    const body = await request.json();
    const {
      activityType = "run",
      durationMinutes = 0,
      durationSeconds = 0,
      distance = 0,
      distanceUnit = "miles",
      intensity = "Moderate",
      notes = null,
      workoutSessionId = null,
      isLive = false,
    } = body;

    const session = await prisma.cardioSession.create({
      data: {
        userId,
        activityType: activityType.toLowerCase(),
        durationMinutes: parseInt(durationMinutes, 10) || 0,
        durationSeconds: parseInt(durationSeconds, 10) || 0,
        distance: parseFloat(distance) || 0,
        distanceUnit: distanceUnit || "miles",
        intensity: intensity || "Moderate",
        notes: notes || null,
        workoutSessionId: workoutSessionId || null,
        startedAt: new Date(),
        completedAt: isLive ? null : new Date(),
      },
    });

    return NextResponse.json({ success: true, cardio: session });
  } catch (error: any) {
    console.error("Failed to create cardio session:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create cardio session" },
      { status: 500 }
    );
  }
}
