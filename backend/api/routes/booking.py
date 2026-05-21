from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from models.domain_models import BookingStatus
from models.response_models import CompleteBookingResponse
from services.database import DatabaseService
from services.booking_service import BookingService

router = APIRouter()


class CancelBookingPayload(BaseModel):
    booking_id: str
    reason: Optional[str] = "User requested cancellation"


class CompleteBookingPayload(BaseModel):
    booking_id: str
    rating: int = Field(ge=1, le=5)
    review: Optional[str] = None


@router.post("/complete-booking", response_model=CompleteBookingResponse)  # /api/complete-booking
async def complete_booking(payload: CompleteBookingPayload):
    """Mark booking complete and update contractor review metrics."""
    booking = DatabaseService.get_booking(payload.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    contractors = DatabaseService.get_all_contractors()
    contractor = next(
        (c for c in contractors if c.contractor_id == booking.contractor_id), None
    )
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found.")

    BookingService.complete_booking(
        booking, payload.rating, payload.review, contractor
    )
    DatabaseService.save_booking(booking)

    return CompleteBookingResponse(
        booking_id=payload.booking_id,
        status="Completed",
        message="Booking finalized and reviews updated.",
    )


@router.post("/booking/cancel")
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
