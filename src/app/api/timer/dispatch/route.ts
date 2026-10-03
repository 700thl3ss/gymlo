import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { webpush } from "@/lib/vapid";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { timerId } = await request.json();

    if (!timerId) {
      return NextResponse.json({ success: false, error: "Missing timerId" }, { status: 400 });
    }

    const timer = await prisma.scheduledTimer.findUnique({
      where: { timerId },
    });

    if (!timer || timer.isCancelled || timer.isSent) {
      return NextResponse.json({ success: true, stopped: true });
    }

    const origin =
      request.headers.get("origin") ||
      (request.headers.get("x-forwarded-host")
        ? `https://${request.headers.get("x-forwarded-host")}`
        : new URL(request.url).origin);

    // Run waiting in background via after(), responding immediately to caller!
    after(async () => {
      const remainingMs = timer.targetTimestamp - Date.now();

      if (remainingMs <= 50000) {
        if (remainingMs > 0) {
          // Add 500ms grace period so in-app cancellation lands before dispatching
          await new Promise((resolve) => setTimeout(resolve, remainingMs + 500));
        }

        const fresh = await prisma.scheduledTimer.findUnique({
          where: { timerId },
        });

        if (fresh && !fresh.isCancelled && !fresh.isSent) {
          const sub = await prisma.pushSubscription.findUnique({
            where: { endpoint: fresh.endpoint },
          });

          if (sub) {
            await prisma.scheduledTimer.update({
              where: { timerId },
              data: { isSent: true },
            });

            const pushSubscription = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            };

            const payload = JSON.stringify({
              title: fresh.title,
              body: fresh.body,
            });

            await webpush.sendNotification(pushSubscription, payload).catch((err) => {
              console.warn("Failed to deliver Web Push in dispatch:", err);
            });
          }
        }
      } else {
        // Wait 45s, then dispatch next hop
        await new Promise((resolve) => setTimeout(resolve, 45000));

        const fresh = await prisma.scheduledTimer.findUnique({
          where: { timerId },
        });

        if (fresh && !fresh.isCancelled && !fresh.isSent) {
          await fetch(`${origin}/api/timer/dispatch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timerId }),
          }).catch((err) => console.warn("Dispatch chain failed:", err));
        }
      }
    });

    return NextResponse.json({ success: true, dispatched: true });
  } catch (error: any) {
    console.error("Timer dispatch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed in timer dispatch" },
      { status: 500 }
    );
  }
}
