"use client";

import React, { useState } from "react";
import { X, Lock, Mail, User as UserIcon, LogOut, Check, Share2, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { CorgiLogo } from "./CorgiLogo";

export interface UserProfile {
  id: string;
  email: string | null;
  name: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  isFirstSetup: boolean;
  onAuthSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  currentUser,
  isFirstSetup,
  onAuthSuccess,
  onLogout,
}: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(isFirstSetup ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = tab === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload: any = { email, password };
      if (tab === "register" && name.trim()) {
        payload.name = name.trim();
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "An error occurred. Please try again.");
      } else {
        onAuthSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleShareApp = () => {
    if (typeof window === "undefined") return;
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-[var(--foreground)]">
            <div className="h-8 w-8 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center">
              <CorgiLogo size={20} className="text-[var(--accent-foreground)]" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {currentUser ? "My Account" : tab === "register" ? "Create Account" : "Welcome Back"}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 rounded-lg hover:bg-[var(--secondary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
          {currentUser ? (
            /* Logged In View */
            <div className="space-y-4">
              <div className="bg-[var(--secondary)]/60 border border-[var(--border)] rounded-xl p-4 flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] flex items-center justify-center font-black text-lg">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-sm text-[var(--foreground)] truncate">
                      {currentUser.name || "Gymlo Athlete"}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">{currentUser.email}</p>
                </div>
              </div>

              {/* Share with Friends */}
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                    Share with Friends
                  </span>
                  <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                  Send this link to your workout partners so they can create their own account, build routines, and track PRs!
                </p>
                <button
                  type="button"
                  onClick={handleShareApp}
                  className="w-full py-2.5 px-3 rounded-lg bg-[var(--secondary)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] text-[var(--foreground)] border border-[var(--border)] text-xs font-bold transition-all flex items-center justify-center space-x-2"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Link Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Copy App Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 px-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            /* Logged Out / Auth View */
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setTab("register");
                    setError(null);
                  }}
                  className={`py-2 rounded-lg transition-all ${
                    tab === "register"
                      ? "bg-[var(--secondary)] text-[var(--foreground)] shadow"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    setError(null);
                  }}
                  className={`py-2 rounded-lg transition-all ${
                    tab === "login"
                      ? "bg-[var(--secondary)] text-[var(--foreground)] shadow"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  Log In
                </button>
              </div>

              {/* Banner for initial account setup */}
              {tab === "register" && isFirstSetup && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-start space-x-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-200 leading-relaxed">
                    <strong>Primary Account Setup:</strong> Creating your account now will securely lock in all your existing routines, workouts, sets, and PRs so they stay permanently saved.
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {tab === "register" && (
                  <div>
                    <label className="text-[11px] font-bold uppercase text-[var(--muted-foreground)] block mb-1">
                      Your Name / Nickname
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold uppercase text-[var(--muted-foreground)] block mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="athlete@example.com"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-[var(--muted-foreground)] block mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-foreground)] font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Processing...</span>
                  ) : tab === "register" ? (
                    <>
                      <span>{isFirstSetup ? "Create Account & Keep Progress" : "Create My Account"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Log In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
