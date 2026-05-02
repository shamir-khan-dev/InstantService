from fastapi import APIRouter, HTTPException
from models.request_models import SelectTierPayload
from models.response_models import SelectTierResponse
from services.database import DatabaseService

router = APIRouter()

@router.post("/select-tier", response_model=SelectTierResponse)
async def select_tier(payload: SelectTierPayload):
    """
    Saves the user's selected service tier for their request to Snowflake.
    """
    try:
        # Save selected tier to Snowflake (snowflake_service will handle Enum conversion)
        DatabaseService.save_tier_selection(
            request_id=payload.request_id,
            tier_name=payload.selected_tier
        )
        
        return SelectTierResponse(
            request_id=payload.request_id,
            status="success",
            selected_tier=payload.selected_tier
        )
    except Exception as e:
        print(f"ERROR saving tier selection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save tier selection: {str(e)}")
