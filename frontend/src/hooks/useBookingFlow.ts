"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  analyzeRequest,
  selectTier as apiSelectTier,
  dispatch as apiDispatch,
  voiceConfirmation as apiVoiceConfirmation,
  cancelBooking as apiCancelBooking,
} from "@/lib/api";
import type {
  AnalyzeRequestBody,
  AnalyzeRequestResponse,
  BookingStep,
  DispatchResponse,
  Tier,
  VoiceConfirmationBody,
  VoiceConfirmationResponse,
} from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "instantservice:booking-flow:v1";
const CLIENT_ID_KEY = "instantservice:client-id";

export interface RequestInput {
  message: string;
  location: string;
  property_type: string;
}

export interface FlowState {
  step: BookingStep;
  clientId: string;
  request: RequestInput | null;
  requestId: string | null;
  analysis: AnalyzeRequestResponse | null;
  selectedTier: Tier | null;
  bookingId: string | null;
  dispatchResult: DispatchResponse | null;
  voice: VoiceConfirmationResponse | null;
  error: string | null;
}

type Action =
  | { type: "HYDRATE"; state: Partial<FlowState> }
  | { type: "START_ANALYSIS"; request: RequestInput }
  | { type: "ANALYSIS_SUCCESS"; analysis: AnalyzeRequestResponse }
  | { type: "ANALYSIS_FAIL"; error: string }
  | { type: "GO_TO_TIER_SELECTION" }
  | { type: "SELECT_TIER"; tier: Tier }
  | { type: "START_DISPATCH" }
  | { type: "DISPATCH_SUCCESS"; dispatchResult: DispatchResponse }
  | { type: "DISPATCH_FAIL"; error: string }
  | { type: "START_VOICE" }
  | { type: "VOICE_SUCCESS"; voice: VoiceConfirmationResponse }
  | { type: "VOICE_FAIL"; error: string; voice?: VoiceConfirmationResponse }
  | { type: "CANCEL_BOOKING" }
  | { type: "RESET" };

function getInitialState(clientId: string): FlowState {
  return {
    step: "idle",
    clientId,
    request: null,
    requestId: null,
    analysis: null,
    selectedTier: null,
    bookingId: null,
    dispatchResult: null,
    voice: null,
    error: null,
  };
}

// Roll back transient/in-flight steps when restoring from storage so the user
// lands on a stable, actionable screen after refresh.
function settleHydratedStep(step: BookingStep | undefined): BookingStep {
  switch (step) {
    case "analyzing":
    case "analyzing_failed":
      return "idle";
    case "dispatching":
    case "dispatch_failed":
      return "tier_selected";
    case "voice_generating":
    case "voice_failed":
      return "accepted";
    case undefined:
      return "idle";
    default:
      return step;
  }
}

function reducer(state: FlowState, action: Action): FlowState {
  switch (action.type) {
    case "HYDRATE": {
      const next = { ...state, ...action.state };
      next.step = settleHydratedStep(next.step);
      next.error = null;
      return next;
    }
    case "START_ANALYSIS":
      return {
        ...state,
        step: "analyzing",
        request: action.request,
        analysis: null,
        requestId: null,
        selectedTier: null,
        bookingId: null,
        dispatchResult: null,
        voice: null,
        error: null,
      };
    case "ANALYSIS_SUCCESS":
      return {
        ...state,
        step: "analyzed",
        analysis: action.analysis,
        requestId: action.analysis.request_id,
        selectedTier: action.analysis.recommended_tier,
        error: null,
      };
    case "ANALYSIS_FAIL":
      return { ...state, step: "analyzing_failed", error: action.error };
    case "GO_TO_TIER_SELECTION":
      return {
        ...state,
        step: "tier_selected",
        selectedTier: state.selectedTier ?? state.analysis?.recommended_tier ?? null,
      };
    case "SELECT_TIER":
      return { ...state, selectedTier: action.tier };
    case "START_DISPATCH":
      return { ...state, step: "dispatching", error: null };
    case "DISPATCH_SUCCESS":
      return {
        ...state,
        step: "accepted",
        dispatchResult: action.dispatchResult,
        bookingId: action.dispatchResult.booking_id,
        error: null,
      };
    case "DISPATCH_FAIL":
      return { ...state, step: "dispatch_failed", error: action.error };
    case "START_VOICE":
      return { ...state, step: "voice_generating", error: null };
    case "VOICE_SUCCESS":
      return { ...state, step: "confirmed", voice: action.voice, error: null };
    case "VOICE_FAIL":
      return {
        ...state,
        step: "confirmed",
        voice: action.voice ?? state.voice,
        error: action.error,
      };
    case "CANCEL_BOOKING":
    case "RESET":
      return getInitialState(state.clientId);
    default:
      return state;
  }
}

