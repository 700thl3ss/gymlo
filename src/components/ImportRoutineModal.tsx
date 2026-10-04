"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Check, Download, Dumbbell, Sparkles } from "lucide-react";

interface ImportRoutineModalProps {
  routineId: string | null;
  onClose: () => void;
  onRoutineImported: () => void;
}

export function ImportRoutineModal({
  routineId,
  onClose,
  onRoutineImported,
}: ImportRoutineModalProps) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [routine, setRoutine] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    if (!routineId) return;
    setLoading(true);
    setError(null);
    setImported(false);

    fetch(`/api/routines/share/${routineId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.routine) {
          setRoutine(data.routine);
        } else {
          setError(data.error || "Failed to load shared routine.");
        }
      })
      .catch((err) => setError(err.message || "Network error"))
      .finally(() => setLoading(false));
  }, [routineId]);

  if (!routineId) return null;

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch(`/api/routines/share/${routineId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setImported(true);
        onRoutineImported();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || "Failed to import routine.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to import routine.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[var(--foreground)]">
            <Calendar className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="font-bold text-base">Import Shared Routine</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-lg hover:bg-[var(--secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-8 text-center text-sm text-[var(--muted-foreground)] animate-pulse">
              Loading routine details...
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3.5 rounded-xl">
              {error}
            </div>
          ) : routine ? (
            <>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-black text-[var(--foreground)]">{routine.name}</h4>
                  <span className="text-[10px] font-bold bg-[var(--secondary)] text-[var(--muted-foreground)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                    Shared Routine
                  </span>
                </div>
                {routine.description && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">{routine.description}</p>
                )}
                <p className="text-[11px] text-[var(--muted-foreground)] mt-1.5 flex items-center space-x-1">
                  <span>Created by:</span>
                  <strong className="text-[var(--foreground)]">{routine.creatorName}</strong>
                </p>
              </div>

              {/* Exercises List */}
              <div className="border border-[var(--border)] rounded-xl bg-[var(--background)] p-3 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--muted-foreground)] block">
                  Exercises Included ({routine.exercises.length}):
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {routine.exercises.map((ex: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)]"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <Dumbbell className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                        <span className="font-semibold text-[var(--foreground)] truncate">{ex.name}</span>
                      </div>
                      <span className="text-[11px] text-[var(--muted-foreground)] shrink-0 ml-2">
                        {ex.targetSets} sets • {ex.targetReps || "8-12"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              {imported ? (
                <div className="py-3 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>Added to Your Routines!</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full py-3 px-4 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{importing ? "Adding to Library..." : "Add to My Routines"}</span>
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
