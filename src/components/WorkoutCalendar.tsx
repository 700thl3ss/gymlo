"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Clock, Dumbbell, Award, Flame, Trash2 } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface WorkoutCalendarProps {
  workouts: any[];
  cardioSessions?: any[];
  onDeleteWorkout?: (id: string) => Promise<void> | void;
  onDeleteCardio?: (id: string) => Promise<void> | void;
  unit?: "lbs" | "kg";
}

export function WorkoutCalendar({
  workouts,
  cardioSessions = [],
  onDeleteWorkout,
  onDeleteCardio,
  unit = "lbs",
}: WorkoutCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  // Default sets breakdown minimized (empty set of expanded workout IDs)
  const [expandedWorkoutIds, setExpandedWorkoutIds] = useState<Set<string>>(new Set());

  const toggleWorkoutExpand = (id: string) => {
    setExpandedWorkoutIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group workouts by local YYYY-MM-DD
  const workoutsByDate: Record<string, any[]> = {};
  for (const w of workouts) {
    const d = new Date(w.completedAt || w.startedAt);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!workoutsByDate[dateKey]) {
      workoutsByDate[dateKey] = [];
    }
    workoutsByDate[dateKey].push(w);
  }

  // Group cardio by local YYYY-MM-DD
  const cardioByDate: Record<string, any[]> = {};
  for (const c of cardioSessions) {
    const d = new Date(c.completedAt || c.startedAt);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!cardioByDate[dateKey]) {
      cardioByDate[dateKey] = [];
    }
    cardioByDate[dateKey].push(c);
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateStr(now.toISOString().split("T")[0]);
  };

  // Days calculations
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }> = [];

  // Padding days from previous month
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    days.push({ dayNum, dateStr, isCurrentMonth: false });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ dayNum: d, dateStr, isCurrentMonth: true });
  }

  // Trailing days to fill 35 or 42 grid cells
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    days.push({ dayNum: i, dateStr, isCurrentMonth: false });
  }

  const selectedWorkouts = workoutsByDate[selectedDateStr] || [];
  const selectedCardio = cardioByDate[selectedDateStr] || [];

  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  })();

  const CARDIO_ICONS: Record<string, string> = {
    walk: "🚶",
    run: "⚡",
    jog: "🏃",
    cycle: "🚴",
    swim: "🏊",
  };

  return (
    <div className="space-y-4">
      {/* Calendar Controls */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
          <div className="flex items-center space-x-3">
            <h4 className="font-bold text-base text-[var(--foreground)]">
              {monthNames[month]} {year}
            </h4>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--accent)] border border-[var(--border)] transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[var(--muted-foreground)] mb-2 uppercase tracking-wider">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((item, idx) => {
            const dayWorkouts = workoutsByDate[item.dateStr] || [];
            const dayCardio = cardioByDate[item.dateStr] || [];
            const hasWorkout = dayWorkouts.length > 0;
            const hasCardio = dayCardio.length > 0;
            const hasActivity = hasWorkout || hasCardio;
            const isSelected = selectedDateStr === item.dateStr;
            const isToday = todayStr === item.dateStr;

            return (
              <div
                key={`${item.dateStr}-${idx}`}
                onClick={() => setSelectedDateStr(item.dateStr)}
                className={`min-h-[64px] sm:min-h-[76px] p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[var(--secondary)] border-[var(--accent)]"
                    : hasActivity
                    ? "bg-[var(--card)] border-[var(--border)] hover:border-[var(--accent)]"
                    : item.isCurrentMonth
                    ? "bg-[var(--background)]/60 border-[var(--border)] hover:bg-[var(--secondary)]/40"
                    : "opacity-40 bg-[var(--background)]/30 border-transparent"
                }`}
              >
                {/* Day Number and Activity Indicators */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-bold ${
                      isToday
                        ? "w-5 h-5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center text-[10px]"
                        : isSelected
                        ? "text-[var(--accent)]"
                        : item.isCurrentMonth
                        ? "text-[var(--foreground)]"
                        : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    {item.dayNum}
                  </span>
                  <div className="flex items-center space-x-1">
                    {hasWorkout && (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)]" title="Workout logged" />
                    )}
                    {hasCardio && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" title="Cardio logged" />
                    )}
                  </div>
                </div>

                {/* Workout & Cardio preview pill if logged */}
                {hasActivity && (
                  <div className="mt-1 space-y-0.5 overflow-hidden">
                    {dayWorkouts.slice(0, 1).map((w: any) => (
                      <div
                        key={w.id}
                        className="text-[10px] font-semibold text-[var(--foreground)] truncate bg-[var(--background)] px-1 py-0.5 rounded border border-[var(--border)]"
                      >
                        {w.name}
                      </div>
                    ))}
                    {dayCardio.slice(0, 1).map((c: any) => (
                      <div
                        key={c.id}
                        className="text-[10px] font-semibold text-[var(--foreground)] truncate bg-[var(--background)] px-1 py-0.5 rounded border border-amber-500/30 flex items-center gap-1"
                      >
                        <span>{CARDIO_ICONS[c.activityType] || "⚡"}</span>
                        <span className="capitalize">{c.activityType}</span>
                      </div>
                    ))}
                    {dayWorkouts.length + dayCardio.length > 2 && (
                      <div className="text-[9px] text-[var(--accent)] font-bold">
                        +{dayWorkouts.length + dayCardio.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Workout Details */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
          <div>
            <h4 className="font-bold text-sm text-[var(--foreground)]">
              Workouts on {selectedDateStr}
            </h4>
            <span className="text-xs text-[var(--muted-foreground)]">
              {selectedWorkouts.length === 0
                ? "No workout logged on this date."
                : `${selectedWorkouts.length} session(s) completed`}
            </span>
          </div>
          {selectedWorkouts.length > 0 && (
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[var(--secondary)] text-[var(--accent)] border border-[var(--border)]">
              {selectedWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0)} {unit} Total Vol
            </span>
          )}
        </div>

        {selectedWorkouts.length === 0 && selectedCardio.length === 0 ? (
          <div className="text-center py-6 text-xs text-[var(--muted-foreground)] italic">
            Select any day with an accent dot on the calendar to view its workout and cardio breakdown.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Logged Workouts for Day */}
            {selectedWorkouts.map((w) => {
              const isExpanded = expandedWorkoutIds.has(w.id);

              return (
                <div
                  key={w.id}
                  className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-[var(--foreground)]">{w.name}</h5>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(w.durationSeconds)}
                        </span>
                        <span>•</span>
                        <span className="font-mono font-bold text-[var(--accent)]">
                          {w.totalVolume} {unit}
                        </span>
                        <span>•</span>
                        <span>{w.completedSetsCount} sets</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Minimize / Expand Toggle Button */}
                      <button
                        onClick={() => toggleWorkoutExpand(w.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors flex items-center space-x-1 border border-[var(--border)]"
                      >
                        <span>{isExpanded ? "Hide Sets" : `View Sets (${w.sets?.length || 0})`}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {onDeleteWorkout && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Discard "${w.name}" workout session? This will permanently delete it from your history.`)) {
                              onDeleteWorkout(w.id);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors flex items-center space-x-1 border border-transparent hover:border-red-500/20"
                          title="Discard this workout"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Discard</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {w.notes && (
                    <p className="text-xs text-[var(--muted-foreground)] italic bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)]">
                      "{w.notes}"
                    </p>
                  )}

                  {/* Sets Breakdown (Minimized by default, toggled open on click) */}
                  {isExpanded && (
                    <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
                      {w.sets?.map((s: any) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between py-1 px-2.5 bg-[var(--card)] rounded-lg text-xs border border-[var(--border)]"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-[var(--foreground)]">
                              {s.exercise?.name}
                            </span>
                            <span className="text-[10px] text-[var(--muted-foreground)]">
                              Set {s.setNumber}
                            </span>
                          </div>
                          <div className="font-mono text-[var(--foreground)]">
                            <span className="text-[var(--accent)] font-bold">{s.weight} {unit}</span> × {s.reps} reps
                            {s.rpe && <span className="text-[var(--muted-foreground)] ml-1">@RPE{s.rpe}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Logged Cardio for Day */}
            {selectedCardio.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Cardio Sessions ({selectedCardio.length})</span>
                </span>
                {selectedCardio.map((c) => (
                  <div
                    key={c.id}
                    className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl shrink-0">
                        {CARDIO_ICONS[c.activityType] || "⚡"}
                      </span>
                      <div>
                        <div className="font-bold text-[var(--foreground)] capitalize flex items-center gap-2">
                          <span>{c.activityType}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--accent)] border border-[var(--border)] uppercase font-semibold">
                            {c.intensity}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--muted-foreground)] font-mono mt-0.5 flex items-center gap-2">
                          {c.distance > 0 && (
                            <span>
                              {c.distance} {c.distanceUnit}
                            </span>
                          )}
                          {c.distance > 0 && c.durationMinutes > 0 && <span>•</span>}
                          {c.durationMinutes > 0 && (
                            <span>
                              {c.durationMinutes} min
                              {c.durationSeconds > 0 && ` (${formatTime(c.durationSeconds)})`}
                            </span>
                          )}
                        </div>
                        {c.notes && (
                          <p className="text-[11px] text-[var(--muted-foreground)] italic mt-0.5">
                            "{c.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {onDeleteCardio && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete this cardio session?`)) {
                            onDeleteCardio(c.id);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors flex items-center space-x-1 border border-transparent hover:border-red-500/20"
                        title="Delete cardio session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Discard</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
