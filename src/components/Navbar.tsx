"use client";

import React, { useState } from "react";
import { Dumbbell, Calendar, BookOpen, Trophy, Settings as SettingsIcon, User as UserIcon } from "lucide-react";
import { CorgiLogo } from "./CorgiLogo";
import { SettingsModal } from "./SettingsModal";
import { AppSettings } from "@/lib/settings";
import { UserProfile } from "./AuthModal";

export type TabType = "workout" | "routines" | "exercises" | "history";

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  hasActiveWorkout: boolean;
  onSettingsChanged?: (settings: AppSettings) => void;
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  hasActiveWorkout,
  onSettingsChanged,
  currentUser,
  onOpenAuthModal,
}: NavbarProps) {
  const [showSettings, setShowSettings] = useState(false);

  const tabs = [
    {
      id: "workout" as TabType,
      label: "Workout",
      icon: Dumbbell,
      badge: hasActiveWorkout ? "ACTIVE" : undefined,
    },
    {
      id: "routines" as TabType,
      label: "Routines",
      icon: Calendar,
    },
    {
      id: "exercises" as TabType,
      label: "Exercises",
      icon: BookOpen,
    },
    {
      id: "history" as TabType,
      label: "History & PRs",
      icon: Trophy,
    },
  ];

  return (
    <>
      {/* Top Header — fills safe area so nothing shows behind it on iPhone */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--background)] header-safe">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setActiveTab("workout")}
          >
            <div className="h-11 w-11 rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center border border-[var(--border)]">
              <CorgiLogo size={28} className="text-[var(--accent-foreground)]" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-wider text-[var(--foreground)]">
                GYMLO
              </span>
            </div>
          </div>

          {/* Desktop Nav Links + Settings */}
          <div className="flex items-center space-x-2">
            <nav className="hidden md:flex items-center space-x-1 bg-[var(--card)] p-1 rounded-xl border border-[var(--border)]">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors relative ${
                      isActive
                        ? "bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)]"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-[var(--accent)]" : ""}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="bg-[var(--accent)] text-[var(--accent-foreground)] text-[10px] font-black px-1.5 py-0.5 rounded">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] transition-colors"
              title="Settings & Themes"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>

            {/* Account / Profile button */}
            <button
              onClick={onOpenAuthModal}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--border)] transition-colors text-xs font-bold text-[var(--foreground)]"
              title={currentUser ? `Account: ${currentUser.name}` : "Log In or Create Account"}
            >
              <div className="w-5 h-5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center text-[10px] font-black shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
              </div>
              <span className="hidden sm:inline max-w-[90px] truncate">
                {currentUser?.name || "Sign In"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar — respects iPhone home indicator */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--background)] border-t border-[var(--border)] bottom-nav-safe">
        <div className="grid grid-cols-4 h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center relative py-1 transition-colors ${
                  isActive ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? "text-[var(--accent)] stroke-[2.5]" : "stroke-[1.75]"}`} />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-2 w-2 h-2 bg-[var(--accent)] rounded-full" />
                  )}
                </div>
                <span className="text-[12px] font-semibold mt-1">{tab.label.split(" ")[0]}</span>
                {isActive && (
                  <div className="absolute bottom-0 w-8 h-0.5 bg-[var(--accent)] rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>


      {/* Settings Dialog */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsSaved={(newSettings) => {
          if (onSettingsChanged) onSettingsChanged(newSettings);
        }}
        currentUser={currentUser}
        onOpenAuthModal={onOpenAuthModal}
      />
    </>
  );
}
