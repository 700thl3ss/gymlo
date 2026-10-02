"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Play, Pause, RotateCcw, X, Plus, Bell, Check } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { getSavedSettings } from "@/lib/settings";
import {
  SILENT_AUDIO_URI,
  registerServiceWorker,
  requestNotificationPermission,
  sendRestTimerNotification,
  playTimerChime,
} from "@/lib/notifications";

interface RestTimerProps {
  initialSeconds?: number;
  onClose?: () => void;
}

export function RestTimer({ initialSeconds, onClose }: RestTimerProps) {
  const [settings, setSettings] = useState(() => getSavedSettings());
  const defaultTime = initialSeconds !== undefined ? initialSeconds : settings.restPreset1;
  const [secondsRemaining, setSecondsRemaining] = useState(defaultTime);
  const [isRunning, setIsRunning] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>("default");

  const targetEndTimeRef = useRef<number>(Date.now() + defaultTime * 1000);
  const totalSecondsRef = useRef<number>(defaultTime);
  const isRunningRef = useRef<boolean>(true);
  const hasFiredRef = useRef<boolean>(false);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize service worker, permissions, and audio element
  useEffect(() => {
    registerServiceWorker();
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
      // If default, ask politely on first timer start
      if (Notification.permission === "default") {
        requestNotificationPermission().then((p) => setNotifPermission(p));
      }
    }

    try {
      const audio = new Audio(SILENT_AUDIO_URI);
      audio.loop = true;
      audio.volume = 0.01;
      silentAudioRef.current = audio;
    } catch {
      // Audio element not supported
    }

    return () => {
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
        silentAudioRef.current = null;
      }
      if (typeof document !== "undefined") {
        document.title = "Gymlo";
      }
    };
  }, []);

  // Update target time when initialSeconds changes
  useEffect(() => {
    if (initialSeconds !== undefined) {
      totalSecondsRef.current = initialSeconds;
      targetEndTimeRef.current = Date.now() + initialSeconds * 1000;
      setSecondsRemaining(initialSeconds);
      setIsRunning(true);
      isRunningRef.current = true;
      hasFiredRef.current = false;
    }
  }, [initialSeconds]);

  // Handle keep-alive audio playback based on running state
  useEffect(() => {
    isRunningRef.current = isRunning;
    if (isRunning && secondsRemaining > 0) {
      silentAudioRef.current?.play().catch(() => {});
    } else {
      silentAudioRef.current?.pause();
    }
  }, [isRunning, secondsRemaining]);

  // Trigger completion alerts (sound, vibration, notification)
  const triggerCompletion = useCallback(() => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;
    silentAudioRef.current?.pause();

    playTimerChime();
    sendRestTimerNotification(
      "Rest Timer Done! 🔔",
      "Your rest period is over. Time for the next set!"
    );

    if (typeof document !== "undefined") {
      document.title = "🔔 REST OVER! — Gymlo";
    }
  }, []);

  // Main countdown loop: uses real timestamp difference so it stays 100% accurate
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
      setSecondsRemaining(remaining);

      if (remaining > 0) {
        if (typeof document !== "undefined") {
          document.title = `(${formatTime(remaining)}) Rest Timer — Gymlo`;
        }
      } else {
        triggerCompletion();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, triggerCompletion]);

  // Wake-up listener: recalculates immediately when returning to the app or unlocking phone
  useEffect(() => {
    const handleWakeUp = () => {
      if (!isRunningRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        triggerCompletion();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleWakeUp);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleWakeUp);
      window.addEventListener("pageshow", handleWakeUp);
    }

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleWakeUp);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleWakeUp);
        window.removeEventListener("pageshow", handleWakeUp);
      }
    };
  }, [triggerCompletion]);

  // Preset setter
  const setTimerPreset = (secs: number) => {
    totalSecondsRef.current = secs;
    targetEndTimeRef.current = Date.now() + secs * 1000;
    setSecondsRemaining(secs);
    setIsRunning(true);
    isRunningRef.current = true;
    hasFiredRef.current = false;
    silentAudioRef.current?.play().catch(() => {});
  };

  // Add 30 seconds
  const addTime = (secs: number) => {
    const nextRemaining = secondsRemaining + secs;
    targetEndTimeRef.current = Date.now() + nextRemaining * 1000;
    totalSecondsRef.current += secs;
    setSecondsRemaining(nextRemaining);
    hasFiredRef.current = false;
    if (!isRunning) {
      setIsRunning(true);
      isRunningRef.current = true;
    }
    silentAudioRef.current?.play().catch(() => {});
  };

  // Toggle pause/play
  const togglePlayPause = () => {
    if (isRunning) {
      // Pause: remember how many seconds were left
      setIsRunning(false);
      isRunningRef.current = false;
      silentAudioRef.current?.pause();
    } else {
      // Resume: set new target end time based on remaining seconds
      targetEndTimeRef.current = Date.now() + secondsRemaining * 1000;
      setIsRunning(true);
      isRunningRef.current = true;
      if (secondsRemaining > 0) {
        hasFiredRef.current = false;
        silentAudioRef.current?.play().catch(() => {});
      }
    }
  };

  // Request notification permission manually
  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
  };

  const isFinished = secondsRemaining === 0;
  const p1 = settings.restPreset1;
  const p2 = settings.restPreset2;

  // Minimized pill in corner
  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-[var(--card)] border-2 border-[var(--accent)] rounded-full px-4 py-2 flex items-center space-x-2.5 cursor-pointer shadow-2xl hover:scale-105 active:scale-95 transition-all text-[var(--foreground)]"
      >
        <Timer className={`w-4 h-4 text-[var(--accent)] ${isRunning && !isFinished ? "animate-pulse" : ""}`} />
        <span className="font-mono font-bold text-sm text-[var(--foreground)]">
          {formatTime(secondsRemaining)}
        </span>
        {isFinished && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 w-72 sm:w-80 shadow-2xl transition-all">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] mb-3">
        <div className="flex items-center space-x-2 text-[var(--foreground)]">
          <Timer className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
            Rest Timer
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xs px-2 py-0.5 rounded-lg hover:bg-[var(--secondary)] transition-colors"
          >
            Minimize
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-lg hover:bg-[var(--secondary)] transition-colors"
              title="Close rest timer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Countdown Display */}
      <div className="text-center py-2">
        <div
          className={`font-mono text-4xl sm:text-5xl font-black tracking-tight transition-colors ${
            isFinished
              ? "text-emerald-500 animate-bounce"
              : secondsRemaining <= 10
              ? "text-amber-500"
              : "text-[var(--foreground)]"
          }`}
        >
          {formatTime(secondsRemaining)}
        </div>
        {isFinished ? (
          <p className="text-xs font-bold text-emerald-500 mt-1 flex items-center justify-center gap-1.5">
            <Bell className="w-3.5 h-3.5" /> Rest Over! Ready for Next Set!
          </p>
        ) : (
          <p className="text-[11px] font-medium text-[var(--muted-foreground)] mt-0.5 font-mono">
            {isRunning ? "Ticking down..." : "Paused"}
          </p>
        )}
      </div>

      {/* Primary Play/Pause/Add Controls */}
      <div className="flex items-center justify-center space-x-2 my-2.5">
        <button
          onClick={togglePlayPause}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors border ${
            isRunning
              ? "bg-[var(--secondary)] hover:opacity-90 text-[var(--foreground)] border-[var(--border)]"
              : "bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] border-transparent"
          }`}
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isRunning ? "Pause" : "Resume"}</span>
        </button>

        <button
          onClick={() => setTimerPreset(totalSecondsRef.current)}
          className="p-2 rounded-xl bg-[var(--secondary)] hover:opacity-90 text-[var(--foreground)] border border-[var(--border)] transition-colors"
          title="Restart Timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => addTime(30)}
          className="px-2.5 py-2 rounded-xl bg-[var(--secondary)] hover:opacity-90 text-[var(--foreground)] text-xs font-semibold flex items-center space-x-0.5 border border-[var(--border)] transition-colors"
          title="Add 30 seconds"
        >
          <Plus className="w-3 h-3" />
          <span>30s</span>
        </button>
      </div>

      {/* Quick Presets */}
      <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[var(--muted-foreground)] tracking-wider">
          <span>Quick Presets</span>
          {notifPermission === "granted" ? (
            <span className="inline-flex items-center gap-0.5 text-emerald-500 font-bold normal-case">
              <Check className="w-3 h-3 stroke-[3]" /> Alerts on
            </span>
          ) : notifPermission !== "unsupported" ? (
            <button
              onClick={handleEnableNotifications}
              className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline normal-case font-bold"
              title="Click to enable system notifications when timer ends"
            >
              <Bell className="w-2.5 h-2.5" /> Enable alerts
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setTimerPreset(p1)}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-colors border ${
              totalSecondsRef.current === p1 && !isFinished
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent"
                : "bg-[var(--secondary)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--accent)]"
            }`}
          >
            Preset 1: {p1 >= 60 ? `${Math.floor(p1 / 60)}m${p1 % 60 ? ` ${p1 % 60}s` : ""}` : `${p1}s`}
          </button>

          <button
            onClick={() => setTimerPreset(p2)}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-colors border ${
              totalSecondsRef.current === p2 && !isFinished
                ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent"
                : "bg-[var(--secondary)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--accent)]"
            }`}
          >
            Preset 2: {p2 >= 60 ? `${Math.floor(p2 / 60)}m${p2 % 60 ? ` ${p2 % 60}s` : ""}` : `${p2}s`}
          </button>
        </div>
      </div>
    </div>
  );
}
