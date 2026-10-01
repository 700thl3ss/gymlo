"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar, TabType } from "@/components/Navbar";
import { ActiveWorkoutView } from "@/components/ActiveWorkoutView";
import { RoutineManager } from "@/components/RoutineManager";
import { ExerciseLibrary } from "@/components/ExerciseLibrary";
import { HistoryAndStats } from "@/components/HistoryAndStats";
import {
  Play,
  Dumbbell,
  Sparkles,
  Layers,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { CorgiLogo } from "@/components/CorgiLogo";
import { CardioSection } from "@/components/CardioSection";
import { getSavedSettings, applyTheme } from "@/lib/settings";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("workout");
  const [activeWorkout, setActiveWorkout] = useState<any | null>(null);
  const [previousPerformances, setPreviousPerformances] = useState<Record<string, any[]>>({});
  const [recordsToBeat, setRecordsToBeat] = useState<Record<string, { maxWeight: number; maxReps: number }>>({});
  const [loadingActiveWorkout, setLoadingActiveWorkout] = useState(true);
  const [routines, setRoutines] = useState<any[]>([]);
  const [settings, setSettings] = useState(() => getSavedSettings());

  // Apply theme on initial load
  useEffect(() => {
    const s = getSavedSettings();
    setSettings(s);
    applyTheme(s.theme);
  }, []);

  // Fetch active workout
  const fetchActiveWorkout = useCallback(async () => {
    try {
      const res = await fetch("/api/workouts/active");
      const data = await res.json();
      if (data.success && data.workout) {
        setActiveWorkout(data.workout);
        setPreviousPerformances(data.previousPerformances || {});
        setRecordsToBeat(data.recordsToBeat || {});
      } else {
        setActiveWorkout(null);
        setPreviousPerformances({});
        setRecordsToBeat({});
      }
    } catch (err) {
      console.error("Failed to check active workout:", err);
    } finally {
      setLoadingActiveWorkout(false);
    }
  }, []);

  // Fetch quick routines for home start view
  const fetchRoutines = useCallback(async () => {
    try {
      const res = await fetch("/api/routines");
      const data = await res.json();
      if (data.success) {
        setRoutines(data.routines || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchActiveWorkout();
    fetchRoutines();
  }, [fetchActiveWorkout, fetchRoutines]);

  // Start workout from routine
  const startRoutineWorkout = async (routineId: string) => {
    try {
      const res = await fetch("/api/workouts/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routineId }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveWorkout(data.workout);
        setActiveTab("workout");
        fetchActiveWorkout();
      } else if (data.error) {
        alert(data.error);
        if (data.activeWorkoutId) {
          fetchActiveWorkout();
          setActiveTab("workout");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Start empty / quick workout
  const startQuickWorkout = async () => {
    try {
      const res = await fetch("/api/workouts/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Quick Workout" }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveWorkout(data.workout);
        setActiveTab("workout");
        fetchActiveWorkout();
      } else if (data.error) {
        alert(data.error);
        if (data.activeWorkoutId) {
          fetchActiveWorkout();
          setActiveTab("workout");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans selection:bg-[var(--accent)] selection:text-[var(--accent-foreground)]">
      {/* Top Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveWorkout={Boolean(activeWorkout)}
        onSettingsChanged={(newSettings) => {
          setSettings(newSettings);
          applyTheme(newSettings.theme);
        }}
      />

      {/* Persistent Active Workout Banner */}
      {activeWorkout && activeTab !== "workout" && (
        <div
          onClick={() => setActiveTab("workout")}
          className="bg-[var(--accent)] text-[var(--accent-foreground)] font-black text-xs px-4 py-2.5 flex items-center justify-between cursor-pointer border-b border-[var(--border)] transition-opacity hover:opacity-90"
        >
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-foreground)]" />
            <span>SESSION IN PROGRESS: {activeWorkout.name}</span>
          </div>
          <span className="flex items-center gap-1 font-mono uppercase tracking-wider text-[11px]">
            Resume <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {activeTab === "workout" && (
          <>
            {loadingActiveWorkout ? (
              <div className="py-20 text-center text-[var(--muted-foreground)] text-sm">
                Checking active session...
              </div>
            ) : activeWorkout ? (
              <ActiveWorkoutView
                workout={activeWorkout}
                previousPerformances={previousPerformances}
                recordsToBeat={recordsToBeat}
                onWorkoutUpdated={fetchActiveWorkout}
                onWorkoutFinished={() => {
                  fetchActiveWorkout();
                  setActiveTab("history");
                }}
                unit={settings.weightUnit}
              />
            ) : (
              /* Start Workout Dashboard */
              <div className="space-y-6 pb-20">
                {/* Hero Card */}
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 sm:p-8">
                  <div className="max-w-xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)]">
                      <CorgiLogo size={18} className="text-[var(--accent)]" />
                      <span>Ready to Lift</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
                      Log your workout. Beat your numbers.
                    </h1>

                    <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                      Track sets, reps, weight in lbs, and rest intervals.
                      Select a routine below or jump straight into an empty workout.
                    </p>

                    <div className="pt-2 flex flex-wrap gap-3">
                      <button
                        onClick={startQuickWorkout}
                        className="px-6 py-3 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-bold text-sm transition-opacity flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Quick Empty Workout</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("routines")}
                        className="px-5 py-3 rounded-xl bg-[var(--secondary)] hover:opacity-90 text-[var(--foreground)] font-bold text-sm border border-[var(--border)] transition-colors flex items-center space-x-2"
                      >
                        <Layers className="w-4 h-4 text-[var(--accent)]" />
                        <span>Explore Routines</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Start from Routine Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[var(--accent)]" /> Quick Start from Routine
                    </h2>
                    <button
                      onClick={() => setActiveTab("routines")}
                      className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-0.5"
                    >
                      View All <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {routines.slice(0, 3).map((rt) => (
                      <div
                        key={rt.id}
                        onClick={() => startRoutineWorkout(rt.id)}
                        className="bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] p-4 rounded-xl cursor-pointer transition-colors group flex flex-col justify-between"
                      >
                        <div>
                          <h3 className="font-bold text-sm text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                            {rt.name}
                          </h3>
                          <span className="text-[11px] text-[var(--muted-foreground)] mt-1 block">
                            {rt.exercises?.length || 0} exercises
                          </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs font-bold text-[var(--accent)] pt-2 border-t border-[var(--border)]">
                          <span>Start Routine</span>
                          <Play className="w-3 h-3 fill-current" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Navigation Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div
                    onClick={() => setActiveTab("exercises")}
                    className="bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] p-4 rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-lg bg-[var(--secondary)] text-[var(--accent)]">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--foreground)]">Exercise Directory</h4>
                        <p className="text-xs text-[var(--muted-foreground)]">Browse 80+ lifts, Smith Machine & gym machines</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </div>

                  <div
                    onClick={() => setActiveTab("history")}
                    className="bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] p-4 rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-lg bg-[var(--secondary)] text-[var(--accent)]">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--foreground)]">PRs & Performance</h4>
                        <p className="text-xs text-[var(--muted-foreground)]">Track volume in lbs and estimated 1RMs</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </div>
                </div>

                {/* Cardio Section on Workout Dashboard */}
                <div className="pt-2">
                  <CardioSection />
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "routines" && (
          <RoutineManager
            onStartRoutine={startRoutineWorkout}
            onStartQuickWorkout={startQuickWorkout}
          />
        )}

        {activeTab === "exercises" && <ExerciseLibrary />}

        {activeTab === "history" && <HistoryAndStats unit={settings.weightUnit} />}
      </main>
    </div>
  );
}
