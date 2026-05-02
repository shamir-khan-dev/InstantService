// POST /api/analyze-request
export interface AnalyzeRequestBody {
  client_id: string;
  message: string;
  location: string;
  property_type: string;
}

export type Urgency = "Low" | "Medium" | "High" | "Emergency";
export type Tier = "Basic" | "Plus" | "Premium";

export interface AnalyzeRequestResponse {
  request_id: string;
  service_category: string;
  urgency: Urgency;
  estimated_complexity: string;
  recommended_tier: Tier;
  problem_summary: string;
  client_facing_explanation: string;
  contractor_summary: string;
}

// POST /api/select-tier
export interface SelectTierBody {
  request_id: string;
  selected_tier: Tier;
}

export interface SelectTierResponse {
  request_id: string;
  status: string;
  selected_tier: Tier;
  message: string;
}

// POST /api/dispatch
export interface DispatchBody {
  request_id: string;
}

export interface Contractor {
  contractor_id: string;
  name: string;
  service_category: string;
  tier: Tier;
  five_star_review_count: number;
  acceptance_rate: number;
  distance_km: number;
}

export interface DispatchResponse {
  booking_id: string;
  contractor: Contractor;
  estimated_arrival_window: string;
  status: string;
}

// POST /api/voice-confirmation
export interface VoiceConfirmationBody {
  booking_id: string;
  tier?: Tier;
  service_category?: string;
  contractor_name?: string;
  arrival_window?: string;
  premium_coverage?: boolean;
}

export interface VoiceConfirmationResponse {
  booking_id: string;
  audio_base64: string | null;
  voice_status: string;
  fallback_text: string;
}

// POST /api/complete-booking
export interface CompleteBookingBody {
  booking_id: string;
  rating: number;
  review?: string;
}

// Auth Types
export interface RegisterBody {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  role: "client" | "contractor";
  business_name?: string;
  service_category?: string;
  license_id?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthResponse {
  status: string;
  user: {
    user_id: string;
    email: string;
    full_name: string;
    role: string;
    phone_number?: string;
  };
}

// App state machine
export type BookingStep =
  | "idle"
  | "analyzing"
  | "analyzing_failed"
  | "analyzed"
  | "tier_selected"
  | "dispatching"
  | "dispatch_failed"
  | "accepted"
  | "voice_generating"
  | "voice_failed"
  | "confirmed";
