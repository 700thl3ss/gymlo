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

/**
 * Calculates plate breakdown per side in standard gym plates (45, 35, 25, 10, 5, 2.5 lbs).
 * For barbells, always subtracts 45 lbs for the bar.
 * For plate-loaded machines (e.g. Leg Press), weight is divided equally per side (0 bar weight).
 */
export function formatPlateBreakdown(
  totalWeight: number,
  isBarbell: boolean = false
): string {
  if (totalWeight <= 0) return "—";

  let weightToDistribute = totalWeight;
  if (isBarbell) {
    if (totalWeight < 45) return "Bar only";
    if (totalWeight === 45) return "Empty bar";
    weightToDistribute = totalWeight - 45; // subtract 45lb barbell
  }

  // Weight loaded on each side
  const perSide = weightToDistribute / 2;
  if (perSide <= 0) return "—";

  const availablePlates = [45, 35, 25, 10, 5, 2.5];
  let remaining = perSide;
  const platesUsed: Record<number, number> = {};

  for (const plate of availablePlates) {
    const count = Math.floor(remaining / plate);
    if (count > 0) {
      platesUsed[plate] = count;
      remaining = Math.round((remaining - count * plate) * 10) / 10;
    }
  }

  const parts: string[] = [];
  if (platesUsed[45]) {
    parts.push(platesUsed[45] === 1 ? "1 plate" : `${platesUsed[45]} plates`);
  }
  for (const plate of [35, 25, 10, 5, 2.5]) {
    if (platesUsed[plate]) {
      parts.push(platesUsed[plate] > 1 ? `${platesUsed[plate]}×${plate}s` : `${plate}s`);
    }
  }

  if (parts.length === 0) {
    return `${perSide} /side`;
  }

  return parts.join(" + ");
}

