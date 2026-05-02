from models.domain_models import Tier
from typing import List

class TierService:
    @staticmethod
    def get_eligible_contractor_tiers(client_selected_tier: Tier) -> List[Tier]:
        """
        Returns a list of contractor tiers that are eligible to fulfill 
        a request based on the client's selected tier.
        
        MVP Rules from roles.md:
        - Basic: Basic, Plus, Premium
        - Plus: Plus, Premium
        - Premium: Premium first, optional Plus fallback (we return both, matching logic handles ranking)
        """
        if client_selected_tier == Tier.BASIC:
            return [Tier.BASIC, Tier.PLUS, Tier.PREMIUM]
        elif client_selected_tier == Tier.PLUS:
            return [Tier.PLUS, Tier.PREMIUM]
        elif client_selected_tier == Tier.PREMIUM:
            # Matching engine must prioritize Premium, but Plus is a fallback
            return [Tier.PREMIUM, Tier.PLUS]
        return []

    @staticmethod
    def validate_tier_upgrade(current_tier: Tier, new_tier: Tier) -> bool:
        """
        Validates if a user is allowed to upgrade to the selected tier.
        For MVP, users can select any tier recommended or higher.
        """
        # Simplistic validation for MVP
        return True
