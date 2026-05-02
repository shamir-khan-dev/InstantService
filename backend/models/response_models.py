from pydantic import BaseModel
from typing import Optional
from models.domain_models import Tier, Urgency, Contractor, Booking

class AnalyzeRequestResponse(BaseModel):
    request_id: str
    service_category: str
    urgency: Urgency
    estimated_complexity: str
    recommended_tier: Tier
    problem_summary: str
    client_facing_explanation: str
    contractor_summary: str

class SelectTierResponse(BaseModel):
    request_id: str
    status: str
    selected_tier: Tier
    message: str = "Tier successfully selected and saved."

class DispatchResponse(BaseModel):
    booking_id: str
    contractor: Contractor
    estimated_arrival_window: str
    status: str = "Dispatched"

class CompleteBookingResponse(BaseModel):
    booking_id: str
    status: str = "Completed"
    message: str = "Booking finalized and reviews updated."

class VoiceConfirmationResponse(BaseModel):
    booking_id: str
    audio_base64: Optional[str] = None
    voice_status: str
    fallback_text: str
