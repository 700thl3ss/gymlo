import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function calculateEstimated1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  // Brzycki formula: Weight × (36 / (37 - Reps))
  if (reps < 37) {
    return Math.round(weight * (36 / (37 - reps)) * 10) / 10;
  }
  // Epley formula fallback for high reps
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}
