"use client";

import React, { useState } from "react";
import { 
  Briefcase, 
  Star, 
  MapPin, 
  ShieldCheck, 
  ArrowUpRight, 
  Zap, 
  Clock, 
  CheckCircle2,
  Settings,
  Power,
  ChevronRight
} from "lucide-react";
import { BottomNav, type Tab } from "@/components/ui/BottomNav";
import { useAuth } from "@/context/AuthContext";

interface ContractorScreenProps {
  onTabChange: (tab: Tab) => void;
}

export function ContractorScreen({ onTabChange }: ContractorScreenProps) {
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  if (!user) return null;

  const initials = user.full_name.split(" ").map(n => n[0]).join("").toUpperCase();

  // Mock data for the dashboard
  const stats = [
    { label: "Acceptance", value: "98%", icon: CheckCircle2, color: "text-green-500" },
    { label: "Rating", value: "4.95", icon: Star, color: "text-amber-500" },
    { label: "Jobs", value: "142", icon: Briefcase, color: "text-blue-500" },
  ];

  const currentTier = "Premium"; // In a real app, this comes from user.tier or DB

  return (
    <main className="min-h-dvh bg-bg text-ink flex flex-col">
      <section className="mx-auto w-full max-w-md flex flex-col gap-6 px-6 pb-28 pt-8">
        
        {/* Header with Status Toggle */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-primary shadow-sm">
              {initials}
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-muted">Contractor Pro</h1>
              <p className="text-lg font-bold leading-tight">{user.full_name}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all ${
              isOnline 
                ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                : "bg-muted/10 text-muted border border-border"
            }`}
          >
            <Power className="w-3 h-3" />
            {isOnline ? "ONLINE" : "OFFLINE"}
          </button>
        </header>

        {/* Tier Pool Badge (Premium Look) */}
        <div className="relative overflow-hidden rounded-[32px] bg-ink text-white p-8 shadow-2xl shadow-primary/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="flex flex-col gap-1 z-10 relative">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-primary fill-primary" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Pool Status</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight">{currentTier} Pool</h2>
            <p className="text-white/60 text-sm mt-2 max-w-[80%]">
              You are currently in the highest priority dispatch pool. You get first access to high-value requests.
            </p>
          </div>
          <div className="mt-8 flex items-center justify-between z-10 relative">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-ink bg-surface flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
              ))}
            </div>
            <button className="text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
              Tier Details
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-surface border border-border rounded-2xl p-4 flex flex-col items-center gap-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-lg font-bold">{stat.value}</span>
              <span className="text-[10px] font-bold uppercase text-muted tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Active Dispatch Area (Simplified) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted">Nearby Requests</h3>
            <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
              Live <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            </span>
          </div>

          {isOnline ? (
            <div className="bg-surface border border-border rounded-[24px] p-6 flex flex-col items-center gap-4 text-center border-dashed border-2">
              <div className="w-12 h-12 rounded-full bg-bg flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted" />
              </div>
              <div>
                <p className="font-bold text-ink">Scanning for requests...</p>
                <p className="text-xs text-muted mt-1">New requests in Brooklyn area will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="bg-muted/5 border border-border rounded-[24px] p-8 flex flex-col items-center gap-4 text-center">
              <p className="font-bold text-muted">You are currently offline</p>
              <button 
                onClick={() => setIsOnline(true)}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20"
              >
                Go Online
              </button>
            </div>
          )}
        </div>

        {/* Utility Menu */}
        <div className="flex flex-col bg-surface border border-border rounded-[24px] overflow-hidden">
          {[
            { label: "Earnings History", icon: ArrowUpRight, desc: "Last 30 days" },
            { label: "Service Area", icon: MapPin, desc: "15km Radius" },
            { label: "Verification Documents", icon: ShieldCheck, desc: "All active" },
            { label: "Settings", icon: Settings, desc: "App & Profile" },
          ].map((item, i) => (
            <button 
              key={item.label}
              className={`flex items-center justify-between p-5 hover:bg-bg transition-colors ${i !== 3 ? "border-bottom border-border/50" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-muted" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-ink">{item.label}</p>
                  <p className="text-[10px] text-muted font-medium">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted" />
            </button>
          ))}
        </div>

      </section>

      {/* Role Switcher (Secret Dev Tool or Demo Toggle) */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 opacity-20 hover:opacity-100 transition-opacity">
        <button 
          onClick={logout}
          className="text-[10px] font-bold text-danger uppercase tracking-widest px-4 py-2 bg-danger/10 rounded-full"
        >
          Logout & Reset
        </button>
      </div>

      <BottomNav activeTab="home" onTabChange={onTabChange} />
    </main>
  );
}