function readClientId(): string {
  if (typeof window === "undefined") return "";
  let id: string | null = null;
  try {
    id = window.localStorage.getItem(CLIENT_ID_KEY);
  } catch {
    return "";
  }
  if (!id) {
    id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `client-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    try {
      window.localStorage.setItem(CLIENT_ID_KEY, id);
    } catch {
      // ignore quota / privacy errors
    }
  }
  return id;
}

export interface BookingFlowApi {
  state: FlowState;
  isHydrated: boolean;
  analyze: (input: RequestInput) => Promise<void>;
  goToTierSelection: () => void;
  selectTier: (tier: Tier) => void;
  dispatchRequest: () => Promise<void>;
  generateVoice: () => Promise<void>;
  cancel: () => Promise<void>;
  reset: () => void;
}

export function useBookingFlow(): BookingFlowApi {
  const [state, dispatch] = useReducer(reducer, "", getInitialState);
  const hydrated = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const clientId = readClientId();
    let saved: Partial<FlowState> | null = null;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw) as Partial<FlowState>;
    } catch {
      saved = null;
    }
    dispatch({
      type: "HYDRATE",
      state: { ...(saved ?? {}), clientId },
    });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (typeof window === "undefined") return;
    try {
      const { clientId: _clientId, ...persisted } = state;
      void _clientId;
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // ignore quota / privacy errors
    }
  }, [state]);

  const { user } = useAuth();

  const analyze = useCallback(async (input: RequestInput) => {
    dispatch({ type: "START_ANALYSIS", request: input });
    const clientId = user?.user_id || stateRef.current.clientId || readClientId();
    const body: AnalyzeRequestBody = {
      client_id: clientId,
      message: input.message,
      location: input.location,
      property_type: input.property_type,
    };
    try {
      const analysis = await analyzeRequest(body);
      dispatch({ type: "ANALYSIS_SUCCESS", analysis });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not analyze the request. Please try again.";
      dispatch({ type: "ANALYSIS_FAIL", error: message });
    }
  }, [user?.user_id]);

  const goToTierSelection = useCallback(() => {
    dispatch({ type: "GO_TO_TIER_SELECTION" });
  }, []);

  const selectTier = useCallback((tier: Tier) => {
    dispatch({ type: "SELECT_TIER", tier });
  }, []);

  const dispatchRequest = useCallback(async () => {
    const current = stateRef.current;
    if (!current.requestId || !current.selectedTier) return;
    dispatch({ type: "START_DISPATCH" });
    try {
      await apiSelectTier({
        request_id: current.requestId,
        selected_tier: current.selectedTier,
      });
      const result = await apiDispatch({ request_id: current.requestId });
      dispatch({ type: "DISPATCH_SUCCESS", dispatchResult: result });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not dispatch the request. Please try again.";
      dispatch({ type: "DISPATCH_FAIL", error: message });
    }
  }, []);

  const generateVoice = useCallback(async () => {
    const current = stateRef.current;
    if (!current.bookingId || !current.dispatchResult) return;
    dispatch({ type: "START_VOICE" });
    const body: VoiceConfirmationBody = {
      booking_id: current.bookingId,
      tier: current.selectedTier ?? undefined,
      service_category: current.dispatchResult.contractor.service_category,
      contractor_name: current.dispatchResult.contractor.name,
      arrival_window: current.dispatchResult.estimated_arrival_window,
      premium_coverage: current.selectedTier === "Premium",
    };
    try {
      const voice = await apiVoiceConfirmation(body);
      if (voice.voice_status === "success" || voice.voice_status === "generated") {
        dispatch({ type: "VOICE_SUCCESS", voice });
      } else {
        dispatch({
          type: "VOICE_FAIL",
          voice,
          error: voice.fallback_text
            ? ""
            : "Voice confirmation unavailable.",
        });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Voice confirmation unavailable.";
      dispatch({ type: "VOICE_FAIL", error: message });
    }
  }, []);

  const cancel = useCallback(async () => {
    const current = stateRef.current;
    if (!current.bookingId) {
      dispatch({ type: "CANCEL_BOOKING" });
      return;
    }
    try {
      await apiCancelBooking({ booking_id: current.bookingId });
      dispatch({ type: "CANCEL_BOOKING" });
    } catch {
      // Even if API fails, we reset locally for UX
      dispatch({ type: "CANCEL_BOOKING" });
    }
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    state,
    isHydrated: hydrated.current,
    analyze,
    goToTierSelection,
    selectTier,
    dispatchRequest,
    generateVoice,
    cancel,
    reset,
  };
}
