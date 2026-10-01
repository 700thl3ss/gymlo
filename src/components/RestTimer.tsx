"use client";

import React, { useState, useEffect, useRef } from "react";
import { Timer, Play, Pause, RotateCcw, X, Plus, Bell } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { getSavedSettings } from "@/lib/settings";

interface RestTimerProps {
  initialSeconds?: number;
  onClose?: () => void;
}

export function RestTimer({ initialSeconds, onClose }: RestTimerProps) {
  const [settings, setSettings] = useState(getSavedSettings());
  const defaultTime = initialSeconds !== undefined ? initialSeconds : settings.restPreset1;
  const [secondsRemaining, setSecondsRemaining] = useState(defaultTime);
  const [isRunning, setIsRunning] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const totalSecondsRef = useRef(defaultTime);

  useEffect(() => {
    const s = getSavedSettings();
    setSettings(s);
  }, []);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);

      if (navigator.vibrate) {
        navigator.vibrate([150, 100, 150]);
      }
    } catch {
      // Audio not permitted or supported
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining]);

  const setTimerPreset = (secs: number) => {
    totalSecondsRef.current = secs;
    setSecondsRemaining(secs);
    setIsRunning(true);
  };

  const addTime = (secs: number) => {
    setSecondsRemaining((prev) => prev + secs);
  };

  const isFinished = secondsRemaining === 0;

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 right-4 z-50 bg-[var(--card)] border border-[var(--accent)] rounded-full px-4 py-2 flex items-center space-x-2.5 cursor-pointer hover:bg-[var(--secondary)] transition-colors text-[var(--foreground)]"
      >
        <Timer className="w-4 h-4 text-[var(--accent)]" />
        <span className="font-mono font-bold text-sm text-[var(--foreground)]">
          {formatTime(secondsRemaining)}
        </span>
      </div>
    );
  }

  const p1 = settings.restPreset1;
  const p2 = settings.restPreset2;

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 w-72 shadow-xl transition-all">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] mb-3">
        <div className="flex items-center space-x-2 text-[var(--foreground)]">
          <Timer className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Rest Timer</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xs px-1.5 py-0.5 rounded hover:bg-[var(--secondary)]"
          >
            Minimize
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded hover:bg-[var(--secondary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Countdown Display */}
      <div className="text-center py-2">
        <div
          className={`font-mono text-4xl font-black tracking-tight ${
            isFinished
              ? "text-[var(--accent)]"
              : secondsRemaining <= 10
              ? "text-amber-500"
              : "text-[var(--foreground)]"
          }`}
        >
          {formatTime(secondsRemaining)}
        </div>
        {isFinished && (
          <p className="text-xs font-semibold text-[var(--accent)] mt-1 flex items-center justify-center gap-1">
            <Bell className="w-3 h-3" /> Rest Over! Ready for Next Set!
          </p>
        )}
      </div>

      {/* Primary Play/Pause/Add Controls */}
      <div className="flex items-center justify-center space-x-2 my-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
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
          className="p-2 rounded-xl bg-[var(--secondary)] hover:opacity-90 text-[var(--foreground)] border border-[var(--border)]"
          title="Restart"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => addTime(30)}
          className="px-2.5 py-2 rounded-xl bg-[var(--secondary)] hover:opacity-90 text-[var(--foreground)] text-xs font-semibold flex items-center space-x-0.5 border border-[var(--border)]"
          title="Add 30s"
        >
          <Plus className="w-3 h-3" />
          <span>30s</span>
        </button>
      </div>

      {/* Configurable Presets from Settings */}
      <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
        <div className="text-[10px] font-bold uppercase text-[var(--muted-foreground)] tracking-wider">
          Quick Presets
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
