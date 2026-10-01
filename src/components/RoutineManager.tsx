"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Play, Trash2, Dumbbell, X, Layers, Search, Pencil, GripVertical } from "lucide-react";

interface RoutineManagerProps {
  onStartRoutine: (routineId: string) => void;
  onStartQuickWorkout: () => void;
  onRoutinesChanged?: () => void;
}

export function RoutineManager({ onStartRoutine, onStartQuickWorkout, onRoutinesChanged }: RoutineManagerProps) {
  const [routines, setRoutines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<any | null>(null);
  const [availableExercises, setAvailableExercises] = useState<any[]>([]);

  const [routineName, setRoutineName] = useState("");
  const [routineDesc, setRoutineDesc] = useState("");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [selectedExercises, setSelectedExercises] = useState<
    Array<{ exerciseId: string; exerciseName: string; targetSets: number | string; targetReps: string; notes?: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Editing an exercise note inline (routine exercise tab)
  const [editingExNoteId, setEditingExNoteId] = useState<string | null>(null);

  // Routine-level drag-to-reorder state
  const [routineDragIndex, setRoutineDragIndex] = useState<number | null>(null);
  const [routineDropIndex, setRoutineDropIndex] = useState<number | null>(null);

  // Custom Exercise State inside Routine Modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customMuscle, setCustomMuscle] = useState("Chest");
  const [customCategory, setCustomCategory] = useState("Smith Machine");
  const [customEquipment, setCustomEquipment] = useState("");
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  const handleCreateCustomExercise = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customName.trim()) return;

    setIsCreatingCustom(true);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName.trim(),
          primaryMuscle: customMuscle,
          category: customCategory,
          equipment: customEquipment || customCategory,
        }),
      });
      const data = await res.json();
      if (data.success && data.exercise) {
        const newEx = data.exercise;
        setAvailableExercises((prev) => [newEx, ...prev]);
        setSelectedExercises((prev) => [
          ...prev,
          {
            exerciseId: newEx.id,
            exerciseName: newEx.name,
            targetSets: 2,
            targetReps: "",
            notes: "",
          },
        ]);
        setCustomName("");
        setCustomEquipment("");
        setShowCustomModal(false);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error("Failed to create custom exercise:", err);
    } finally {
      setIsCreatingCustom(false);
    }
  };

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/routines");
      const data = await res.json();
      if (data.success) {
        setRoutines(data.routines);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  useEffect(() => {
    if (showCreateModal && availableExercises.length === 0) {
      fetch("/api/exercises")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setAvailableExercises(data.exercises);
        })
        .catch(console.error);
    }
  }, [showCreateModal, availableExercises.length]);

  const openCreateRoutine = () => {
    setEditingRoutine(null);
    setRoutineName("");
    setRoutineDesc("");
    setSelectedExercises([]);
    setExerciseSearch("");
    setShowCreateModal(true);
  };

  const openEditRoutine = (routine: any) => {
    setEditingRoutine(routine);
    setRoutineName(routine.name || "");
    setRoutineDesc(routine.description || "");
    setSelectedExercises(
      (routine.exercises || []).map((re: any) => ({
        exerciseId: re.exerciseId || re.exercise?.id,
        exerciseName: re.exercise?.name || "Exercise",
        targetSets: re.targetSets || 2,
        targetReps: re.targetReps ? (re.targetReps.match(/\d+/) ? re.targetReps.match(/\d+/)[0] : "") : "",
        notes: re.notes || "",
      }))
    );
    setExerciseSearch("");
    setShowCreateModal(true);
  };

  const handleAddExerciseToRoutine = (ex: any) => {
    if (selectedExercises.some((item) => item.exerciseId === ex.id)) return;
    setSelectedExercises([
      ...selectedExercises,
      { exerciseId: ex.id, exerciseName: ex.name, targetSets: 2, targetReps: "", notes: "" },
    ]);
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ index: number; position: "before" | "after" } | null>(null);
  const exerciseListRef = useRef<HTMLDivElement | null>(null);
  const modalFormRef = useRef<HTMLFormElement | null>(null);

  const handleRemoveExerciseFromRoutine = (exId: string) => {
    setSelectedExercises(selectedExercises.filter((item) => item.exerciseId !== exId));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setDropTarget(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Auto-scroll the exercise list container when dragging near top or bottom edges
    const container = exerciseListRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const mouseY = e.clientY;
      const edgeThreshold = 50;

      if (mouseY - rect.top < edgeThreshold) {
        const factor = Math.max(1, (edgeThreshold - (mouseY - rect.top)) / 8);
        container.scrollTop -= factor * 5;
      } else if (rect.bottom - mouseY < edgeThreshold) {
        const factor = Math.max(1, (edgeThreshold - (rect.bottom - mouseY)) / 8);
        container.scrollTop += factor * 5;
      }
    }

    // Auto-scroll modal form if cursor hits modal boundary
    const formContainer = modalFormRef.current;
    if (formContainer) {
      const formRect = formContainer.getBoundingClientRect();
      const mouseY = e.clientY;
      if (mouseY - formRect.top < 40) {
        formContainer.scrollTop -= 10;
      } else if (formRect.bottom - mouseY < 40) {
        formContainer.scrollTop += 10;
      }
    }

    if (draggedIndex === null || draggedIndex === index) {
      setDropTarget(null);
      return;
    }

    // Determine whether cursor is in the top or bottom half of the hovered item
    const targetElement = e.currentTarget as HTMLElement;
    const itemRect = targetElement.getBoundingClientRect();
    const midY = itemRect.top + itemRect.height / 2;
    const position: "before" | "after" = e.clientY < midY ? "before" : "after";

    // Don't show redundant gap immediately next to the dragged element
    if (
      (position === "before" && index === draggedIndex + 1) ||
      (position === "after" && index === draggedIndex - 1)
    ) {
      setDropTarget(null);
      return;
    }

    setDropTarget({ index, position });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || dropTarget === null) {
      setDraggedIndex(null);
      setDropTarget(null);
      return;
    }

    const { index: targetIndex, position } = dropTarget;
    if (draggedIndex !== targetIndex) {
      const updated = [...selectedExercises];
      const [draggedItem] = updated.splice(draggedIndex, 1);
      
      let insertionIndex = targetIndex;
      if (position === "after") {
        insertionIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
      } else {
        insertionIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
      }

      updated.splice(Math.max(0, Math.min(updated.length, insertionIndex)), 0, draggedItem);
      setSelectedExercises(updated);
    }

    setDraggedIndex(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTarget(null);
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineName.trim()) return;

    setIsSubmitting(true);
    try {
      const normalizedExercises = selectedExercises.map((item) => ({
        ...item,
        targetSets: parseInt(String(item.targetSets), 10) || 2,
        targetReps: String(item.targetReps || ""),
      }));

      if (editingRoutine) {
        // Update existing routine
        const res = await fetch(`/api/routines/${editingRoutine.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: routineName,
            description: routineDesc,
            exercises: normalizedExercises,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowCreateModal(false);
          setEditingRoutine(null);
          setRoutineName("");
          setRoutineDesc("");
          setSelectedExercises([]);
          fetchRoutines();
          onRoutinesChanged?.();
        }
      } else {
        // Create new routine
        const res = await fetch("/api/routines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: routineName,
            description: routineDesc,
            exercises: normalizedExercises,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowCreateModal(false);
          setRoutineName("");
          setRoutineDesc("");
          setSelectedExercises([]);
          fetchRoutines();
          onRoutinesChanged?.();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (!confirm("Are you sure you want to delete this routine?")) return;
    try {
      const res = await fetch(`/api/routines/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setRoutines(routines.filter((r) => r.id !== id));
        onRoutinesChanged?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered exercises for routine modal
  const filteredExercises = availableExercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      ex.primaryMuscle.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      (ex.equipment && ex.equipment.toLowerCase().includes(exerciseSearch.toLowerCase()));
    const matchesCat =
      filterCategory === "All" || ex.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ["All", "Smith Machine", "Machine", "Barbell", "Dumbbell", "Cable"];

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card)] border border-[var(--border)] p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-black text-[var(--foreground)] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--accent)]" /> Workout Routines
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Pick a routine to launch your session with pre-filled sets, or build a custom program.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onStartQuickWorkout}
            className="px-4 py-2.5 rounded-xl bg-[var(--secondary)] hover:opacity-90 text-[var(--foreground)] font-bold text-xs transition-colors border border-[var(--border)] flex items-center space-x-1.5"
          >
            <Play className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)]" />
            <span>Quick Start</span>
          </button>
          <button
            onClick={openCreateRoutine}
            className="px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-bold text-xs transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Routine</span>
          </button>
        </div>
      </div>

      {/* Routine Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-[var(--muted-foreground)] text-sm">Loading routines...</div>
      ) : routines.length === 0 ? (
        <div className="text-center py-12 bg-[var(--card)] border border-dashed border-[var(--border)] rounded-2xl p-8">
          <Dumbbell className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[var(--foreground)]">No routines yet</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Create your first workout routine to easily track your sessions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routines.map((routine, rIdx) => {
            const isDragging = routineDragIndex === rIdx;
            const isDropTarget = routineDropIndex === rIdx && routineDragIndex !== rIdx;
            return (
              <div
                key={routine.id}
                draggable
                onDragStart={(e) => {
                  setRoutineDragIndex(rIdx);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setRoutineDropIndex(rIdx);
                }}
                onDrop={() => {
                  if (routineDragIndex === null || routineDragIndex === rIdx) return;
                  const reordered = [...routines];
                  const [moved] = reordered.splice(routineDragIndex, 1);
                  reordered.splice(rIdx, 0, moved);
                  setRoutines(reordered);
                  setRoutineDragIndex(null);
                  setRoutineDropIndex(null);
                  // Persist order: PATCH each routine with new orderIndex
                  Promise.all(
                    reordered.map((r, i) =>
                      fetch(`/api/routines/${r.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderIndex: i }),
                      })
                    )
                  )
                    .then(() => onRoutinesChanged?.())
                    .catch(console.error);
                }}
                onDragEnd={() => {
                  setRoutineDragIndex(null);
                  setRoutineDropIndex(null);
                }}
                className={`bg-[var(--card)] border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  isDragging
                    ? "opacity-40 scale-95 border-[var(--accent)]"
                    : isDropTarget
                    ? "border-[var(--accent)] border-dashed shadow-lg"
                    : "border-[var(--border)] hover:border-[var(--accent)]"
                }`}
              >
                {/* Grip + Card Header */}
                <div
                  onClick={() => openEditRoutine(routine)}
                  className="cursor-pointer"
                  title="Tap to edit"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <GripVertical className="w-4 h-4 text-[var(--muted-foreground)] shrink-0 cursor-grab active:cursor-grabbing" />
                      <h3 className="text-base font-bold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors truncate">
                        {routine.name}
                      </h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoutine(routine.id);
                      }}
                      className="text-[var(--muted-foreground)] hover:text-red-500 p-1 rounded-lg transition-colors ml-1"
                      title="Delete routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {routine.description && (
                    <p className="text-xs text-[var(--muted-foreground)] mt-1.5 line-clamp-2 ml-6">
                      {routine.description}
                    </p>
                  )}

                  {/* Exercises Preview */}
                  <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--muted-foreground)]">
                      {routine.exercises?.length || 0} Exercises:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {routine.exercises?.slice(0, 5).map((re: any) => (
                        <span
                          key={re.id}
                          className="text-[11px] font-medium bg-[var(--secondary)] text-[var(--foreground)] px-2 py-0.5 rounded border border-[var(--border)]"
                        >
                          {re.exercise?.name} ({re.targetSets} sets)
                        </span>
                      ))}
                      {(routine.exercises?.length || 0) > 5 && (
                        <span className="text-[11px] font-semibold text-[var(--muted-foreground)] py-0.5 px-1">
                          +{(routine.exercises?.length || 0) - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Start Routine Button */}
                <button
                  onClick={() => onStartRoutine(routine.id)}
                  className="mt-5 w-full py-3 rounded-xl bg-[var(--secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] text-[var(--foreground)] font-bold text-sm border border-[var(--border)] transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Routine</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Routine Modal with Enhanced Search */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  {editingRoutine ? "Edit Routine" : "Create New Routine"}
                </h3>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  {editingRoutine
                    ? "Update routine name, notes, and exercises"
                    : "Build a program with target sets and reps"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingRoutine(null);
                }}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-lg hover:bg-[var(--secondary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={modalFormRef} onSubmit={handleSaveRoutine} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Routine Name *</label>
                <input
                  type="text"
                  required
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  placeholder="e.g. Upper Body Hypertrophy"
                  className="w-full mt-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Description</label>
                <textarea
                  rows={2}
                  value={routineDesc}
                  onChange={(e) => setRoutineDesc(e.target.value)}
                  placeholder="Brief notes or focus areas..."
                  className="w-full mt-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* Selected Routine Exercises */}
              <div>
                <label className="text-xs font-bold uppercase text-[var(--muted-foreground)] block mb-2">
                  Routine Exercises ({selectedExercises.length})
                </label>
                {selectedExercises.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)] italic bg-[var(--background)] p-3 rounded-xl border border-[var(--border)]">
                    No exercises added yet. Search and click an exercise below to add it.
                  </p>
                ) : (
                  <div
                    ref={exerciseListRef}
                    className="space-y-2 max-h-64 overflow-y-auto scroll-smooth p-0.5"
                  >
                    {selectedExercises.map((item, idx) => {
                      const isDragging = draggedIndex === idx;
                      const isDropTargetBefore = dropTarget?.index === idx && dropTarget?.position === "before";
                      const isDropTargetAfter = dropTarget?.index === idx && dropTarget?.position === "after";

                      return (
                        <div key={item.exerciseId} className="flex flex-col">
                          {/* Top drop slot / space maker */}
                          {isDropTargetBefore && (
                            <div className="h-9 my-1 rounded-xl border-2 border-dashed border-[var(--accent)] bg-[var(--accent)]/10 flex items-center justify-center transition-all duration-200 animate-pulse">
                              <span className="text-[11px] font-bold text-[var(--accent)] tracking-wider uppercase">
                                Drop here
                              </span>
                            </div>
                          )}

                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={handleDrop}
                            onDragEnd={handleDragEnd}
                            className={`bg-[var(--background)] border p-2.5 rounded-xl flex items-center justify-between gap-2 transition-all duration-200 ease-out ${
                              isDragging
                                ? "opacity-30 scale-[0.97] border-dashed border-[var(--accent)] bg-[var(--accent)]/5"
                                : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                            }`}
                          >
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              {/* 3-dot / grip handle for dragging between, on top, or below */}
                              <div
                                className="cursor-grab active:cursor-grabbing text-[var(--muted-foreground)] hover:text-[var(--accent)] p-0.5 rounded transition-colors touch-none"
                                title="Drag to reorder"
                              >
                                <GripVertical className="w-4 h-4 stroke-[2.2]" />
                              </div>

                              <span className="font-mono text-xs font-bold text-[var(--accent)] w-4 shrink-0">
                                {idx + 1}.
                              </span>
                              <span
                                className="text-xs font-bold text-[var(--foreground)] truncate select-none cursor-pointer hover:text-[var(--accent)] transition-colors"
                                title="Tap to add/edit note for this exercise"
                                onClick={() =>
                                  setEditingExNoteId(
                                    editingExNoteId === item.exerciseId ? null : item.exerciseId
                                  )
                                }
                              >
                                {item.exerciseName}
                                <span className="ml-1 text-[var(--muted-foreground)] text-[10px]">
                                  {item.notes ? "✏️" : "+ note"}
                                </span>
                              </span>
                            </div>
                            {/* Inline note editor */}
                            {editingExNoteId === item.exerciseId && (
                              <div className="mt-1.5 ml-5">
                                <textarea
                                  autoFocus
                                  rows={2}
                                  placeholder="Add a note for this exercise (e.g. weight, settings, cues)..."
                                  value={item.notes || ""}
                                  onChange={(e) =>
                                    setSelectedExercises(
                                      selectedExercises.map((ex) =>
                                        ex.exerciseId === item.exerciseId
                                          ? { ...ex, notes: e.target.value }
                                          : ex
                                      )
                                    )
                                  }
                                  className="w-full bg-[var(--background)] border border-[var(--accent)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none resize-none"
                                />
                              </div>
                            )}
                            <div className="flex items-center space-x-2 text-xs shrink-0">
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={item.targetSets === undefined ? "" : item.targetSets}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, "");
                                  setSelectedExercises(
                                    selectedExercises.map((ex) =>
                                      ex.exerciseId === item.exerciseId ? { ...ex, targetSets: val } : ex
                                    )
                                  );
                                }}
                                onBlur={() => {
                                  setSelectedExercises(
                                    selectedExercises.map((ex) => {
                                      if (ex.exerciseId !== item.exerciseId) return ex;
                                      const num = parseInt(String(ex.targetSets), 10);
                                      return { ...ex, targetSets: isNaN(num) || num < 1 ? 2 : num };
                                    })
                                  );
                                }}
                                placeholder="2"
                                className="w-12 text-center bg-[var(--card)] border border-[var(--border)] rounded py-1 text-[var(--foreground)] font-mono focus:outline-none focus:border-[var(--accent)]"
                                title="Target sets"
                              />
                              <span className="text-[var(--muted-foreground)]">sets</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveExerciseFromRoutine(item.exerciseId)}
                                className="text-[var(--muted-foreground)] hover:text-red-500 p-1 ml-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Bottom drop slot / space maker */}
                          {isDropTargetAfter && (
                            <div className="h-9 my-1 rounded-xl border-2 border-dashed border-[var(--accent)] bg-[var(--accent)]/10 flex items-center justify-center transition-all duration-200 animate-pulse">
                              <span className="text-[11px] font-bold text-[var(--accent)] tracking-wider uppercase">
                                Drop here
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SEARCH & ADD EXERCISE SECTION */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
                      Search & Add Exercises
                    </label>
                    <span className="text-[11px] text-[var(--muted-foreground)] font-mono">
                      ({filteredExercises.length} available)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!showCustomModal && exerciseSearch) {
                        setCustomName(exerciseSearch);
                      }
                      setShowCustomModal(!showCustomModal);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] text-[var(--accent)] border border-[var(--border)] transition-colors flex items-center space-x-1"
                    title="Add custom exercise"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Custom Exercise</span>
                  </button>
                </div>

                {/* Inline Custom Exercise Creator */}
                {showCustomModal && (
                  <div className="bg-[var(--background)] border border-[var(--accent)] rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-[var(--accent)]">
                        <Dumbbell className="w-3.5 h-3.5" />
                        <span>Create Custom Exercise</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCustomModal(false)}
                        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--muted-foreground)] block">
                          Exercise Name *
                        </label>
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="e.g. Incline Smith Shrug, Belt Squat..."
                          className="w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-[var(--muted-foreground)] block">
                            Primary Muscle *
                          </label>
                          <select
                            value={customMuscle}
                            onChange={(e) => setCustomMuscle(e.target.value)}
                            className="w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                          >
                            {[
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
                            ].map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-[var(--muted-foreground)] block">
                            Category
                          </label>
                          <select
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                          >
                            {[
                              "Smith Machine",
                              "Machine",
                              "Barbell",
                              "Dumbbell",
                              "Cable",
                              "Bodyweight",
                              "Other",
                            ].map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-[var(--muted-foreground)] block">
                          Equipment / Notes (optional)
                        </label>
                        <input
                          type="text"
                          value={customEquipment}
                          onChange={(e) => setCustomEquipment(e.target.value)}
                          placeholder="e.g. Lever Machine, Smith Machine, Cable..."
                          className="w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                        />
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowCustomModal(false)}
                          className="px-3 py-1.5 rounded-lg text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateCustomExercise}
                          disabled={isCreatingCustom || !customName.trim()}
                          className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] font-bold text-xs disabled:opacity-50 transition-opacity flex items-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>{isCreatingCustom ? "Creating..." : "Add to Routine"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Bar with Search Icon */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--muted-foreground)]" />
                  <input
                    type="text"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder="Search Smith machine, bench, curl, squat..."
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl pl-9 pr-8 py-2 text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  {exerciseSearch && (
                    <button
                      type="button"
                      onClick={() => setExerciseSearch("")}
                      className="absolute right-2.5 top-2.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors border ${
                        filterCategory === cat
                          ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent"
                          : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-[var(--border)]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Available Exercise List */}
                <div className="max-h-44 overflow-y-auto divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl bg-[var(--background)]">
                  {filteredExercises.length === 0 ? (
                    <div className="text-center py-5 px-3 text-xs text-[var(--muted-foreground)] space-y-2">
                      <p>No matching exercises found.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomName(exerciseSearch);
                          setShowCustomModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[var(--secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] text-[var(--foreground)] font-bold text-xs border border-[var(--border)] transition-colors inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create "{exerciseSearch || "Custom Exercise"}"</span>
                      </button>
                    </div>
                  ) : (
                    filteredExercises.map((ex) => {
                      const isAdded = selectedExercises.some((s) => s.exerciseId === ex.id);
                      return (
                        <button
                          type="button"
                          key={ex.id}
                          disabled={isAdded}
                          onClick={() => handleAddExerciseToRoutine(ex)}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                            isAdded
                              ? "opacity-40 cursor-not-allowed bg-[var(--card)]"
                              : "hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-[var(--foreground)]">{ex.name}</span>
                            <span className="text-[10px] text-[var(--muted-foreground)] ml-2">
                              {ex.primaryMuscle} • {ex.category}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[var(--accent)]">
                            {isAdded ? "Added" : "+ Add"}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !routineName.trim()}
                  className="w-full py-3 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-bold text-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingRoutine ? "Save Changes" : "Save Routine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
