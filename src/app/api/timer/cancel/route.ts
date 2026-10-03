import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { timerId } = await request.json();

    if (!timerId) {
      return NextResponse.json({ success: false, error: "Missing timerId" }, { status: 400 });
    }

    await prisma.scheduledTimer.updateMany({
      where: { timerId },
      data: { isCancelled: true },
    });

    return NextResponse.json({ success: true, cancelled: true });
  } catch (error: any) {
    console.error("Timer cancel error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel timer" },
      { status: 500 }
    );
  }
}
