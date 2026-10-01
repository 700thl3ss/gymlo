import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cardio = await prisma.cardioSession.findUnique({
      where: { id },
    });

    if (!cardio) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, cardio });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get cardio" },
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

    const updateData: any = {};
    if (body.activityType !== undefined) updateData.activityType = body.activityType.toLowerCase();
    if (body.distance !== undefined) updateData.distance = parseFloat(body.distance) || 0;
    if (body.distanceUnit !== undefined) updateData.distanceUnit = body.distanceUnit;
    if (body.intensity !== undefined) updateData.intensity = body.intensity;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.durationMinutes !== undefined) updateData.durationMinutes = parseInt(body.durationMinutes, 10) || 0;
    if (body.durationSeconds !== undefined) updateData.durationSeconds = parseInt(body.durationSeconds, 10) || 0;
    if (body.finish) {
      updateData.completedAt = new Date();
    }

    const cardio = await prisma.cardioSession.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, cardio });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update cardio" },
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
    await prisma.cardioSession.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete cardio" },
      { status: 500 }
    );
  }
}
