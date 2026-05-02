from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from models.domain_models import BookingStatus
from services.database import DatabaseService

router = APIRouter()

class CancelBookingPayload(BaseModel):
    booking_id: str
    reason: Optional[str] = "User requested cancellation"

@router.post("/cancel")
async def cancel_booking(payload: CancelBookingPayload):
    """
    Cancels an active booking in Snowflake.
    """
    try:
        success = DatabaseService.update_booking_status(
            booking_id=payload.booking_id,
            new_status=BookingStatus.CANCELLED
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Booking not found or could not be cancelled.")
            
        return {"status": "success", "message": f"Booking {payload.booking_id} has been cancelled."}
        
    except Exception as e:
        print(f"CANCELLATION ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel booking: {str(e)}")
