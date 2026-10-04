import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);

    // Also check if any password-registered user exists in system
    const realUserCount = await prisma.user.count({
      where: { passwordHash: { not: null } },
    });

    return NextResponse.json({
      success: true,
      user: user || null,
      isFirstSetup: realUserCount === 0,
    });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch session" },
      { status: 500 }
    );
  }
}
