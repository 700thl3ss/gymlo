// Notification and Audio Alert utilities for Gymlo

export const SILENT_AUDIO_URI =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

export function registerServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Registered
      })
      .catch((err) => {
        console.warn("ServiceWorker registration failed:", err);
      });
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  try {
    const permission = await Notification.requestPermission();
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

export async function sendRestTimerNotification(title = "Rest Timer Done! 🔔", body = "Time for your next set. Let's get it!") {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const options: any = {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "gymlo-rest-timer",
    renotify: true,
    vibrate: [250, 100, 250, 100, 300],
    requireInteraction: false,
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    }
  } catch (err) {
    console.warn("ServiceWorker showNotification failed, trying fallback:", err);
  }

  try {
    new Notification(title, options);
  } catch (err) {
    console.warn("Fallback Notification failed:", err);
  }
}

export function playTimerChime() {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Pleasant rising 3-tone chord (D5 -> F#5 -> A5)
    const tones = [
      { freq: 587.33, duration: 0.12, start: 0 },
      { freq: 739.99, duration: 0.12, start: 0.13 },
      { freq: 880.0, duration: 0.45, start: 0.26 },
    ];

    tones.forEach(({ freq, duration, start }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    });

    if (navigator.vibrate) {
      navigator.vibrate([250, 100, 250, 100, 350]);
    }
  } catch {
    // Audio Context not allowed or supported
  }
}

export function scheduleServiceWorkerTimer(delayMs: number, title?: string, body?: string) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "START_REST_TIMER",
        delayMs,
        title,
        body,
      });
    } else {
      navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({
          type: "START_REST_TIMER",
          delayMs,
          title,
          body,
        });
      });
    }
  } catch (err) {
    console.warn("Failed to schedule service worker timer:", err);
  }
}

export function cancelServiceWorkerTimer() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "CANCEL_REST_TIMER" });
    } else {
      navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({ type: "CANCEL_REST_TIMER" });
      });
    }
  } catch (err) {}
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

