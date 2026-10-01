"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Check,
  Plus,
  Trash2,
  Clock,
  Dumbbell,
  Trophy,
  X,
  Search,
  Timer,
  CheckCircle2,
  Flame,
  Target,
} from "lucide-react";
import confetti from "canvas-confetti";
import { formatTime, formatPlateBreakdown } from "@/lib/utils";
import { RestTimer } from "./RestTimer";
import { CorgiLogo } from "./CorgiLogo";
import { CardioSection } from "./CardioSection";
import { getSavedSettings } from "@/lib/settings";

interface ActiveWorkoutViewProps {
  workout: any;
  previousPerformances: Record<string, any[]>;
  recordsToBeat?: Record<string, { maxWeight: number; maxReps: number }>;
  onWorkoutUpdated: () => void;
  onWorkoutFinished: () => void;
  unit?: "lbs" | "kg";
}

export function ActiveWorkoutView({
  workout,
  previousPerformances,
  recordsToBeat = {},
  onWorkoutUpdated,
  onWorkoutFinished,
  unit = "lbs",
}: ActiveWorkoutViewProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [setsData, setSetsData] = useState<any[]>(workout.sets || []);
  const [workoutName, setWorkoutName] = useState(workout.name || "Workout");
  const [workoutNotes, setWorkoutNotes] = useState(workout.notes || "");
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [finishModalData, setFinishModalData] = useState<{
    open: boolean;
    duration: number;
    volume: number;
    completedSets: number;
    newPRs: any[];
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const prevWorkoutIdRef = useRef<string | null>(null);

  useEffect(() => {
    const incoming = workout.sets || [];
    if (workout.id !== prevWorkoutIdRef.current) {
      // Different (or first-loaded) workout — full reset is correct
      prevWorkoutIdRef.current = workout.id;
      setSetsData(incoming);
    } else {
      // Same workout re-fetched (e.g. after addSet / removeSet).
      // Merge: accept all server fields EXCEPT notes, which we keep from
      // local state so in-flight / unsaved note text isn't clobbered.
      setSetsData((prev) => {
        const localMap = new Map(prev.map((s: any) => [s.id, s]));
        // Build the new list from the server order, preserving local notes
        const merged = incoming.map((dbSet: any) => {
          const local = localMap.get(dbSet.id);
          // If we have a locally-edited version, keep its notes value
          return local !== undefined
            ? { ...dbSet, notes: local.notes }
            : dbSet;
        });
        return merged;
      });
    }
    setWorkoutName(workout.name || "Workout");
    setWorkoutNotes(workout.notes || "");
  }, [workout]);

  useEffect(() => {
    const startTime = new Date(workout.startedAt).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [workout.startedAt]);

  useEffect(() => {
    if (showAddExerciseModal && availableExercises.length === 0) {
      fetch("/api/exercises")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setAvailableExercises(data.exercises);
        })
        .catch(console.error);
    }
  }, [showAddExerciseModal, availableExercises.length]);

  const handleSetChange = (setId: string, field: string, value: any) => {
    let sanitizedValue = value;
    if (field === "reps") {
      if (value === "") sanitizedValue = "";
      else sanitizedValue = Math.max(0, parseInt(value, 10) || 0);
    } else if (field === "weight") {
      if (value === "") sanitizedValue = "";
      else sanitizedValue = Math.max(0, parseFloat(value) || 0);
    }

    setSetsData((prev) =>
      prev.map((s) => (s.id === setId ? { ...s, [field]: sanitizedValue } : s))
    );
  };

  const addWeightToSet = (setId: string, increment: number) => {
    const currentSet = setsData.find((s) => s.id === setId);
    const currentWeight = parseFloat(currentSet?.weight) || 0;
    const nextWeight = Math.max(0, Math.round((currentWeight + increment) * 10) / 10);
    handleSetChange(setId, "weight", nextWeight);
  };

  const resetSetWeight = (setId: string) => {
    handleSetChange(setId, "weight", 0);
  };

  const handleUpdateExerciseNote = (exerciseId: string, noteValue: string) => {
    setSetsData((prev) =>
      prev.map((s) => (s.exerciseId === exerciseId ? { ...s, notes: noteValue } : s))
    );

    fetch(`/api/workouts/${workout.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updateExerciseNotes: { exerciseId, notes: noteValue },
      }),
    }).catch(console.error);
  };

  const toggleSetCompleted = async (setId: string) => {
    const targetSet = setsData.find((s) => s.id === setId);
    if (!targetSet) return;
    const nextCompleted = !targetSet.isCompleted;

    const updatedSets = setsData.map((s) =>
      s.id === setId ? { ...s, isCompleted: nextCompleted } : s
    );
    setSetsData(updatedSets);

    if (nextCompleted) {
      setShowRestTimer(true);
    }

    try {
      await fetch(`/api/workouts/${workout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sets: [{ id: setId, ...targetSet, isCompleted: nextCompleted }],
        }),
      });
    } catch (err) {
      console.error("Failed to sync set:", err);
    }
  };

  const addSetToExercise = async (exerciseId: string) => {
    try {
      const res = await fetch(`/api/workouts/${workout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addSetForExerciseId: exerciseId }),
      });
      const data = await res.json();
      if (data.success) {
        onWorkoutUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeSet = async (setId: string) => {
    try {
      const res = await fetch(`/api/workouts/${workout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeSetId: setId }),
      });
      const data = await res.json();
      if (data.success) {
        onWorkoutUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addExercise = async (exerciseId: string) => {
    try {
      setShowAddExerciseModal(false);
      const res = await fetch(`/api/workouts/${workout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addExerciseId: exerciseId }),
      });
      const data = await res.json();
      if (data.success) {
        onWorkoutUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const removeExercise = async (exerciseId: string) => {
    if (!confirm("Remove this exercise and all its sets from current workout?")) return;
    try {
      const res = await fetch(`/api/workouts/${workout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeExerciseId: exerciseId }),
      });
      const data = await res.json();
      if (data.success) {
        onWorkoutUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const finishWorkout = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/workouts/${workout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workoutName,
          notes: workoutNotes,
          sets: setsData,
          finishWorkout: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        let vol = 0;
        let cSets = 0;
        for (const s of data.workout.sets) {
          if (s.isCompleted) {
            cSets++;
            vol += s.weight * s.reps;
          }
        }

        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#976232", "#c48a52", "#fdfbf7", "#4a423d"],
        });

        setFinishModalData({
          open: true,
          duration: data.workout.durationSeconds || elapsedSeconds,
          volume: Math.round(vol),
          completedSets: cSets,
          newPRs: data.newPRs || [],
        });
      }
    } catch (err) {
      console.error("Failed to finish workout:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const discardWorkout = async () => {
    if (!confirm("Discard this workout session?")) return;
    try {
      const res = await fetch(`/api/workouts/${workout.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        onWorkoutFinished();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exerciseMap: Record<string, { exercise: any; sets: any[] }> = {};
  for (const set of setsData) {
    if (!exerciseMap[set.exerciseId]) {
      exerciseMap[set.exerciseId] = {
        exercise: set.exercise,
        sets: [],
      };
    }
    exerciseMap[set.exerciseId].sets.push(set);
  }

  // Preserve routine exercise order first, followed by any dynamically added exercises
  const orderedExerciseIds: string[] = [];
  if (workout.routine?.exercises?.length) {
    const routineOrder = [...workout.routine.exercises]
      .sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((re: any) => re.exerciseId || re.exercise?.id);
    for (const exId of routineOrder) {
      if (exerciseMap[exId] && !orderedExerciseIds.includes(exId)) {
        orderedExerciseIds.push(exId);
      }
    }
  }
  for (const set of setsData) {
    if (set.exerciseId && !orderedExerciseIds.includes(set.exerciseId) && exerciseMap[set.exerciseId]) {
      orderedExerciseIds.push(set.exerciseId);
    }
  }
  const orderedExerciseGroups = orderedExerciseIds
    .map((id) => exerciseMap[id])
    .filter(Boolean);

  const filteredExercises = availableExercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.primaryMuscle.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      (ex.equipment && ex.equipment.toLowerCase().includes(exerciseSearch.toLowerCase()));
    const matchesMuscle =
      selectedMuscle === "All" || ex.primaryMuscle === selectedMuscle;
    const matchesCategory =
      selectedCategory === "All" || ex.category === selectedCategory;
    return matchesSearch && matchesMuscle && matchesCategory;
  });

  const muscleFilters = [
    "All",
    "Chest",
    "Back",
    "Shoulders",
    "Quads",
    "Hamstrings",
    "Glutes",
    "Biceps",
    "Triceps",
    "Core",
    "Calves",
  ];

  const categoryFilters = ["All", "Smith Machine", "Machine", "Barbell", "Dumbbell", "Cable", "Bodyweight"];

  return (
    <div className="space-y-6 pb-28">
      {/* Rest Timer */}
      {showRestTimer && (
        <RestTimer onClose={() => setShowRestTimer(false)} />
      )}

      {/* Top Banner & Workout Header */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)]">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                Live Session
              </span>
              <div className="flex items-center space-x-1 text-[var(--muted-foreground)] text-xs font-mono font-medium">
                <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>
            </div>

            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="text-2xl font-black text-[var(--foreground)] bg-transparent border-b border-transparent hover:border-[var(--border)] focus:border-[var(--accent)] focus:outline-none transition-colors w-full"
              placeholder="Workout Name..."
            />
          </div>

          {/* Action buttons with Dedicated Rest Button */}
          <div className="flex items-center space-x-2 flex-wrap">
            {/* Rest Button */}
            <button
              onClick={() => setShowRestTimer(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--secondary)] text-[var(--foreground)] hover:border-[var(--accent)] border border-[var(--border)] transition-colors flex items-center space-x-1.5"
              title="Open Rest Timer"
            >
              <Timer className="w-4 h-4 text-[var(--accent)]" />
              <span>Rest Timer</span>
            </button>

            <button
              onClick={discardWorkout}
              className="px-3 py-2 rounded-xl text-xs font-bold text-[var(--muted-foreground)] hover:text-red-500 hover:bg-[var(--secondary)] transition-colors"
            >
              Discard
            </button>

            <button
              onClick={finishWorkout}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-bold text-sm transition-colors flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSaving ? "Saving..." : "Finish Workout"}</span>
            </button>
          </div>
        </div>

        {/* Workout Notes */}
        <div className="mt-4 pt-3 border-t border-[var(--border)]">
          <input
            type="text"
            value={workoutNotes}
            onChange={(e) => setWorkoutNotes(e.target.value)}
            placeholder="Add general workout notes..."
            className="w-full text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] bg-[var(--background)] rounded-lg px-3 py-2 border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {orderedExerciseGroups.map(({ exercise, sets }) => {
          const prevHistory = previousPerformances[exercise.id] || [];
          const serverBeat = recordsToBeat[exercise.id];

          // Compute highest weight & reps from server records or previous performance fallback
          let maxW = serverBeat ? serverBeat.maxWeight : 0;
          let maxR = serverBeat ? serverBeat.maxReps : 0;
          if (maxW === 0 && prevHistory.length > 0) {
            for (const s of prevHistory) {
              if (s.weight > maxW) maxW = s.weight;
              if (s.reps > maxR) maxR = s.reps;
            }
          }
          const beatTarget = { maxWeight: maxW, maxReps: maxR };

          const isBarbell =
            exercise?.category === "Barbell" ||
            exercise?.name?.toLowerCase().includes("barbell") ||
            (exercise?.equipment?.toLowerCase().includes("barbell") && !exercise?.name?.toLowerCase().includes("smith"));

          const isPlateLoaded =
            isBarbell ||
            exercise?.category === "Smith Machine" ||
            exercise?.name?.toLowerCase().includes("smith") ||
            exercise?.name?.toLowerCase().includes("leg press") ||
            exercise?.name?.toLowerCase().includes("hack squat") ||
            exercise?.name?.toLowerCase().includes("calf raise") ||
            exercise?.equipment?.toLowerCase().includes("smith") ||
            exercise?.equipment?.toLowerCase().includes("leg press") ||
            exercise?.equipment?.toLowerCase().includes("plate loaded");

          return (
            <div
              key={exercise.id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sm:p-5"
            >
              {/* Exercise Header */}
              <div className="flex items-start justify-between pb-3 border-b border-[var(--border)] mb-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                    {exercise.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-semibold text-[var(--foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded border border-[var(--border)]">
                      {exercise.primaryMuscle}
                    </span>
                    {exercise.category && (
                      <span className="text-[11px] font-semibold text-[var(--accent)] bg-[var(--secondary)] px-2 py-0.5 rounded border border-[var(--border)]">
                        {exercise.category}
                      </span>
                    )}
                    {exercise.equipment && (
                      <span className="text-[11px] font-medium text-[var(--muted-foreground)] bg-[var(--background)] px-2 py-0.5 rounded border border-[var(--border)]">
                        {exercise.equipment}
                      </span>
                    )}

                    {(beatTarget.maxWeight > 0 || beatTarget.maxReps > 0) && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                        <Flame className="w-3 h-3 text-amber-500 stroke-[2.5]" />
                        <span>To Beat:</span>
                        {beatTarget.maxWeight > 0 && (
                          <span>{beatTarget.maxWeight} {unit}</span>
                        )}
                        {beatTarget.maxWeight > 0 && beatTarget.maxReps > 0 && <span>·</span>}
                        {beatTarget.maxReps > 0 && (
                          <span>{beatTarget.maxReps} reps</span>
                        )}
                      </span>
                    )}

                    {/* Open space: Editable Description / Machine Settings */}
                    <div className="flex-1 min-w-[200px] max-w-lg">
                      <input
                        type="text"
                        value={sets[0]?.notes || ""}
                        onChange={(e) => handleUpdateExerciseNote(exercise.id, e.target.value)}
                        placeholder="Settings / notes (e.g. pin #6, seat 3)..."
                        className="w-full text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] bg-[var(--background)] px-2.5 py-1 rounded-md border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeExercise(exercise.id)}
                  className="text-[var(--muted-foreground)] hover:text-red-500 p-1.5 rounded-lg hover:bg-[var(--secondary)] transition-colors"
                  title="Remove exercise"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Sets Table - LBS UNITS ONLY */}
              <div className="space-y-2">
                <div
                  className={`grid gap-2 text-[11px] font-bold text-[var(--muted-foreground)] px-2 uppercase tracking-wider ${
                    isPlateLoaded ? "grid-cols-12" : "grid-cols-10"
                  }`}
                >
                  <div className="col-span-1 text-center">Set</div>
                  {isPlateLoaded && (
                    <div
                      className="col-span-3 text-center truncate"
                      title={isBarbell ? "Plates per side (-45 bar)" : "Plates per side"}
                    >
                      Plates/Side
                    </div>
                  )}
                  <div
                    className={`${
                      isPlateLoaded ? "col-span-3" : "col-span-4"
                    } text-center flex flex-col items-center`}
                  >
                    <span>{unit.toUpperCase()}</span>
                    {beatTarget && beatTarget.maxWeight > 0 && (
                      <span
                        className="text-[9px] font-semibold text-[var(--accent)] normal-case tracking-normal flex items-center gap-0.5"
                        title={`Current highest weight to beat: ${beatTarget.maxWeight} ${unit}`}
                      >
                        <Flame className="w-2.5 h-2.5 text-[var(--accent)] inline" />
                        Beat: {beatTarget.maxWeight}
                      </span>
                    )}
                  </div>
                  <div
                    className={`${
                      isPlateLoaded ? "col-span-3" : "col-span-3"
                    } text-center flex flex-col items-center`}
                  >
                    <span>Reps</span>
                    {beatTarget && beatTarget.maxReps > 0 && (
                      <span
                        className="text-[9px] font-semibold text-[var(--accent)] normal-case tracking-normal flex items-center gap-0.5"
                        title={`Current highest reps to beat: ${beatTarget.maxReps} reps`}
                      >
                        <Target className="w-2.5 h-2.5 text-[var(--accent)] inline" />
                        Beat: {beatTarget.maxReps}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-center">Done</div>
                </div>

                {sets.map((set, sIdx) => {
                  const prevSet = prevHistory[sIdx];
                  const currentW = parseFloat(set.weight) || 0;
                  const currentR = parseInt(set.reps, 10) || 0;
                  const beatsWeight = beatTarget && beatTarget.maxWeight > 0 && currentW > beatTarget.maxWeight;
                  const beatsReps = beatTarget && beatTarget.maxReps > 0 && currentR > beatTarget.maxReps;

                  // Plate breakdown per side (subtracting 45lbs for barbell)
                  const plateDisplay = isPlateLoaded
                    ? (currentW > 0
                        ? formatPlateBreakdown(currentW, isBarbell)
                        : (prevSet?.weight ? formatPlateBreakdown(prevSet.weight, isBarbell) : "—"))
                    : "";

                  return (
                    <div
                      key={set.id}
                      className={`p-2 rounded-xl border transition-colors space-y-1.5 ${
                        set.isCompleted
                          ? "bg-[var(--secondary)] border-[var(--accent)] text-[var(--foreground)]"
                          : "bg-[var(--background)] border-[var(--border)] hover:border-[var(--muted-foreground)]"
                      }`}
                    >
                      <div
                        className={`grid gap-2 items-center ${
                          isPlateLoaded ? "grid-cols-12" : "grid-cols-10"
                        }`}
                      >
                        <div className="col-span-1 text-center font-bold text-sm text-[var(--foreground)]">
                          {set.setNumber}
                        </div>

                        {isPlateLoaded && (
                          <div
                            className="col-span-3 text-[11px] font-mono text-[var(--accent)] font-semibold text-center truncate"
                            title={plateDisplay}
                          >
                            {plateDisplay}
                          </div>
                        )}

                        {/* Weight */}
                        <div className={`${isPlateLoaded ? "col-span-3" : "col-span-4"} relative`}>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            onKeyDown={(e) => {
                              if (e.key === "-" || e.key === "e") e.preventDefault();
                            }}
                            value={set.weight || ""}
                            onChange={(e) =>
                              handleSetChange(set.id, "weight", e.target.value)
                            }
                            placeholder={beatTarget?.maxWeight ? `> ${beatTarget.maxWeight}` : unit}
                            className={`w-full text-center text-sm font-semibold font-mono bg-[var(--card)] border rounded-lg py-1.5 focus:outline-none text-[var(--foreground)] transition-colors ${
                              beatsWeight
                                ? "border-amber-500/80 ring-1 ring-amber-500/50"
                                : "border-[var(--border)] focus:border-[var(--accent)]"
                            }`}
                          />
                          {beatsWeight && (
                            <span className="absolute -top-1.5 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          )}
                        </div>

                        {/* Reps */}
                        <div className="col-span-3 relative">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            onKeyDown={(e) => {
                              if (e.key === "-" || e.key === "e") e.preventDefault();
                            }}
                            value={set.reps || ""}
                            onChange={(e) =>
                              handleSetChange(set.id, "reps", e.target.value)
                            }
                            placeholder={beatTarget?.maxReps ? `> ${beatTarget.maxReps}` : "0"}
                            className={`w-full text-center text-sm font-semibold font-mono bg-[var(--card)] border rounded-lg py-1.5 focus:outline-none text-[var(--foreground)] transition-colors ${
                              beatsReps
                                ? "border-amber-500/80 ring-1 ring-amber-500/50"
                                : "border-[var(--border)] focus:border-[var(--accent)]"
                            }`}
                          />
                          {beatsReps && (
                            <span className="absolute -top-1.5 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          )}
                        </div>

                        <div className="col-span-2 flex items-center justify-center space-x-1">
                          <button
                            onClick={() => toggleSetCompleted(set.id)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              set.isCompleted
                                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                                : "bg-[var(--secondary)] hover:opacity-90 text-[var(--muted-foreground)]"
                            }`}
                          >
                            <Check className={`w-4 h-4 stroke-[2.5] ${set.isCompleted ? "text-[var(--accent-foreground)]" : "text-[var(--muted-foreground)]"}`} />
                          </button>
                          <button
                            onClick={() => removeSet(set.id)}
                            className="text-[var(--muted-foreground)] hover:text-red-500 p-1 transition-colors"
                            title="Delete set"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Plate Quick Adders for Smith Machine and Barbell */}
                      {isPlateLoaded && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--border)]/60 text-xs">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted-foreground)] mr-0.5">
                            Plates:
                          </span>
                          {[2.5, 5, 10, 25, 35, 45].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => addWeightToSet(set.id, val)}
                              title={`Add ${val} lbs`}
                              className="px-2 py-0.5 text-[11px] font-bold font-mono rounded-md bg-[var(--secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] text-[var(--foreground)] border border-[var(--border)] active:scale-95 transition-all shadow-sm"
                            >
                              +{val}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => resetSetWeight(set.id)}
                            title="Reset weight to 0"
                            className="px-1.5 py-0.5 text-[10px] font-medium font-mono rounded-md bg-transparent hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-500 border border-[var(--border)] active:scale-95 transition-all ml-auto"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Set Button */}
              <div className="mt-3 pt-2">
                <button
                  onClick={() => addSetToExercise(exercise.id)}
                  className="flex items-center space-x-1.5 text-xs font-bold text-[var(--foreground)] hover:text-[var(--accent)] py-1.5 px-3 rounded-lg bg-[var(--secondary)] hover:opacity-90 border border-[var(--border)] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Set</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Exercise Button */}
        <button
          onClick={() => setShowAddExerciseModal(true)}
          className="w-full py-4 rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-bold text-sm transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5 stroke-[2]" />
          <span>Add Exercise to Session</span>
        </button>

        {/* Dedicated Cardio Section */}
        <CardioSection
          workoutSessionId={workout.id}
          onSessionLogged={onWorkoutUpdated}
        />
      </div>

      {/* Add Exercise Modal (Search Button & Filter Chips) */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Dumbbell className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="font-bold text-base text-[var(--foreground)]">Select Exercise</h3>
              </div>
              <button
                onClick={() => setShowAddExerciseModal(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-lg hover:bg-[var(--secondary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-[var(--border)] space-y-3">
              {/* Search Bar with Search Icon */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  placeholder="Search Smith machine, cable, dumbbells..."
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl pl-9 pr-8 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
                />
                {exerciseSearch && (
                  <button
                    onClick={() => setExerciseSearch("")}
                    className="absolute right-2.5 top-2.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Category Pills (Smith Machine, Machine, etc.) */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                {categoryFilters.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors border ${
                      selectedCategory === c
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent"
                        : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-[var(--border)]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Muscle Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                {muscleFilters.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMuscle(m)}
                    className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors border ${
                      selectedMuscle === m
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent"
                        : "bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-[var(--border)]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2 overflow-y-auto flex-1 divide-y divide-[var(--border)]">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted-foreground)] text-sm">
                  No exercises matching your filter.
                </div>
              ) : (
                filteredExercises.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => addExercise(ex.id)}
                    className="w-full text-left p-3 rounded-xl hover:bg-[var(--secondary)] transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-sm text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                        {ex.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--muted-foreground)]">
                        <span className="font-medium text-[var(--foreground)]">{ex.primaryMuscle}</span>
                        <span>•</span>
                        <span>{ex.category}</span>
                        {ex.equipment && (
                          <>
                            <span>•</span>
                            <span>{ex.equipment}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Workout Finished Celebration Modal - LBS ONLY */}
      {finishModalData?.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] text-[var(--accent-foreground)] mx-auto flex items-center justify-center mb-4">
              <CorgiLogo size={36} className="text-[var(--accent-foreground)]" />
            </div>

            <h2 className="text-2xl font-black text-[var(--foreground)]">Workout Complete!</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Solid session. Stats and personal records have been saved.
            </p>

            <div className="grid grid-cols-3 gap-3 my-6">
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Duration</span>
                <p className="font-mono text-lg font-black text-[var(--foreground)] mt-1">
                  {formatTime(finishModalData.duration)}
                </p>
              </div>
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Volume</span>
                <p className="font-mono text-lg font-black text-[var(--accent)] mt-1">
                  {finishModalData.volume} <span className="text-xs">{unit}</span>
                </p>
              </div>
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Sets</span>
                <p className="font-mono text-lg font-black text-[var(--foreground)] mt-1">
                  {finishModalData.completedSets}
                </p>
              </div>
            </div>

            {finishModalData.newPRs.length > 0 && (
              <div className="bg-[var(--secondary)] border border-[var(--accent)]/50 rounded-xl p-3.5 mb-6 text-left">
                <div className="flex items-center space-x-1.5 text-[var(--accent)] font-bold text-xs mb-2">
                  <Trophy className="w-4 h-4" />
                  <span>NEW PERSONAL RECORDS!</span>
                </div>
                <div className="space-y-1">
                  {finishModalData.newPRs.map((pr: any) => (
                    <div key={pr.id} className="flex justify-between items-center text-xs">
                      <span className="text-[var(--foreground)] font-semibold">{pr.exercise?.name}</span>
                      <span className="font-mono font-bold text-[var(--accent)]">
                        {pr.value} {unit} (Est 1RM)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setFinishModalData(null);
                onWorkoutFinished();
              }}
              className="w-full py-3 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-bold text-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
