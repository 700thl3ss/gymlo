import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { webpush } from "@/lib/vapid";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { timerId, subscription, delaySeconds, title, body: notifBody } = body;

    if (!timerId || !subscription || !subscription.endpoint || !delaySeconds) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Upsert subscription in DB
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || "",
        auth: subscription.keys?.auth || "",
      },
      update: {
        p256dh: subscription.keys?.p256dh || "",
        auth: subscription.keys?.auth || "",
      },
    });

    const targetTimestamp = Date.now() + delaySeconds * 1000;

    // 2. Cancel any previous pending timers for this endpoint to prevent duplicate notifications
    await prisma.scheduledTimer.updateMany({
      where: {
        endpoint: subscription.endpoint,
        isSent: false,
        isCancelled: false,
      },
      data: { isCancelled: true },
    });

    // 3. Upsert this scheduled timer
    await prisma.scheduledTimer.upsert({
      where: { timerId },
      create: {
        timerId,
        endpoint: subscription.endpoint,
        targetTimestamp,
        title: title || "Rest Timer Done! 🔔",
        body: notifBody || "Time for your next set. Let's get it!",
        isCancelled: false,
        isSent: false,
      },
      update: {
        endpoint: subscription.endpoint,
        targetTimestamp,
        title: title || "Rest Timer Done! 🔔",
        body: notifBody || "Time for your next set. Let's get it!",
        isCancelled: false,
        isSent: false,
      },
    });

    // Determine host origin for self-chaining if needed
    const origin =
      request.headers.get("origin") ||
      (request.headers.get("x-forwarded-host")
        ? `https://${request.headers.get("x-forwarded-host")}`
        : new URL(request.url).origin);

    const remainingMs = targetTimestamp - Date.now();

    if (remainingMs <= 50000) {
      // Short delay: wait in this invocation and deliver directly
      if (remainingMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingMs));
      }

      const fresh = await prisma.scheduledTimer.findUnique({
        where: { timerId },
      });

      if (fresh && !fresh.isCancelled && !fresh.isSent) {
        await prisma.scheduledTimer.update({
          where: { timerId },
          data: { isSent: true },
        });

        const payload = JSON.stringify({
          title: fresh.title,
          body: fresh.body,
        });

        await webpush.sendNotification(subscription, payload).catch((err) => {
          console.warn("Failed to deliver Web Push:", err);
        });

        return NextResponse.json({ success: true, delivered: true });
      }

      return NextResponse.json({ success: true, cancelled: true });
    } else {
      // Long delay (> 50s): wait 45s, then chain to hop route
      await new Promise((resolve) => setTimeout(resolve, 45000));

      const fresh = await prisma.scheduledTimer.findUnique({
        where: { timerId },
      });

      if (fresh && !fresh.isCancelled && !fresh.isSent) {
        // Trigger next hop asynchronously
        fetch(`${origin}/api/timer/hop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timerId }),
        }).catch((err) => console.warn("Next hop trigger failed:", err));

        return NextResponse.json({ success: true, chained: true });
      }

      return NextResponse.json({ success: true, cancelled: true });
    }
  } catch (error: any) {
    console.error("Timer schedule error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to schedule timer" },
      { status: 500 }
    );
  }
}
