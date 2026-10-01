"use client";

export type AppTheme = "marlo" | "dark" | "light" | "system";
export type WeightUnit = "lbs" | "kg";

export interface AppSettings {
  theme: AppTheme;
  restPreset1: number; // in seconds
  restPreset2: number; // in seconds
  weightUnit: WeightUnit;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "marlo",
  restPreset1: 90,
  restPreset2: 180,
  weightUnit: "lbs",
};

export function getSavedSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem("gymlo_settings");
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme || DEFAULT_SETTINGS.theme,
      restPreset1: Number(parsed.restPreset1) || DEFAULT_SETTINGS.restPreset1,
      restPreset2: Number(parsed.restPreset2) || DEFAULT_SETTINGS.restPreset2,
      weightUnit: parsed.weightUnit === "kg" ? "kg" : "lbs",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("gymlo_settings", JSON.stringify(settings));
    applyTheme(settings.theme);
  } catch (e) {
    console.error("Failed to save settings", e);
  }
}

export function applyTheme(theme: AppTheme): void {
  if (typeof document === "undefined") return;

  let effectiveTheme = theme;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    effectiveTheme = prefersDark ? "dark" : "light";
  }

  document.documentElement.setAttribute("data-theme", effectiveTheme);
}
