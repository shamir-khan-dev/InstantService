import { useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
  LogIn,
} from "lucide-react";
import { BottomNav, type Tab } from "@/components/ui/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { AuthModal } from "@/components/ui/AuthModal";

interface ProfileScreenProps {
  onTabChange: (tab: Tab) => void;
}

const PAST_BOOKINGS = [
  {
    id: "b-001",
    category: "Plumbing",
    contractor: "Northline Plumbing",
    date: "Apr 18, 2026",
    tier: "Plus",
    tierClass: "bg-blue-50 text-tierPlus",
    status: "Completed",
  },
  {
    id: "b-002",
    category: "Electrical",
    contractor: "Volta Electric Co.",
    date: "Mar 4, 2026",
    tier: "Premium",
    tierClass: "bg-blue-950/5 text-tierPremium",
    status: "Completed",
  },
  {
    id: "b-003",
    category: "HVAC",
    contractor: "AirRight Services",
    date: "Jan 21, 2026",
    tier: "Basic",
    tierClass: "bg-slate-100 text-tierBasic",
    status: "Completed",
  },
];

export function ProfileScreen({ onTabChange }: ProfileScreenProps) {
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  if (!user) {
    return (
      <main className="min-h-dvh bg-bg text-ink">
        <section className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 px-4 pb-28 pt-20 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-blue-50 text-primary">
            <LogIn className="size-10" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-ink">Sign in to your account</h1>
            <p className="text-sm text-muted">
              Access your booking history, saved addresses, and premium coverage details.
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-600"
          >
            Log In or Sign Up
          </button>
          
          <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </section>
        <BottomNav activeTab="profile" onTabChange={onTabChange} />
      </main>
    );
  }

  const initials = user.full_name.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <main className="min-h-dvh bg-bg text-ink">
      <section className="mx-auto flex max-w-md flex-col gap-5 px-4 pb-28 pt-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">Profile</h1>
          <button 
            onClick={logout}
            className="text-xs font-semibold text-danger hover:underline"
          >
            Log out
          </button>
        </header>

        {/* Identity card */}
        <div className="flex flex-col gap-0 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="flex items-center gap-4 px-5 py-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-primary">
              {initials}
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-base font-semibold text-ink">{user.full_name}</p>
              <p className="text-sm text-muted">{user.email}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <MapPin aria-hidden className="size-3.5 text-muted" strokeWidth={1.75} />
                <span className="text-xs text-muted">Verified Account</span>
              </div>
            </div>
          </div>
          
          {/* ... (rest of the profile UI from original file, but starting from Line 74) */}
          <div className="border-t border-border">
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-semibold text-primary transition-colors duration-120 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-blue-100"
            >
              Edit profile
              <ChevronRight aria-hidden className="size-4 text-muted" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Verification status */}
        <div className="flex flex-col gap-0 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="px-5 pt-4 pb-3">
            <p className="text-sm font-semibold text-ink">Account verification</p>
          </div>

          <div className="flex items-start gap-3 border-t border-border px-5 py-3.5">
            <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-success" strokeWidth={1.75} />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-ink">Identity confirmed</p>
              <p className="text-xs text-muted">Email and phone verified</p>
            </div>
            <span className="ml-auto inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-success">
              Verified
            </span>
          </div>

          <div className="flex items-start gap-3 border-t border-border px-5 py-3.5">
            <BadgeCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.75} />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-ink">Premium coverage eligible</p>
              <p className="text-xs text-muted">Coverage active on Premium bookings</p>
            </div>
            <span className="ml-auto inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-primary">
              Active
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Bookings", value: "3" },
            { label: "Avg rating given", value: "4.8" },
            { label: "Member since", value: "Apr 2026" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-surface px-3 py-4 shadow-sm"
            >
              <p className="text-lg font-bold text-ink">{value}</p>
              <p className="text-center text-xs leading-4 text-muted">{label}</p>
            </div>
          ))}
        </div>

        {/* Booking history */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Recent bookings</p>
            <button
              type="button"
              className="text-sm font-semibold text-primary transition-opacity hover:opacity-75 focus:outline-none"
            >
              View all
            </button>
          </div>

          <div className="flex flex-col gap-0 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
            {PAST_BOOKINGS.map((booking, i) => (
              <button
                key={booking.id}
                type="button"
                className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-colors duration-120 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-blue-100 ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <CalendarDays aria-hidden className="size-4 text-subtext" strokeWidth={1.75} />
                </div>
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{booking.category}</p>
                  <p className="truncate text-xs text-muted">{booking.contractor}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${booking.tierClass}`}>
                    {booking.tier}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <Clock aria-hidden className="size-3" strokeWidth={1.75} />
                    {booking.date}
                  </div>
                </div>
                <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
              </button>
            ))}
          </div>
        </div>

        {/* Rating note */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-4 shadow-sm">
          <Star aria-hidden className="mt-0.5 size-5 shrink-0 text-amber-500" strokeWidth={1.75} fill="currentColor" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-ink">Leave a review</p>
            <p className="text-sm text-muted">Rate your last contractor to help others in your area.</p>
          </div>
          <ChevronRight aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.75} />
        </div>

      </section>

      <BottomNav activeTab="profile" onTabChange={onTabChange} />
    </main>
  );
}
