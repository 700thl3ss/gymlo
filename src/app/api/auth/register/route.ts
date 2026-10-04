import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const displayName = (name && typeof name === "string" ? name.trim() : "") || normalizedEmail.split("@")[0];

    // Check if an existing real user with a password already has this email
    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        passwordHash: { not: null },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists. Please log in." },
        { status: 409 }
      );
    }

    // Check how many real registered users exist in the system
    const realUserCount = await prisma.user.count({
      where: { passwordHash: { not: null } },
    });

    const hashedPassword = await hashPassword(password);
    let finalUser: { id: string; email: string | null; name: string };

    if (realUserCount === 0) {
      // 🌟 THIS IS THE ORIGINAL APP OWNER (YOU)!
      // Seamlessly claim and attach all existing 5 routines, 5 workouts, 88 sets, 56 PRs!
      const claimedUser = await prisma.user.upsert({
        where: { id: "guest-user" },
        update: {
          email: normalizedEmail,
          name: displayName,
          passwordHash: hashedPassword,
        },
        create: {
          id: "guest-user",
          email: normalizedEmail,
          name: displayName,
          passwordHash: hashedPassword,
        },
        select: { id: true, email: true, name: true },
      });

      finalUser = claimedUser;
    } else {
      // 🌟 THIS IS A FRIEND SIGNING UP!
      // Create a fresh isolated user account
      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: displayName,
          passwordHash: hashedPassword,
        },
        select: { id: true, email: true, name: true },
      });

      // Seed starter routines for the friend
      try {
        await seedStarterRoutinesForUser(newUser.id);
      } catch (err) {
        console.warn("Could not seed starter routines:", err);
      }

      finalUser = newUser;
    }

    // Create session token and set cookie
    const token = await createSessionToken({
      userId: finalUser.id,
      email: finalUser.email,
      name: finalUser.name,
    });

    const response = NextResponse.json({
      success: true,
      user: finalUser,
      isOwner: realUserCount === 0,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}

async function seedStarterRoutinesForUser(userId: string) {
  // Grab standard exercises for basic Push / Pull / Leg templates
  const allExercises = await prisma.exercise.findMany({
    select: { id: true, name: true, category: true, primaryMuscle: true },
  });

  const findEx = (query: string) =>
    allExercises.find((e) => e.name.toLowerCase().includes(query.toLowerCase()));

  const bench = findEx("Barbell Bench Press") || findEx("Bench Press");
  const incline = findEx("Incline Dumbbell") || findEx("Dumbbell Chest");
  const lateral = findEx("Delt Raise") || findEx("Lateral Raise");
  const tricep = findEx("Tricep Pushdown") || findEx("Tricep");
  const latPull = findEx("Lat Pulldown");
  const row = findEx("Row");
  const curl = findEx("Curl");
  const legPress = findEx("Leg Press") || findEx("Squat");
  const legExt = findEx("Leg Extension");
  const legCurl = findEx("Leg Curl");
  const calf = findEx("Calf Raise");

  // Push Routine
  const pushExList = [bench, incline, lateral, tricep].filter(Boolean);
  if (pushExList.length > 0) {
    await prisma.routine.create({
      data: {
        name: "Push Day",
        description: "Chest, Shoulders & Triceps",
        userId,
        orderIndex: 0,
        exercises: {
          create: pushExList.map((e, idx) => ({
            exerciseId: e!.id,
            orderIndex: idx,
            targetSets: 3,
            targetReps: "8-12",
          })),
        },
      },
    });
  }

  // Pull Routine
  const pullExList = [latPull, row, curl].filter(Boolean);
  if (pullExList.length > 0) {
    await prisma.routine.create({
      data: {
        name: "Pull Day",
        description: "Back & Biceps",
        userId,
        orderIndex: 1,
        exercises: {
          create: pullExList.map((e, idx) => ({
            exerciseId: e!.id,
            orderIndex: idx,
            targetSets: 3,
            targetReps: "8-12",
          })),
        },
      },
    });
  }

  // Leg Routine
  const legExList = [legPress, legExt, legCurl, calf].filter(Boolean);
  if (legExList.length > 0) {
    await prisma.routine.create({
      data: {
        name: "Leg Day",
        description: "Quads, Hamstrings & Calves",
        userId,
        orderIndex: 2,
        exercises: {
          create: legExList.map((e, idx) => ({
            exerciseId: e!.id,
            orderIndex: idx,
            targetSets: 3,
            targetReps: "10-15",
          })),
        },
      },
    });
  }
}
