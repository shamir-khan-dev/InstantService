"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { register as apiRegister, login as apiLogin } from "@/lib/api";
import { LogIn, UserPlus, Shield, Tool, ArrowRight, Loader2, Mail, Lock, User, Phone, Briefcase, FileText } from "lucide-react";

type AuthMode = "login" | "register";
type UserRole = "client" | "contractor";

export function AuthScreen() {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<UserRole>("client");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [serviceCategory, setServiceCategory] = useState("General Handyman");
  const [licenseId, setLicenseId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        const res = await apiRegister({
          email,
          password,
          full_name: fullName,
          phone_number: phone,
          role,
          business_name: role === "contractor" ? businessName : undefined,
          service_category: role === "contractor" ? serviceCategory : undefined,
          license_id: role === "contractor" ? licenseId : undefined,
        });
        
        if (res.status === "success") {
          // Auto-login after registration
          const loginRes = await apiLogin({ email, password });
          login(loginRes.user);
        }
      } else {
        const res = await apiLogin({ email, password });
        login(res.user);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-bg text-ink flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col gap-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transform rotate-3">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mt-4 tracking-tight">InstantService</h1>
          <p className="text-muted text-sm">Professional dispatch on demand.</p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface/50 backdrop-blur-xl border border-border rounded-[28px] p-8 shadow-2xl">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-bg/50 rounded-2xl mb-8 border border-border/50">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "login" ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              <LogIn className="w-4 h-4" /> Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "register" ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              <UserPlus className="w-4 h-4" /> Register
            </button>
          </div>

          {/* Role Switcher (Uber Style) - Only in Register Mode */}
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setRole("client")}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  role === "client" ? "border-primary bg-primary/5" : "border-border bg-transparent opacity-60"
                }`}
              >
                <div className={`p-2 rounded-lg ${role === "client" ? "bg-primary text-white" : "bg-bg text-muted"}`}>
                  <User className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Book Service</span>
              </button>
              <button
                onClick={() => setRole("contractor")}
                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                  role === "contractor" ? "border-accent bg-accent/5" : "border-border bg-transparent opacity-60"
                }`}
              >
                <div className={`p-2 rounded-lg ${role === "contractor" ? "bg-accent text-white" : "bg-bg text-muted"}`}>
                  <Tool className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">Become Pro</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-bg/50 border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-bg/50 border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                {role === "contractor" && (
                  <div className="animate-in fade-in slide-in-from-top-2 flex flex-col gap-4 pt-2 border-t border-border/50 mt-2">
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest px-2">Business Details</p>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent transition-colors" />
                      <input
                        type="text"
                        placeholder="Business Name"
                        required={role === "contractor"}
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full bg-bg/50 border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                      />
                    </div>
                    <div className="relative group">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent transition-colors" />
                      <input
                        type="text"
                        placeholder="License ID"
                        required={role === "contractor"}
                        value={licenseId}
                        onChange={(e) => setLicenseId(e.target.value)}
                        className="w-full bg-bg/50 border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                      />
                    </div>
                    <select
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value)}
                      className="w-full bg-bg/50 border border-border rounded-xl py-3.5 px-4 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    >
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="HVAC">HVAC</option>
                      <option value="General Handyman">General Handyman</option>
                      <option value="Cleaning">Cleaning</option>
                    </select>
                  </div>
                )}
              </>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg/50 border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg/50 border border-border rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs px-2 animate-in fade-in">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all transform active:scale-[0.98] ${
                role === "contractor" && mode === "register" ? "bg-accent hover:bg-accent-light shadow-lg shadow-accent/20" : "bg-primary hover:bg-primary-light shadow-lg shadow-primary/20"
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted leading-relaxed">
          By continuing, you agree to our <span className="text-ink font-semibold">Terms of Service</span> and <span className="text-ink font-semibold">Privacy Policy</span>.
        </p>
      </div>
    </main>
  );
}
