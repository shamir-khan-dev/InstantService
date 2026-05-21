"use client";

import React, { useState } from "react";
import { X, Mail, Lock, User, Phone, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_URL = "http://localhost:8000/api/auth";

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: setAuthUser } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (mode === "register") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        setIsLoading(false);
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setError("Password must contain at least one uppercase letter.");
        setIsLoading(false);
        return;
      }
      if (!/[a-z]/.test(password)) {
        setError("Password must contain at least one lowercase letter.");
        setIsLoading(false);
        return;
      }
      if (!/[0-9]/.test(password)) {
        setError("Password must contain at least one number.");
        setIsLoading(false);
        return;
      }
      if (!/[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\/~`']/.test(password)) {
        setError("Password must contain at least one special character.");
        setIsLoading(false);
        return;
      }
    }

    const path = mode === "login" ? "/login" : "/register";
    const body = mode === "login" 
      ? { email, password }
      : { email, password, full_name: fullName, phone_number: phone };

    try {
      const res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Authentication failed");

      if (mode === "login") {
        setAuthUser(data.user);
      } else {
        // After register, auto login or just switch to login
        setMode("login");
        setIsLoading(false);
        return;
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted hover:bg-slate-100 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="px-6 py-8">
          <header className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-ink">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {mode === "login" ? "Enter your details to access your account" : "Join InstantService today"}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-3 size-5 text-muted" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-blue-100"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 size-5 text-muted" />
                  <input
                    type="tel"
                    placeholder="Phone Number (Optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-border bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 size-5 text-muted" />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 size-5 text-muted" />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {error && (
              <p className="text-center text-xs font-medium text-danger bg-red-50 py-2 rounded-md border border-red-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Sign Up"}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <footer className="mt-6 text-center text-sm text-muted">
            {mode === "login" ? (
              <p>
                Don&apos;t have an account?{" "}
                <button 
                  onClick={() => setMode("register")}
                  className="font-bold text-primary hover:underline"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button 
                  onClick={() => setMode("login")}
                  className="font-bold text-primary hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
