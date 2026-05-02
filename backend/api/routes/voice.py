from fastapi import APIRouter, HTTPException
from models.request_models import VoiceConfirmationPayload
from models.response_models import VoiceConfirmationResponse
from services.elevenlabs_service import generate_voice_confirmation, build_confirmation_text

router = APIRouter()

@router.post("/voice-confirmation", response_model=VoiceConfirmationResponse)
async def voice_confirmation(payload: VoiceConfirmationPayload):
    """
    Generates a text-to-speech audio confirmation of a booking.
    Developer 3 owns the ElevenLabs service implementation.
    """
    try:
        # Build text if not provided
        if payload.text:
            confirmation_text = payload.text
        else:
            # Build from booking details if frontend didn't pass pre-built text
            confirmation_text = build_confirmation_text(
                tier=payload.tier,
                service_category=payload.service_category,
                contractor_name=payload.contractor_name,
                arrival_window=payload.arrival_window,
                premium_coverage=payload.premium_coverage
            )
        
        # Dev 3's function does the actual API call
        result = generate_voice_confirmation(confirmation_text)
        
        return VoiceConfirmationResponse(
            booking_id=payload.booking_id,
            audio_base64=result["audio_base64"],
            voice_status=result["voice_status"],
            fallback_text=result["fallback_text"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate voice confirmation: {str(e)}")
