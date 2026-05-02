from pydantic import BaseModel
from typing import Optional
from models.domain_models import Tier

class AnalyzeRequestPayload(BaseModel):
    client_id: str
    message: str
    location: str
    property_type: str

class SelectTierPayload(BaseModel):
    request_id: str
    selected_tier: Tier

class DispatchPayload(BaseModel):
    request_id: str

class CompleteBookingPayload(BaseModel):
    booking_id: str
    rating: int
    review: Optional[str] = None

class VoiceConfirmationPayload(BaseModel):
    booking_id: str
    text: Optional[str] = None
    tier: Optional[Tier] = None
    service_category: Optional[str] = None
    contractor_name: Optional[str] = None
    arrival_window: Optional[str] = None
    premium_coverage: Optional[bool] = False
