"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Activity,
  Calendar,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Award,
  Trash2,
  Settings2,
  X,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { WorkoutCalendar } from "./WorkoutCalendar";

export function HistoryAndStats({ unit = "lbs" }: { unit?: "lbs" | "kg" } = {}) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [cardioSessions, setCardioSessions] = useState<any[]>([]);
  const [recordsData, setRecordsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [historyView, setHistoryView] = useState<"calendar" | "list">("calendar");

  // Customize PR Showcase state
  const [isEditingPrs, setIsEditingPrs] = useState(false);
  const [hiddenPrExercises, setHiddenPrExercises] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("gymlo_hidden_prs");
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workoutsRes, recordsRes, cardioRes] = await Promise.all([
        fetch("/api/workouts"),
        fetch("/api/records"),
        fetch("/api/cardio"),
      ]);

      const workoutsJson = await workoutsRes.json();
      const recordsJson = await recordsRes.json();
      const cardioJson = await cardioRes.json();

      if (workoutsJson.success) setWorkouts(workoutsJson.workouts || []);
      if (recordsJson.success) setRecordsData(recordsJson);
      if (cardioJson.success) setCardioSessions(cardioJson.cardioSessions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to delete workout:", err);
    }
  };

  const handleDeleteCardio = async (id: string) => {
    try {
      const res = await fetch(`/api/cardio/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to delete cardio:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedWorkoutId(expandedWorkoutId === id ? null : id);
  };

  const stats = recordsData?.stats || {
    totalWorkouts: 0,
    totalLifetimeVolume: 0,
    totalCompletedSets: 0,
    totalHours: 0,
  };

  const records = recordsData?.records || [];
  const chartData = recordsData?.volumeChartData || [];

  const maxVolume = chartData.reduce(
    (max: number, item: any) => Math.max(max, item.volume),
    1
  );

  return (
    <div className="space-y-6 pb-24">
      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
          <div className="flex items-center space-x-2 text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider">
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            <span>Workouts</span>
          </div>
          <p className="font-mono text-2xl font-black text-[var(--foreground)] mt-2">
            {stats.totalWorkouts}
          </p>
          <span className="text-[11px] text-[var(--muted-foreground)]">Logged sessions</span>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
          <div className="flex items-center space-x-2 text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
            <span>Lifetime Vol</span>
          </div>
          <p className="font-mono text-2xl font-black text-[var(--accent)] mt-2">
            {stats.totalLifetimeVolume > 1000
              ? `${(stats.totalLifetimeVolume / 1000).toFixed(1)}k`
              : stats.totalLifetimeVolume}{" "}
            <span className="text-xs font-normal text-[var(--muted-foreground)]">{unit}</span>
          </p>
          <span className="text-[11px] text-[var(--muted-foreground)]">Total weight moved</span>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
          <div className="flex items-center space-x-2 text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider">
            <Dumbbell className="w-4 h-4 text-[var(--accent)]" />
            <span>Sets Finished</span>
          </div>
          <p className="font-mono text-2xl font-black text-[var(--foreground)] mt-2">
            {stats.totalCompletedSets}
          </p>
          <span className="text-[11px] text-[var(--muted-foreground)]">Completed sets</span>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
          <div className="flex items-center space-x-2 text-[var(--muted-foreground)] text-xs font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-[var(--accent)]" />
            <span>Gym Time</span>
          </div>
          <p className="font-mono text-2xl font-black text-[var(--foreground)] mt-2">
            {stats.totalHours} <span className="text-xs font-normal text-[var(--muted-foreground)]">hrs</span>
          </p>
          <span className="text-[11px] text-[var(--muted-foreground)]">Total active time</span>
        </div>
      </div>

      {/* Volume Progression Chart */}
      {chartData.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="font-bold text-sm text-[var(--foreground)]">Volume History ({unit} per session)</h3>
            </div>
            <span className="text-xs text-[var(--muted-foreground)] font-mono">Last {chartData.length} sessions</span>
          </div>

          <div className="h-40 flex items-end gap-2 pt-4 px-2">
            {chartData.slice(-14).map((item: any, i: number) => {
              const heightPct = Math.max(12, Math.round((item.volume / maxVolume) * 100));
              return (
                <div key={item.id || i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-[var(--secondary)] text-[var(--foreground)] text-[10px] font-mono p-1.5 rounded border border-[var(--border)] pointer-events-none whitespace-nowrap z-20">
                    {item.name}: {item.volume} {unit} ({item.durationMinutes}m)
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] rounded-t bg-[var(--accent)] hover:opacity-80 transition-colors"
                  />
                  <span className="text-[9px] font-mono text-[var(--muted-foreground)] truncate max-w-[36px]">
                    {item.date ? item.date.slice(5) : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Personal Records Showcase */}
      {records.length > 0 && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="font-bold text-base text-[var(--foreground)]">Personal Records (PRs)</h3>
              <span className="text-xs font-mono text-[var(--muted-foreground)]">
                ({records.filter((g: any) => !hiddenPrExercises.includes(g.exerciseName)).length}/{records.length})
              </span>
            </div>

            <button
              onClick={() => setIsEditingPrs(!isEditingPrs)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 ${
                isEditingPrs
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-[var(--border)]"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{isEditingPrs ? "Done Editing" : "Customize"}</span>
            </button>
          </div>

          {/* Quick Selection Guide when editing */}
          {isEditingPrs && (
            <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs flex items-center justify-between gap-2">
              <span className="text-[var(--muted-foreground)]">
                Tap the eye icon on any exercise card to show or hide it from your PR showcase.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setHiddenPrExercises([]);
                    try {
                      localStorage.removeItem("gymlo_hidden_prs");
                    } catch (e) {}
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] font-semibold hover:border-[var(--accent)] border border-[var(--border)] text-[11px]"
                >
                  Show All
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {records
              .filter((group: any) => isEditingPrs || !hiddenPrExercises.includes(group.exerciseName))
              .map((group: any) => {
                const isHidden = hiddenPrExercises.includes(group.exerciseName);
                const best1RM = group.records.find((r: any) => r.recordType === "ESTIMATED_1RM");
                const maxWeight = group.records.find((r: any) => r.recordType === "MAX_WEIGHT");

                const toggleVisibility = () => {
                  let updated: string[];
                  if (isHidden) {
                    updated = hiddenPrExercises.filter((name) => name !== group.exerciseName);
                  } else {
                    updated = [...hiddenPrExercises, group.exerciseName];
                  }
                  setHiddenPrExercises(updated);
                  try {
                    localStorage.setItem("gymlo_hidden_prs", JSON.stringify(updated));
                  } catch (e) {}
                };

                return (
                  <div
                    key={group.exerciseName}
                    className={`bg-[var(--background)] border rounded-xl p-3.5 space-y-2 transition-all ${
                      isHidden
                        ? "opacity-40 border-dashed border-[var(--border)]"
                        : "border-[var(--border)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isEditingPrs && (
                          <button
                            onClick={toggleVisibility}
                            className={`p-1 rounded-md transition-colors ${
                              isHidden
                                ? "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                                : "text-[var(--accent)] bg-[var(--secondary)]"
                            }`}
                            title={isHidden ? "Click to show" : "Click to hide"}
                          >
                            {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <h4 className="text-xs font-bold text-[var(--foreground)] truncate max-w-[140px]">
                          {group.exerciseName}
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold text-[var(--foreground)] bg-[var(--secondary)] px-1.5 py-0.5 rounded border border-[var(--border)] shrink-0">
                        {group.primaryMuscle}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
                      <div>
                        <span className="text-[10px] uppercase text-[var(--muted-foreground)] font-bold block">
                          Est 1RM
                        </span>
                        <span className="text-sm font-mono font-black text-[var(--accent)]">
                          {best1RM ? `${best1RM.value} ${unit}` : "—"}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase text-[var(--muted-foreground)] font-bold block">
                          Heaviest
                        </span>
                        <span className="text-sm font-mono font-bold text-[var(--foreground)]">
                          {maxWeight ? `${maxWeight.value} ${unit}` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Workout History Log with Calendar View (Default) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-[var(--foreground)] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--accent)]" /> Workout History Log
          </h3>

          {/* View Mode Toggle: Calendar vs List */}
          <div className="flex items-center space-x-1 bg-[var(--secondary)] p-1 rounded-xl border border-[var(--border)] text-xs">
            <button
              onClick={() => setHistoryView("calendar")}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                historyView === "calendar"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setHistoryView("list")}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                historyView === "list"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              List
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-[var(--muted-foreground)] text-sm">Loading history...</div>
        ) : workouts.length === 0 && cardioSessions.length === 0 ? (
          <div className="text-center py-12 bg-[var(--card)] border border-dashed border-[var(--border)] rounded-2xl p-8">
            <Award className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[var(--foreground)]">No completed workouts yet</h4>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Start your first session from the Workout or Routines tab!
            </p>
          </div>
        ) : historyView === "calendar" ? (
          <WorkoutCalendar
            workouts={workouts}
            cardioSessions={cardioSessions}
            onDeleteWorkout={handleDeleteWorkout}
            onDeleteCardio={handleDeleteCardio}
            unit={unit}
          />
        ) : (
          <div className="space-y-3">
            {workouts.map((w) => {
              const isExpanded = expandedWorkoutId === w.id;
              const completedDate = new Date(w.completedAt || w.startedAt).toLocaleDateString(
                undefined,
                {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                }
              );

              return (
                <div
                  key={w.id}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden transition-colors"
                >
                  <div
                    onClick={() => toggleExpand(w.id)}
                    className="p-4 cursor-pointer hover:bg-[var(--secondary)] transition-colors flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-[var(--foreground)]">{w.name}</h4>
                        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">
                          {completedDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                          {formatTime(w.durationSeconds)}
                        </span>
                        <span>•</span>
                        <span className="text-[var(--accent)] font-mono font-bold">
                          {w.totalVolume} {unit}
                        </span>
                        <span>•</span>
                        <span>{w.completedSetsCount} sets</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Discard "${w.name}" workout session? This will permanently delete it from your history.`
                            )
                          ) {
                            handleDeleteWorkout(w.id);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors flex items-center space-x-1 border border-transparent hover:border-red-500/20"
                        title="Discard this workout"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Discard</span>
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[var(--muted-foreground)]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--muted-foreground)]" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Workout Sets Breakdown */}
                  {isExpanded && (
                    <div className="p-4 bg-[var(--background)] border-t border-[var(--border)] space-y-3 text-xs">
                      {w.notes && (
                        <p className="text-[var(--muted-foreground)] italic bg-[var(--card)] p-2.5 rounded-lg border border-[var(--border)]">
                          "{w.notes}"
                        </p>
                      )}

                      <div className="space-y-2">
                        {w.sets.map((s: any) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between py-1.5 px-3 bg-[var(--card)] rounded-lg border border-[var(--border)]"
                          >
                            <span className="font-semibold text-[var(--foreground)]">
                              {s.exercise?.name} (Set {s.setNumber})
                            </span>
                            <div className="font-mono text-[var(--muted-foreground)]">
                              <span className="text-[var(--accent)] font-bold">{s.weight} {unit}</span> ×{" "}
                              <span className="text-[var(--foreground)]">{s.reps} reps</span>
                              {s.rpe && <span className="text-[var(--muted-foreground)] ml-1">@RPE{s.rpe}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
