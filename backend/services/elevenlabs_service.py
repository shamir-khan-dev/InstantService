# backend/services/elevenlabs_service.py
import os
import requests
import base64
from enum import Enum
from dotenv import load_dotenv

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # default Rachel voice
ELEVENLABS_API_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"


def build_confirmation_text(
    tier: any,
    service_category: str,
    contractor_name: str,
    arrival_window: str,
    premium_coverage: bool = False
) -> str:
    """Build the voice confirmation text from booking details."""
    
    # Clean up Tier (handle Enum or String)
    tier_str = str(tier.value) if hasattr(tier, 'value') else str(tier)
    if "." in tier_str: # Final safety against "Tier.PLUS"
        tier_str = tier_str.split(".")[-1]
    
    if tier_str == "Premium" and premium_coverage:
        return (
            f"Your Premium {service_category} service has been booked with {contractor_name}. "
            f"Premium Coverage is active for this booking. "
            f"Your contractor is expected to arrive between {arrival_window}."
        )
    
    return (
        f"Your {tier_str} {service_category} service has been booked with {contractor_name}. "
        f"Your contractor is expected to arrive between {arrival_window}."
    )


def generate_voice_confirmation(text: str) -> dict:
    """Send text to ElevenLabs and return audio as base64 string."""
    
    if not ELEVENLABS_API_KEY:
        print("ElevenLabs Error: API Key missing")
        return {
            "audio_base64": None,
            "voice_status": "unavailable",
            "fallback_text": text
        }
    
    try:
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }
        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        response = requests.post(
            ELEVENLABS_API_URL,
            headers=headers,
            json=payload,
            timeout=15
        )
        
        if response.status_code == 200:
            audio_base64 = base64.b64encode(response.content).decode("utf-8")
            return {
                "audio_base64": audio_base64,
                "voice_status": "success",
                "fallback_text": text,
            }
        else:
            print(f"ElevenLabs Error: {response.status_code} - {response.text}")
            return {
                "audio_base64": None,
                "voice_status": "unavailable",
                "fallback_text": text
            }
    
    except Exception as e:
        print(f"ElevenLabs Exception: {str(e)}")
        return {
            "audio_base64": None,
            "voice_status": "unavailable",
            "fallback_text": text
        }
