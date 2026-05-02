from typing import List, Optional
from models.domain_models import Contractor, Tier, Urgency
from services.tier_service import TierService

class MatchingService:
    
    @staticmethod
    def calculate_score(contractor: Contractor, requested_tier: Optional[Tier], urgency: Urgency) -> float:
        """
        Calculates the ranking score for a contractor.
        """
        score = 0.0
        
        # 1. Tier Score
        if contractor.tier == Tier.PREMIUM:
            score += 30
        elif contractor.tier == Tier.PLUS:
            score += 20
        elif contractor.tier == Tier.BASIC:
            score += 10
            
        # 2. Acceptance Rate Score
        score += (contractor.acceptance_rate * 20)
        
        # 3. Review Score
        score += (min(contractor.five_star_review_count / 100.0, 1.0) * 20)
        
        # 4. Distance Score
        distance_points = max(0, 20 - contractor.distance_km)
        score += distance_points
        
        # 5. Urgency Bonus
        if urgency in [Urgency.HIGH, Urgency.EMERGENCY] and contractor.tier in [Tier.PREMIUM, Tier.PLUS]:
            score += 10
            
        return score

    @staticmethod
    def rank_contractors(
        contractors: List[Contractor], 
        requested_tier: Optional[Tier], 
        urgency: Urgency, 
        service_category: str
    ) -> List[Contractor]:
        """
        Filters and ranks a list of contractors. 
        If requested_tier is None, it ignores tier restrictions (Fallback Mode).
        """
        if requested_tier:
            eligible_tiers = TierService.get_eligible_contractor_tiers(requested_tier)
        else:
            # Fallback mode: Every tier is eligible
            eligible_tiers = [Tier.BASIC, Tier.PLUS, Tier.PREMIUM]
        
        # Filter
        eligible_contractors = [
            c for c in contractors 
            if c.is_active 
            and c.service_category == service_category
            and c.tier in eligible_tiers
        ]
        
        # Rank by score descending
        eligible_contractors.sort(
            key=lambda c: MatchingService.calculate_score(c, requested_tier, urgency), 
            reverse=True
        )
        
        return eligible_contractors

    @staticmethod
    def find_best_match(
        contractors: List[Contractor], 
        requested_tier: Optional[Tier], 
        urgency: Urgency, 
        service_category: str
    ) -> Optional[Contractor]:
        """Returns the top ranked contractor, or None if no match found."""
        ranked = MatchingService.rank_contractors(contractors, requested_tier, urgency, service_category)
        return ranked[0] if ranked else None
