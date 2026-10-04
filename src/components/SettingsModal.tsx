"use client";

import React, { useState, useEffect } from "react";
import { X, Settings as SettingsIcon, Sun, Moon, Laptop, Palette, Timer, Check, User as UserIcon } from "lucide-react";
import { AppTheme, AppSettings, WeightUnit, getSavedSettings, saveSettings } from "@/lib/settings";
import { CorgiLogo } from "./CorgiLogo";
import { UserProfile } from "./AuthModal";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (newSettings: AppSettings) => void;
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onSettingsSaved,
  currentUser,
  onOpenAuthModal,
}: SettingsModalProps) {
  const [settings, setSettings] = useState<AppSettings>(getSavedSettings());
  const [preset1, setPreset1] = useState(settings.restPreset1);
  const [preset2, setPreset2] = useState(settings.restPreset2);
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(settings.theme);
  const [selectedUnit, setSelectedUnit] = useState<WeightUnit>(settings.weightUnit || "lbs");

  useEffect(() => {
    if (isOpen) {
      const current = getSavedSettings();
      setSettings(current);
      setPreset1(current.restPreset1);
      setPreset2(current.restPreset2);
      setSelectedTheme(current.theme);
      setSelectedUnit(current.weightUnit || "lbs");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleThemeChange = (newTheme: AppTheme) => {
    setSelectedTheme(newTheme);
    const updated = {
      ...settings,
      theme: newTheme,
      restPreset1: preset1,
      restPreset2: preset2,
      weightUnit: selectedUnit,
    };
    saveSettings(updated);
    if (onSettingsSaved) onSettingsSaved(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      theme: selectedTheme,
      restPreset1: Math.max(10, Number(preset1) || 90),
      restPreset2: Math.max(10, Number(preset2) || 180),
      weightUnit: selectedUnit,
    };
    saveSettings(updated);
    if (onSettingsSaved) onSettingsSaved(updated);
    onClose();
  };

  const themes: Array<{ id: AppTheme; label: string; desc: string; icon: React.ReactNode }> = [
    {
      id: "marlo",
      label: "Marlo Mode (Default)",
      desc: "Warm espresso, creamy parchment & corgi tan",
      icon: <CorgiLogo size={20} className="text-[var(--accent)]" />,
    },
    {
      id: "dark",
      label: "Dark Mode",
      desc: "Deep zinc dark interface",
      icon: <Moon className="w-5 h-5 text-blue-400" />,
    },
    {
      id: "light",
      label: "Light Mode",
      desc: "Clean high-contrast light theme",
      icon: <Sun className="w-5 h-5 text-amber-500" />,
    },
    {
      id: "system",
      label: "System",
      desc: "Automatically follows device appearance",
      icon: <Laptop className="w-5 h-5 text-[var(--muted-foreground)]" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[var(--foreground)]">
            <SettingsIcon className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="font-bold text-base">App Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-lg hover:bg-[var(--secondary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Account Profile Box */}
          <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center font-black text-sm shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[var(--foreground)] truncate">
                  {currentUser?.name || "Guest Athlete"}
                </div>
                <div className="text-[11px] text-[var(--muted-foreground)] truncate">
                  {currentUser?.email || "No account linked yet"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuthModal?.();
              }}
              className="px-3 py-1.5 rounded-lg bg-[var(--secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] text-[var(--foreground)] text-xs font-bold border border-[var(--border)] transition-colors shrink-0 ml-2"
            >
              {currentUser ? "Manage" : "Sign In / Register"}
            </button>
          </div>

          {/* Theme Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              <Palette className="w-4 h-4 text-[var(--accent)]" />
              <span>Appearance Theme</span>
            </div>

            <div className="space-y-2">
              {themes.map((t) => {
                const isSelected = selectedTheme === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-[var(--secondary)] border-[var(--accent)] text-[var(--foreground)]"
                        : "bg-[var(--background)] border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)]"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-lg bg-[var(--card)] border border-[var(--border)]">
                        {t.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[var(--foreground)]">{t.label}</div>
                        <div className="text-[11px] text-[var(--muted-foreground)]">{t.desc}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[var(--accent)] stroke-[3]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rest Timer Presets */}
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              <Timer className="w-4 h-4 text-[var(--accent)]" />
              <span>Rest Timer Presets</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Configure your two quick-access rest countdown times in seconds.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--background)] border border-[var(--border)] p-3 rounded-xl space-y-1">
                <label className="text-[11px] font-bold uppercase text-[var(--muted-foreground)] block">
                  Preset 1 (seconds)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="10"
                    max="600"
                    step="5"
                    value={preset1}
                    onChange={(e) => setPreset1(Number(e.target.value))}
                    className="w-full text-sm font-bold font-mono bg-[var(--card)] border border-[var(--border)] rounded-lg p-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <span className="text-xs text-[var(--muted-foreground)] font-mono">
                    {Math.floor(preset1 / 60)}m{preset1 % 60 ? ` ${preset1 % 60}s` : ""}
                  </span>
                </div>
              </div>

              <div className="bg-[var(--background)] border border-[var(--border)] p-3 rounded-xl space-y-1">
                <label className="text-[11px] font-bold uppercase text-[var(--muted-foreground)] block">
                  Preset 2 (seconds)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="10"
                    max="600"
                    step="5"
                    value={preset2}
                    onChange={(e) => setPreset2(Number(e.target.value))}
                    className="w-full text-sm font-bold font-mono bg-[var(--card)] border border-[var(--border)] rounded-lg p-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <span className="text-xs text-[var(--muted-foreground)] font-mono">
                    {Math.floor(preset2 / 60)}m{preset2 % 60 ? ` ${preset2 % 60}s` : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Unit Settings */}
          <div className="pt-2 border-t border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--foreground)] font-bold">Measurement Units</span>
              <span className="text-[10px] text-[var(--accent)] font-mono font-bold uppercase tracking-wider">
                {selectedUnit.toUpperCase()} selected
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedUnit("lbs")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center space-x-2 ${
                  selectedUnit === "lbs"
                    ? "bg-[var(--secondary)] border-[var(--accent)] text-[var(--foreground)]"
                    : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/50"
                }`}
              >
                <span>LBS (Pounds)</span>
                {selectedUnit === "lbs" && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedUnit("kg")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center space-x-2 ${
                  selectedUnit === "kg"
                    ? "bg-[var(--secondary)] border-[var(--accent)] text-[var(--foreground)]"
                    : "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/50"
                }`}
              >
                <span>KG (Kilograms)</span>
                {selectedUnit === "kg" && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-bold text-sm transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
