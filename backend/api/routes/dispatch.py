from fastapi import APIRouter, HTTPException
import uuid
from models.request_models import DispatchPayload
from models.response_models import DispatchResponse
from models.domain_models import Contractor, Tier, Booking, BookingStatus, Urgency
from services.database import DatabaseService
from services.matching_service import MatchingService

router = APIRouter()

@router.post("/dispatch", response_model=DispatchResponse)
async def dispatch_request(payload: DispatchPayload):
    """
    Runs the matching engine to find the best contractor.
    Implements FALLBACK logic and provides friendly error messages if no one is available.
    """
    try:
        # 1. Load request data from Snowflake
        request_data = DatabaseService.get_service_request(payload.request_id)
        if not request_data:
            raise HTTPException(status_code=404, detail="Service request not found in database.")
            
        category = request_data["service_category"]
        urgency = Urgency(request_data["urgency"])
        client_id = request_data["client_id"]
        selected_tier = Tier(request_data["selected_tier"] or "Basic")

        # 2. Load all active contractors from Snowflake
        contractors = DatabaseService.get_all_contractors()
        
        # 3. Initial matching attempt (Requested Tier)
        best_contractor = MatchingService.find_best_match(
            contractors=contractors,
            requested_tier=selected_tier,
            urgency=urgency,
            service_category=category
        )
        
        # 4. FALLBACK LOGIC: If no match, search across ALL tiers
        if not best_contractor:
            best_contractor = MatchingService.find_best_match(
                contractors=contractors,
                requested_tier=None, 
                urgency=urgency,
                service_category=category
            )
        
        if not best_contractor:
            # Friendly message requested by USER
            raise HTTPException(
                status_code=404, 
                detail=f"Sorry, no current worker is available for {category} in your area. Please try again in a few minutes."
            )

        # 5. Create and save the booking
        booking_id = f"bkg_{uuid.uuid4().hex[:8]}"
        
        booking = Booking(
            booking_id=booking_id,
            request_id=payload.request_id,
            client_id=client_id,
            contractor_id=best_contractor.contractor_id,
            status=BookingStatus.DISPATCHED,
            selected_tier=selected_tier, 
            estimated_arrival_window="30-45 minutes",
            premium_coverage=(selected_tier == Tier.PREMIUM)
        )
        
        DatabaseService.save_booking(booking)
        
        status_msg = "Dispatched"
        if best_contractor.tier != selected_tier:
            status_msg = f"Dispatched ({best_contractor.tier} worker assigned for {selected_tier} request)"

        return DispatchResponse(
            booking_id=booking_id,
            contractor=best_contractor,
            estimated_arrival_window="30-45 minutes",
            status=status_msg
        )
        
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        print(f"DISPATCH ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Dispatch failed: {str(e)}")
