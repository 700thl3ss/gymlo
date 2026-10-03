// Web Push and In-App Alert Utilities for Gymlo
import { VAPID_PUBLIC_KEY } from "./vapid-client";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    return reg;
  } catch (err) {
    console.warn("ServiceWorker registration failed:", err);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Auto-subscribe to Web Push
      await subscribeToWebPush();
    }
    return permission;
  } catch (err) {
    console.warn("Failed to request notification permission:", err);
    return Notification.permission;
  }
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function subscribeToWebPush(): Promise<PushSubscription | null> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as any,
      });
    }

    return sub;
  } catch (err) {
    console.warn("Failed to subscribe to Web Push:", err);
    return null;
  }
}

// Schedules a server-side push notification that will be delivered by Apple APNs
// even if the user is in TikTok, listening to music, or phone is locked!
export async function scheduleServerTimerPush(
  timerId: string,
  delaySeconds: number,
  title = "Rest Timer Done! 🔔",
  body = "Time for your next set. Let's get it!"
) {
  if (typeof window === "undefined") return;

  try {
    const sub = await subscribeToWebPush();
    if (!sub) return;

    fetch("/api/timer/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timerId,
        subscription: sub.toJSON(),
        delaySeconds,
        title,
        body,
      }),
    }).catch((err) => console.warn("scheduleServerTimerPush failed:", err));
  } catch (err) {
    console.warn("scheduleServerTimerPush error:", err);
  }
}

export async function cancelServerTimerPush(timerId: string) {
  if (typeof window === "undefined") return;
  try {
    fetch("/api/timer/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timerId }),
    }).catch(() => {});
  } catch (err) {}
}

// Single deduplicated local notification (used when app is active in foreground)
export async function sendRestTimerNotification(
  title = "Rest Timer Done! 🔔",
  body = "Time for your next set. Let's get it!"
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const options: any = {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "gymlo-rest-timer", // Deduplicates: ensures only 1 notification is shown
    renotify: false,
    vibrate: [250, 100, 250, 100, 300],
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    }
  } catch (err) {}

  try {
    new Notification(title, options);
  } catch (err) {}
}

// Pleasant ambient chime that does NOT pause Spotify or Apple Music
export function playTimerChime() {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Respect ambient audio session so Spotify/Apple Music is NOT stopped
    if ("audioSession" in navigator) {
      try {
        (navigator as any).audioSession.type = "ambient";
      } catch (e) {}
    }

    const tones = [
      { freq: 659.25, duration: 0.12, start: 0 },
      { freq: 830.61, duration: 0.12, start: 0.13 },
      { freq: 987.77, duration: 0.35, start: 0.26 },
    ];

    tones.forEach(({ freq, duration, start }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    });

    if (navigator.vibrate) {
      navigator.vibrate([250, 100, 250, 100, 300]);
    }
  } catch {
    // Audio Context not allowed or supported
  }
}

export async function requestScreenWakeLock(): Promise<any> {
  if (typeof window === "undefined" || !("wakeLock" in navigator)) return null;
  try {
    const lock = await (navigator as any).wakeLock.request("screen");
    return lock;
  } catch (err) {
    return null;
  }
}

export function releaseScreenWakeLock(lock: any) {
  if (!lock) return;
  try {
    lock.release().catch(() => {});
  } catch (err) {}
}
