"use client";

import { useState } from "react";
import { AnalysisScreen } from "@/components/screens/AnalysisScreen";
import { ConfirmationScreen } from "@/components/screens/ConfirmationScreen";
import { DispatchScreen } from "@/components/screens/DispatchScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { TierSelectionScreen } from "@/components/screens/TierSelectionScreen";
import { useBookingFlow } from "@/hooks/useBookingFlow";
import type { Tab } from "@/components/ui/BottomNav";

import { useAuth } from "@/context/AuthContext";
import { AuthScreen } from "@/components/screens/AuthScreen";

export default function Home() {
  const { user, isLoading } = useAuth();
  const flow = useBookingFlow();
  const { state } = flow;
  const [activeTab, setActiveTab] = useState<Tab>("home");

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (activeTab === "profile") {
    return <ProfileScreen onTabChange={setActiveTab} />;
  }

  if (activeTab === "settings") {
    return <SettingsScreen onTabChange={setActiveTab} />;
  }

  // "bookings" tab — placeholder until bookings screen is built
  if (activeTab === "bookings") {
    return (
      <main className="min-h-dvh bg-bg text-ink">
        <section className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-28 pt-6">
          <h1 className="text-2xl font-bold text-ink">Bookings</h1>
          <p className="text-sm text-muted">Your booking history will appear here.</p>
        </section>
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center rounded-t-[20px] border-t border-border bg-surface/95 backdrop-blur" style={{ minHeight: "4rem", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {(["home", "bookings", "profile", "settings"] as Tab[]).map((tab) => {
            const icons: Record<Tab, string> = { home: "H", bookings: "B", profile: "P", settings: "S" };
            return (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`flex h-full flex-1 flex-col items-center justify-center text-xs font-semibold ${tab === "bookings" ? "text-primary" : "text-muted"}`}>
                {icons[tab]}
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  switch (state.step) {
    case "analyzed":
      return state.analysis ? (
        <AnalysisScreen flow={flow} />
      ) : (
        <HomeScreen flow={flow} onTabChange={setActiveTab} />
      );

    case "tier_selected":
    case "dispatch_failed":
      return state.analysis ? (
        <TierSelectionScreen flow={flow} />
      ) : (
        <HomeScreen flow={flow} onTabChange={setActiveTab} />
      );

    case "dispatching":
    case "accepted":
    case "voice_generating":
      return <DispatchScreen flow={flow} />;

    case "confirmed":
    case "voice_failed":
      return state.dispatchResult ? (
        <ConfirmationScreen flow={flow} />
      ) : (
        <HomeScreen flow={flow} onTabChange={setActiveTab} />
      );

    case "idle":
    case "analyzing":
    case "analyzing_failed":
    default:
      return <HomeScreen flow={flow} onTabChange={setActiveTab} />;
  }
}
