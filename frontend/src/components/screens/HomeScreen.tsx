"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { CircleAlert, MapPin, Mic, Search, ShieldCheck, X } from "lucide-react";
import type { BookingFlowApi } from "@/hooks/useBookingFlow";
import { BottomNav, type Tab } from "@/components/ui/BottomNav";

const LeafletMap = dynamic(
  () => import("@/components/ui/LeafletMap").then((m) => m.LeafletMap),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-slate-200 animate-pulse" aria-hidden /> }
);

const MIN_MESSAGE_LENGTH = 15;

const QUICK_CHIPS = [
  "Leaking",
  "No power",
  "Locked out",
  "Appliance issue",
  "Heating/cooling",
];

const PROPERTY_TYPES = [
  { value: "House", label: "House" },
  { value: "Apartment", label: "Apartment" },
  { value: "Office", label: "Office" },
  { value: "Other", label: "Other" },
];

interface HomeScreenProps {
  flow: BookingFlowApi;
  onTabChange?: (tab: Tab) => void;
}

export function HomeScreen({ flow, onTabChange }: HomeScreenProps) {
  const { state, analyze } = flow;
  const isAnalyzing = state.step === "analyzing";

  const [coords, setCoords] = useState<[number, number]>([40.7128, -74.006]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micExpanded, setMicExpanded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const keepListeningRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const messageRef = useRef(""); // tracks latest spoken text to avoid stale closures

  const [message, setMessage] = useState(state.request?.message ?? "");
  const [location, setLocation] = useState(state.request?.location ?? "");
  const [propertyType, setPropertyType] = useState(state.request?.property_type ?? "House");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords([pos.coords.latitude, pos.coords.longitude]); },
      () => {},
      { timeout: 8000, maximumAge: 60_000 }
    );
  }, []);

  const trimmedLength = message.trim().length;
  const messageTooShort = trimmedLength < MIN_MESSAGE_LENGTH;
  const locationMissing = location.trim().length === 0;
  const submitDisabled = isAnalyzing || messageTooShort || locationMissing;

  const helperText = useMemo(() => {
    if (trimmedLength === 0) return "Add a few details so Dispatch AI can route this correctly.";
    if (messageTooShort) {
      return `A little more detail helps : ${MIN_MESSAGE_LENGTH - trimmedLength} more character${
        MIN_MESSAGE_LENGTH - trimmedLength === 1 ? "" : "s"
      } recommended.`;
    }
    return "Looks good. Dispatch AI will recommend the right service tier.";
  }, [messageTooShort, trimmedLength]);

  const inlineError =
    showError && (messageTooShort || locationMissing)
      ? messageTooShort
        ? "Please describe the issue with at least a short sentence."
        : "Please add a city or area so we can match local contractors."
      : state.step === "analyzing_failed"
        ? state.error || "We could not analyze the request. Please try again."
        : null;

  function handleQuickChip(chip: string) {
    setMessage((prev) => {
      if (!prev.trim()) return chip;
      if (prev.toLowerCase().includes(chip.toLowerCase())) return prev;
      return `${prev.trim()} : ${chip}`;
    });
    setShowError(false);
  }

  async function handleSubmit() {
    if (submitDisabled) { setShowError(true); return; }
    setShowError(false);
    await analyze({
      message: message.trim(),
      location: location.trim(),
      property_type: propertyType,
    });
    setSheetOpen(false);
  }

  function stopMic() {
    keepListeningRef.current = false;
    recognitionRef.current?.stop();
    cancelAnimationFrame(animFrameRef.current);
    audioContextRef.current?.close();
    audioContextRef.current = null;
    setIsListening(false);
    setMicExpanded(false);
    setAudioLevel(0);
  }

  function toggleVoice() {
    if (isListening) { stopMic(); return; }

    // Expand the bar first, then start recognition after the animation lands
    setMicExpanded(true);

    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      const SR = win.SpeechRecognition ?? win.webkitSpeechRecognition;
      if (!SR) return;

      const recognition = new SR();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (e: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const text = Array.from(e.results).map((r: any) => r[0].transcript).join("");
        setMessage(text);
        messageRef.current = text; // keep ref in sync so onend can read latest
      };
      const safeStart = () => {
        try {
          recognition.start();
        } catch (err) {
          console.warn("SpeechRecognition already started:", err);
        }
      };

      recognition.onend = () => {
        cancelAnimationFrame(animFrameRef.current);
        audioContextRef.current?.close();
        audioContextRef.current = null;
        setIsListening(false);
        setMicExpanded(false);
        setAudioLevel(0);
        // use ref — not stale closure state
        if (messageRef.current.trim().length >= 5) setSheetOpen(true);
      };

      recognition.onerror = () => {
        if (keepListeningRef.current) {
          safeStart();
        }
      };

      keepListeningRef.current = true;
      recognitionRef.current = recognition;
      safeStart();
      setIsListening(true);

      // Start Web Audio API volume analyzer
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(avg / 128); // 0..~1.5
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
      }).catch(() => {});
    }, 720);
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* z-0: Map */}
      <LeafletMap coords={coords} />

      {/* z-10: Tactical Dispatch Telemetry Header */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex flex-col items-center pt-safe-top px-4 gap-2" style={{ paddingTop: "max(env(safe-area-inset-top, 0px), 14px)" }}>
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-950/90 border border-amber-500/30 px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-mono text-[10px] tracking-widest text-amber-400 font-bold uppercase">
            RAPID DISPATCH READY : METRO SECTOR 01
          </span>
          <span className="text-[10px] bg-amber-500/10 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/20">
            ETA 8 MIN
          </span>
        </div>
      </div>

      {/* z-30: Floating search bar */}
      <div
        className="fixed inset-x-0 z-30 px-4"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <div
          className="mx-auto flex max-w-md items-center gap-2 rounded-2xl px-4 py-1 border border-amber-500/20"
          style={{
            background: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)",
          }}
        >
          <Search aria-hidden className="size-5 shrink-0 text-amber-600" strokeWidth={2} />
          <button
            type="button"
            className="flex-1 py-3 text-left text-sm font-medium text-slate-700 focus:outline-none"
            onClick={() => setSheetOpen(true)}
          >
            {message || "Describe emergency repair or dispatch need..."}
          </button>
          <button
            type="button"
            aria-label={isListening ? "Stop listening" : "Start voice input"}
            onClick={toggleVoice}
            className={`flex size-9 items-center justify-center rounded-full transition-colors ${
              isListening
                ? "bg-amber-500 text-slate-950 mic-listening font-bold"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Mic aria-hidden className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* z-40: Bottom nav */}
      <BottomNav activeTab="home" onTabChange={onTabChange} />

      {/* z-50: Backdrop */}
      <div
        aria-hidden
        onClick={() => setSheetOpen(false)}
        className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-280"
        style={{ opacity: sheetOpen ? 1 : 0, pointerEvents: sheetOpen ? "auto" : "none" }}
      />

      {/* z-55: Mic full-screen expansion overlay */}
      {/*
        clip-path starts exactly matching the floating search bar:
          top    = 100dvh − bottom-nav(4rem) − safe-area − bar-height(56px) − gap(12px)
          bottom = bottom-nav(4rem) + safe-area + gap(12px)
          sides  = px-4 (16px)
          radius = rounded-2xl (16px)
        then expands to inset(0) covering the entire viewport.
      */}
      <div
        aria-hidden={!micExpanded}
        className="fixed inset-0 z-[55]"
        style={{
          background: micExpanded
            ? "radial-gradient(ellipse 120% 160% at 50% -30%, rgba(30,58,138,0.20) 0%, transparent 70%), #ffffff"
            : "radial-gradient(ellipse 120% 160% at 50% -30%, rgba(30,58,138,0.10) 0%, transparent 70%), #ffffff",
          opacity: micExpanded ? 1 : 0,
          clipPath: micExpanded
            ? "inset(0px 0px 0px 0px round 0px)"
            : "inset(calc(100dvh - 4rem - env(safe-area-inset-bottom, 0px) - 68px) 16px calc(4rem + env(safe-area-inset-bottom, 0px) + 12px) 16px round 16px)",
          transition: micExpanded
            ? "clip-path 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0s"
            : "clip-path 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease 0.22s",
          pointerEvents: micExpanded ? "auto" : "none",
        }}
      >
        {/* Logo — centered with voice-reactive rings */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: micExpanded ? 1 : 0,
            transition: micExpanded ? "opacity 0.5s ease 0.08s" : "opacity 0.15s ease",
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Outer glow ring */}
            <div
              className="absolute rounded-full bg-blue-400/20"
              style={{
                width: `${180 + audioLevel * 120}px`,
                height: `${180 + audioLevel * 120}px`,
                transition: "width 0.08s ease, height 0.08s ease",
              }}
            />
            {/* Mid ring */}
            <div
              className="absolute rounded-full bg-blue-500/25"
              style={{
                width: `${140 + audioLevel * 80}px`,
                height: `${140 + audioLevel * 80}px`,
                transition: "width 0.06s ease, height 0.06s ease",
              }}
            />
            {/* Inner ring */}
            <div
              className="absolute rounded-full bg-blue-600/30"
              style={{
                width: `${110 + audioLevel * 50}px`,
                height: `${110 + audioLevel * 50}px`,
                transition: "width 0.05s ease, height 0.05s ease",
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/SecondaryLogo.png"
              alt=""
              aria-hidden
              draggable={false}
              className="relative z-10 w-36 select-none"
              style={{
                transform: `scale(${1 + audioLevel * 0.12})`,
                transition: "transform 0.08s ease",
                filter: `drop-shadow(0 0 ${8 + audioLevel * 20}px rgba(29,78,216,${0.4 + audioLevel * 0.4}))`,
              }}
            />
          </div>
        </div>

        {/* Cancel button — midway between logo center (50%) and bottom edge (100%) = 75% from top */}
        <div
          className="absolute inset-x-0 flex justify-center"
          style={{
            top: "75%",
            opacity: micExpanded ? 1 : 0,
            transition: micExpanded ? "opacity 0.5s ease 0.08s" : "opacity 0.15s ease",
          }}
        >
          <button
            type="button"
            aria-label="Cancel voice input"
            onClick={stopMic}
            className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/70 px-6 py-3 text-sm font-medium text-slate-500 shadow-sm backdrop-blur-sm transition-all duration-150 active:scale-95 hover:border-slate-300 hover:bg-white/90 hover:text-slate-700"
          >
            <X aria-hidden className="size-4 shrink-0" strokeWidth={2} />
            Cancel
          </button>
        </div>
      </div>

      {/* z-50: Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Describe your issue"
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-xl"
        style={{
          background: "radial-gradient(ellipse 100% 40% at 50% 0%, rgba(30,58,138,0.07) 0%, transparent 70%), #ffffff",
          transform: sheetOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 280ms cubic-bezier(0.2, 0, 0, 1)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-slate-200" aria-hidden />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-100">
          <h2 className="text-base font-semibold text-ink">Describe your issue</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setSheetOpen(false)}
            className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-subtext focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <X aria-hidden className="size-4" strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4">
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
            noValidate
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="problem" className="text-sm font-medium text-ink">
                What&apos;s going on?
              </label>
              <textarea
                id="problem"
                name="problem"
                value={message}
                onChange={(e) => { setMessage(e.target.value); if (showError) setShowError(false); }}
                placeholder="e.g. Kitchen sink is leaking under the cabinet and the floor is getting wet."
                rows={4}
                minLength={MIN_MESSAGE_LENGTH}
                aria-invalid={showError && messageTooShort}
                aria-describedby="problem-helper"
                className="min-h-[140px] w-full resize-y rounded-md border border-border bg-surface px-4 py-3 text-base leading-6 text-ink shadow-sm transition-colors duration-120 ease-standard placeholder:text-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
              <div className="flex items-start justify-between gap-3">
                <p
                  id="problem-helper"
                  className={`text-sm leading-5 ${showError && messageTooShort ? "text-danger" : "text-muted"}`}
                >
                  {helperText}
                </p>
                <span aria-hidden className="shrink-0 text-xs font-medium text-muted">
                  {trimmedLength}/{MIN_MESSAGE_LENGTH}+
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted">Suggestions</span>
              <div className="flex flex-wrap gap-2">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleQuickChip(chip)}
                    className="inline-flex h-11 items-center rounded-full border border-border bg-white px-4 text-sm font-medium text-ink shadow-sm transition-colors duration-120 ease-standard hover:border-primary/30 hover:bg-blue-50 hover:text-primary focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="location" className="text-sm font-medium text-ink">Location</label>
              <div className="relative">
                <MapPin
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                  strokeWidth={1.75}
                />
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); if (showError) setShowError(false); }}
                  placeholder="City or neighborhood"
                  aria-invalid={showError && locationMissing}
                  autoComplete="address-level2"
                  className="h-12 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-base text-ink shadow-sm transition-colors duration-120 ease-standard placeholder:text-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">Property type</span>
              <div role="radiogroup" aria-label="Property type" className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((option) => {
                  const isSelected = propertyType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setPropertyType(option.value)}
                      className={`inline-flex h-11 items-center rounded-full border px-4 text-sm font-semibold shadow-sm transition-colors duration-120 ease-standard focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                        isSelected
                          ? "border-primary bg-blue-50 text-primary"
                          : "border-border bg-surface text-subtext hover:bg-slate-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md bg-blue-50/60 border border-blue-100 p-3">
              <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-success" strokeWidth={1.75} />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-ink">Verified contractors only</p>
                <p className="text-sm leading-5 text-muted">Business identity on file. Reviewed before dispatch.</p>
              </div>
            </div>

            {inlineError && (
              <div role="alert" className="flex items-start gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-danger">
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
                <span>{inlineError}</span>
              </div>
            )}
          </form>
        </div>

        {/* Sticky CTA */}
        <div className="border-t border-slate-100 bg-white/95 backdrop-blur-sm px-4 py-3">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitDisabled}
            aria-busy={isAnalyzing}
            className="h-12 w-full rounded-md border-0 bg-gradient-to-br from-blue-400 to-blue-800 px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-120 ease-standard hover:from-blue-300 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAnalyzing ? "Analyzing issue…" : "Analyze issue"}
          </button>
        </div>
      </div>
    </div>
  );
}
