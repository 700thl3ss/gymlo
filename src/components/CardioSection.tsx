"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Flame,
  Play,
  Pause,
  RotateCcw,
  Check,
  Trash2,
  Clock,
  Compass,
  Gauge,
  Activity,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatTime } from "@/lib/utils";

export type CardioActivityType = "walk" | "run" | "jog" | "cycle" | "swim";
export type CardioIntensity = "Low" | "Moderate" | "High" | "HIIT";

interface CardioSectionProps {
  workoutSessionId?: string;
  onSessionLogged?: () => void;
}

const ACTIVITIES: { type: CardioActivityType; label: string; icon: string }[] = [
  { type: "walk", label: "Walk", icon: "🚶" },
  { type: "jog", label: "Jog", icon: "🏃" },
  { type: "run", label: "Run", icon: "⚡" },
  { type: "cycle", label: "Cycle", icon: "🚴" },
  { type: "swim", label: "Swim", icon: "🏊" },
];

const INTENSITIES: CardioIntensity[] = ["Low", "Moderate", "High", "HIIT"];

export function CardioSection({ workoutSessionId, onSessionLogged }: CardioSectionProps) {
  const [selectedActivity, setSelectedActivity] = useState<CardioActivityType>("run");
  const [distance, setDistance] = useState<string>("");
  const [distanceUnit, setDistanceUnit] = useState<"miles" | "km">("miles");
  const [intensity, setIntensity] = useState<CardioIntensity>("Moderate");
  const [notes, setNotes] = useState<string>("");

  // Live Timer states
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Manual Time input (in minutes) if not using live timer
  const [manualMinutes, setManualMinutes] = useState<string>("");

  // History list
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch past cardio sessions
  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/cardio");
      const data = await res.json();
      if (data.success) {
        setSessions(data.cardioSessions || []);
      }
    } catch (err) {
      console.error("Failed to load cardio sessions:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Timer interval handling
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Start Live Timer
  const handleStartTimer = async () => {
    if (isTimerRunning) {
      // Pause
      setIsTimerRunning(false);
      return;
    }

    // If starting fresh timer
    if (!activeSessionId) {
      try {
        const res = await fetch("/api/cardio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityType: selectedActivity,
            distance: parseFloat(distance) || 0,
            distanceUnit,
            intensity,
            notes,
            workoutSessionId: workoutSessionId || null,
            isLive: true,
          }),
        });
        const data = await res.json();
        if (data.success && data.cardio) {
          setActiveSessionId(data.cardio.id);
        }
      } catch (err) {
        console.error("Failed to start live cardio:", err);
      }
    }

    setIsTimerRunning(true);
  };

  // Reset / Discard Timer
  const handleResetTimer = async () => {
    if (activeSessionId) {
      try {
        await fetch(`/api/cardio/${activeSessionId}`, { method: "DELETE" });
      } catch (err) {
        console.error("Failed to discard cardio:", err);
      }
    }
    setIsTimerRunning(false);
    setElapsedSeconds(0);
    setActiveSessionId(null);
  };

  // Finish and Save Live Timer Session
  const handleFinishTimer = async () => {
    setIsLoading(true);
    try {
      const totalSeconds = elapsedSeconds;
      const totalMinutes = Math.round(totalSeconds / 60);

      if (activeSessionId) {
        await fetch(`/api/cardio/${activeSessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityType: selectedActivity,
            durationSeconds: totalSeconds,
            durationMinutes: totalMinutes,
            distance: parseFloat(distance) || 0,
            distanceUnit,
            intensity,
            notes,
            finish: true,
          }),
        });
      } else {
        await fetch("/api/cardio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activityType: selectedActivity,
            durationSeconds: totalSeconds,
            durationMinutes: totalMinutes,
            distance: parseFloat(distance) || 0,
            distanceUnit,
            intensity,
            notes,
            workoutSessionId: workoutSessionId || null,
            isLive: false,
          }),
        });
      }

      setIsTimerRunning(false);
      setElapsedSeconds(0);
      setActiveSessionId(null);
      setDistance("");
      setNotes("");
      fetchSessions();
      if (onSessionLogged) onSessionLogged();
    } catch (err) {
      console.error("Failed to save cardio session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Log Manually (without timer)
  const handleLogManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(manualMinutes, 10) || 0;
    if (mins <= 0 && (!distance || parseFloat(distance) <= 0)) {
      alert("Please enter either a duration or distance for your cardio.");
      return;
    }

    setIsLoading(true);
    try {
      await fetch("/api/cardio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType: selectedActivity,
          durationMinutes: mins,
          durationSeconds: mins * 60,
          distance: parseFloat(distance) || 0,
          distanceUnit,
          intensity,
          notes,
          workoutSessionId: workoutSessionId || null,
          isLive: false,
        }),
      });

      setManualMinutes("");
      setDistance("");
      setNotes("");
      fetchSessions();
      if (onSessionLogged) onSessionLogged();
    } catch (err) {
      console.error("Failed to log cardio:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete cardio entry
  const handleDeleteCardio = async (id: string) => {
    if (!confirm("Delete this cardio log?")) return;
    try {
      await fetch(`/api/cardio/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete cardio:", err);
    }
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-[var(--secondary)] text-[var(--accent)] border border-[var(--border)]">
            <Flame className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--foreground)] tracking-tight">Cardio Session</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Track walk, run, jog, cycle, or swim with live timer or manual entry.
            </p>
          </div>
        </div>

        {sessions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs font-bold text-[var(--accent)] hover:opacity-80 flex items-center space-x-1"
          >
            <span>{showHistory ? "Hide History" : `History (${sessions.length})`}</span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Activity Selector (Walk, Run, Jog, Cycle, Swim) */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] block">
          Activity Type
        </label>
        <div className="grid grid-cols-5 gap-2">
          {ACTIVITIES.map((act) => (
            <button
              key={act.type}
              type="button"
              onClick={() => setSelectedActivity(act.type)}
              className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border font-bold text-xs transition-all ${
                selectedActivity === act.type
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent shadow-sm scale-[1.02]"
                  : "bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--secondary)]"
              }`}
            >
              <span className="text-lg sm:text-xl mb-1">{act.icon}</span>
              <span className="truncate">{act.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Live Timer or Manual Mode Controls */}
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 space-y-4">
        {/* Stopwatch Display */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
              Cardio Timer
            </span>
            <div className="font-mono text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
              {formatTime(elapsedSeconds)}
            </div>
          </div>

          {/* Timer Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartTimer}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm ${
                isTimerRunning
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)]"
              }`}
            >
              {isTimerRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Timer</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{elapsedSeconds > 0 ? "Resume Timer" : "Start Timer"}</span>
                </>
              )}
            </button>

            {elapsedSeconds > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleFinishTimer}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                  title="Finish and log timer session"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Finish & Save</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="p-2.5 rounded-xl text-[var(--muted-foreground)] hover:text-red-500 hover:bg-[var(--secondary)] transition-colors border border-[var(--border)]"
                  title="Reset timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Inputs: Distance, Manual Time, Intensity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Distance */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center justify-between mb-1">
              <span>Distance</span>
              <button
                type="button"
                onClick={() => setDistanceUnit(distanceUnit === "miles" ? "km" : "miles")}
                className="text-[10px] text-[var(--accent)] font-mono lowercase hover:underline"
              >
                ({distanceUnit})
              </button>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-mono text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
              />
              <span className="absolute right-3 top-2.5 text-xs text-[var(--muted-foreground)] uppercase font-mono">
                {distanceUnit}
              </span>
            </div>
          </div>

          {/* Time (Manual Minutes if timer not used) */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
              Time {elapsedSeconds > 0 ? "(from timer)" : "(Minutes)"}
            </label>
            {elapsedSeconds > 0 ? (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-mono text-[var(--accent)] font-bold">
                {Math.round(elapsedSeconds / 60)} min ({formatTime(elapsedSeconds)})
              </div>
            ) : (
              <input
                type="number"
                min="0"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                placeholder="e.g. 20"
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm font-mono text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
              />
            )}
          </div>

          {/* Intensity (Low, Moderate, High, HIIT) */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
              Intensity
            </label>
            <div className="grid grid-cols-4 gap-1">
              {INTENSITIES.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setIntensity(lvl)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                    intensity === lvl
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent"
                      : "bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-[var(--border)]"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (e.g. incline 4%, treadmill, outdoor park)..."
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Quick Manual Log Button (if timer is not running) */}
        {!isTimerRunning && elapsedSeconds === 0 && (
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={handleLogManual}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-[var(--secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] text-[var(--foreground)] font-bold text-xs border border-[var(--border)] transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Log Completed Cardio</span>
            </button>
          </div>
        )}
      </div>

      {/* Cardio History List (Collapsible) */}
      {showHistory && sessions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] block">
            Recent Cardio Sessions
          </span>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-xl shrink-0">
                    {ACTIVITIES.find((a) => a.type === sess.activityType)?.icon || "🏃"}
                  </span>
                  <div className="truncate">
                    <div className="font-bold text-[var(--foreground)] capitalize flex items-center gap-2">
                      <span>{sess.activityType}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--accent)] border border-[var(--border)] uppercase font-semibold">
                        {sess.intensity}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)] font-mono mt-0.5 flex items-center gap-2">
                      {sess.distance > 0 && (
                        <span>
                          {sess.distance} {sess.distanceUnit}
                        </span>
                      )}
                      {sess.distance > 0 && sess.durationMinutes > 0 && <span>•</span>}
                      {sess.durationMinutes > 0 && (
                        <span>
                          {sess.durationMinutes} min
                          {sess.durationSeconds > 0 && ` (${formatTime(sess.durationSeconds)})`}
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(sess.startedAt).toLocaleDateString()}</span>
                    </div>
                    {sess.notes && (
                      <p className="text-[11px] text-[var(--muted-foreground)] italic truncate mt-0.5">
                        "{sess.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteCardio(sess.id)}
                  className="text-[var(--muted-foreground)] hover:text-red-500 p-1.5 transition-colors"
                  title="Delete cardio session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
