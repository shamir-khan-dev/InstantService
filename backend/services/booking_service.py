from models.domain_models import Booking, BookingStatus, Contractor, Tier
from typing import Optional

class BookingService:
    @staticmethod
    def complete_booking(booking: Booking, rating: int, review: Optional[str], contractor: Contractor) -> Contractor:
        """
        Marks a booking as completed, processes the rating, 
        and updates the contractor's stats and tier eligibility.
        """
        # 1. Update Booking State
        booking.status = BookingStatus.COMPLETED
        booking.rating = rating
        booking.review = review
        
        # 2. Update Contractor Stats
        # (Assuming acceptance rate was updated during dispatch, we only update reviews here)
        if rating == 5:
            contractor.five_star_review_count += 1
            
        # 3. Recalculate Contractor Tier (Rules from roles.md)
        BookingService._recalculate_contractor_tier(contractor)
        
        return contractor

    @staticmethod
    def _recalculate_contractor_tier(contractor: Contractor):
        """
        Premium: 5-star >= 100, accept_rate >= 70%
        Plus: 5-star >= 30, accept_rate >= 50%
        Basic: Default
        (Assuming insurance_verified is always true for mock data)
        """
        if contractor.five_star_review_count >= 100 and contractor.acceptance_rate >= 0.70:
            contractor.tier = Tier.PREMIUM
        elif contractor.five_star_review_count >= 30 and contractor.acceptance_rate >= 0.50:
            contractor.tier = Tier.PLUS
        else:
            # Note: We usually don't downgrade automatically in real life without warning,
            # but per the strict rules, this is the evaluation.
            contractor.tier = Tier.BASIC
