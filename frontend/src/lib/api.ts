import type {
  AnalyzeRequestBody,
  AnalyzeRequestResponse,
  SelectTierBody,
  SelectTierResponse,
  DispatchBody,
  DispatchResponse,
  VoiceConfirmationBody,
  VoiceConfirmationResponse,
  CompleteBookingBody,
  RegisterBody,
  LoginBody,
  AuthResponse,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function post<TBody, TResponse>(
  path: string,
  body: TBody
): Promise<TResponse> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<TResponse>;
}

export function analyzeRequest(
  body: AnalyzeRequestBody
): Promise<AnalyzeRequestResponse> {
  return post<AnalyzeRequestBody, AnalyzeRequestResponse>(
    "/api/analyze-request",
    body
  );
}

export function selectTier(
  body: SelectTierBody
): Promise<SelectTierResponse> {
  return post<SelectTierBody, SelectTierResponse>("/api/select-tier", body);
}

export function dispatch(body: DispatchBody): Promise<DispatchResponse> {
  return post<DispatchBody, DispatchResponse>("/api/dispatch", body);
}

export function voiceConfirmation(
  body: VoiceConfirmationBody
): Promise<VoiceConfirmationResponse> {
  return post<VoiceConfirmationBody, VoiceConfirmationResponse>(
    "/api/voice-confirmation",
    body
  );
}

export function completeBooking(body: CompleteBookingBody): Promise<void> {
  return post<CompleteBookingBody, void>("/api/complete-booking", body);
}

export function cancelBooking(body: { booking_id: string }): Promise<void> {
  return post<{ booking_id: string }, void>("/api/booking/cancel", body);
}

// Auth API
export function register(body: RegisterBody): Promise<{ status: string; user_id: string }> {
  return post<RegisterBody, { status: string; user_id: string }>("/api/auth/register", body);
}

export function login(body: LoginBody): Promise<AuthResponse> {
  return post<LoginBody, AuthResponse>("/api/auth/login", body);
}
