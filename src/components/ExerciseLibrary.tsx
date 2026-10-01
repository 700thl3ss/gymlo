"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Dumbbell, BookOpen, X, ChevronRight } from "lucide-react";

export function ExerciseLibrary() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [customName, setCustomName] = useState("");
  const [customMuscle, setCustomMuscle] = useState("Chest");
  const [customCategory, setCustomCategory] = useState("Smith Machine");
  const [customEquipment, setCustomEquipment] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedMuscle !== "All") params.append("muscle", selectedMuscle);
      if (selectedCategory !== "All") params.append("category", selectedCategory);

      const res = await fetch(`/api/exercises?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setExercises(data.exercises);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchExercises, 200);
    return () => clearTimeout(timer);
  }, [search, selectedMuscle, selectedCategory]);

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName,
          primaryMuscle: customMuscle,
          category: customCategory,
          equipment: customEquipment || "Standard",
          instructions: customInstructions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setCustomName("");
        setCustomEquipment("");
        setCustomInstructions("");
        fetchExercises();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const muscles = [
    "All",
    "Chest",
    "Back",
    "Shoulders",
    "Quads",
    "Hamstrings",
    "Glutes",
    "Biceps",
    "Triceps",
    "Forearms",
    "Core",
    "Calves",
  ];

  const categories = [
    "All",
    "Smith Machine",
    "Machine",
    "Barbell",
    "Dumbbell",
    "Cable",
    "Bodyweight",
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card)] border border-[var(--border)] p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-black text-[var(--foreground)] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--accent)]" /> Exercise Library
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Explore 80+ standard movements including Smith Machine and specialized gym machines.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-bold text-xs transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Exercise</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises by name, Smith machine, equipment..."
            className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl pl-10 pr-8 py-3 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors border ${
                selectedCategory === c
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-transparent"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-[var(--border)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Muscle group filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {muscles.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMuscle(m)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors border ${
                selectedMuscle === m
                  ? "bg-[var(--secondary)] text-[var(--foreground)] border-[var(--accent)]"
                  : "bg-[var(--background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border-[var(--border)]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises List Grid */}
      {loading ? (
        <div className="py-12 text-center text-[var(--muted-foreground)] text-sm">Loading exercises...</div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-12 bg-[var(--card)] border border-dashed border-[var(--border)] rounded-2xl p-8">
          <Dumbbell className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[var(--foreground)]">No exercises found</h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Try adjusting your search or category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              onClick={() => setSelectedExercise(ex)}
              className="bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)] p-4 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                    {ex.name}
                  </h4>
                  {ex.isCustom && (
                    <span className="text-[10px] font-bold text-[var(--accent)] bg-[var(--secondary)] px-1.5 py-0.2 rounded border border-[var(--border)]">
                      CUSTOM
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <span className="text-[var(--foreground)] font-medium">{ex.primaryMuscle}</span>
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

              <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors" />
            </div>
          ))}
        </div>
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedExercise(null)}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-lg hover:bg-[var(--secondary)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 text-[var(--accent)] mb-2">
              <Dumbbell className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Exercise Info</span>
            </div>

            <h3 className="text-xl font-black text-[var(--foreground)]">{selectedExercise.name}</h3>

            <div className="grid grid-cols-2 gap-2 my-4">
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-2.5">
                <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Target Muscle</span>
                <p className="text-xs font-bold text-[var(--accent)] mt-0.5">
                  {selectedExercise.primaryMuscle}
                </p>
              </div>
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-2.5">
                <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Category</span>
                <p className="text-xs font-bold text-[var(--foreground)] mt-0.5">{selectedExercise.category}</p>
              </div>
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-2.5 col-span-2">
                <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">Equipment</span>
                <p className="text-xs font-medium text-[var(--foreground)] mt-0.5">
                  {selectedExercise.equipment || "Standard gym equipment"}
                </p>
              </div>
            </div>

            {selectedExercise.instructions && (
              <div className="mt-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] block mb-1">
                  Technique & Instructions
                </span>
                <p className="text-xs text-[var(--foreground)] leading-relaxed bg-[var(--background)] p-3 rounded-xl border border-[var(--border)]">
                  {selectedExercise.instructions}
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedExercise(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-[var(--secondary)] hover:opacity-90 text-[var(--foreground)] font-bold text-xs border border-[var(--border)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create Custom Exercise Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h3 className="font-bold text-base text-[var(--foreground)]">Create Custom Exercise</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-lg hover:bg-[var(--secondary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExercise} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Exercise Name *</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Smith Machine JM Press"
                  className="w-full mt-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Muscle *</label>
                  <select
                    value={customMuscle}
                    onChange={(e) => setCustomMuscle(e.target.value)}
                    className="w-full mt-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    {muscles.filter((m) => m !== "All").map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Category *</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full mt-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    {categories.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Equipment</label>
                <input
                  type="text"
                  value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value)}
                  placeholder="e.g. Smith Machine, Cable Tower, etc."
                  className="w-full mt-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">Instructions / Notes</label>
                <textarea
                  rows={2}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Form cues, angle adjustments..."
                  className="w-full mt-1.5 bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !customName.trim()}
                className="w-full py-3 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-bold text-sm transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Save Exercise"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
