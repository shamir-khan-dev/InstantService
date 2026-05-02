import snowflake.connector
from config.settings import settings
from typing import List, Optional
from models.domain_models import Contractor, Booking, Tier, BookingStatus
import uuid
from services.snowflake_service import run_query, run_command

class DatabaseService:
    @staticmethod
    def save_service_request(request_id: str, client_id: str, analysis: dict):
        if settings.mock_mode:
            return
            
        query = """
        INSERT INTO SERVICE_REQUESTS (REQUEST_ID, CLIENT_ID, SERVICE_CATEGORY, PROBLEM_SUMMARY, URGENCY, RECOMMENDED_TIER)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        params = [
            request_id,
            client_id,
            analysis["service_category"],
            analysis["problem_summary"],
            analysis["urgency"],
            analysis["recommended_tier"]
        ]
        
        run_command(query, params)

    @staticmethod
    def get_all_contractors() -> List[Contractor]:
        if settings.mock_mode:
            return []
        
        query = "SELECT * FROM CONTRACTORS WHERE ACTIVE_STATUS = 'Active'"
        rows = run_query(query)
        
        contractors = []
        for row in rows:
            contractors.append(Contractor(
                contractor_id=row["CONTRACTOR_ID"],
                name=row["FULL_NAME"],
                service_category=row["SERVICE_CATEGORY"],
                location=row["LOCATION"],
                tier=row["TIER"],
                acceptance_rate=(row["ACCEPTED_REQUESTS"] / max(row["TOTAL_REQUESTS_PINGED"], 1)),
                five_star_review_count=row["FIVE_STAR_REVIEW_COUNT"],
                is_active=(row["ACTIVE_STATUS"] == "Active"),
                distance_km=0.0
            ))
        return contractors

    @staticmethod
    def save_booking(booking: Booking):
        if settings.mock_mode:
            return
            
        query = """
        MERGE INTO BOOKINGS target
        USING (SELECT %s AS id) source
        ON target.BOOKING_ID = source.id
        WHEN MATCHED THEN
            UPDATE SET 
                STATUS = %s
        WHEN NOT MATCHED THEN
            INSERT (BOOKING_ID, REQUEST_ID, CLIENT_ID, CONTRACTOR_ID, STATUS, TIER_SELECTED, SCHEDULED_WINDOW, PREMIUM_COVERAGE)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        params = [
            booking.booking_id,
            booking.status,
            booking.booking_id,
            booking.request_id,
            booking.client_id,
            booking.contractor_id,
            booking.status,
            booking.selected_tier,
            booking.estimated_arrival_window,
            booking.premium_coverage
        ]
        
        run_command(query, params)
        
    @staticmethod
    def save_tier_selection(request_id: str, tier_name: str):
        if settings.mock_mode:
            return
            
        query = "UPDATE SERVICE_REQUESTS SET SELECTED_TIER = %s WHERE REQUEST_ID = %s"
        params = [tier_name, request_id]
        
        run_command(query, params)

    @staticmethod
    def get_service_request(request_id: str) -> Optional[dict]:
        if settings.mock_mode:
            return None
            
        query = "SELECT * FROM SERVICE_REQUESTS WHERE REQUEST_ID = %s"
        rows = run_query(query, [request_id])
        
        if not rows:
            return None
            
        row = rows[0]
        return {
            "request_id": row["REQUEST_ID"],
            "client_id": row["CLIENT_ID"],
            "service_category": row["SERVICE_CATEGORY"],
            "problem_summary": row["PROBLEM_SUMMARY"],
            "urgency": row["URGENCY"],
            "selected_tier": row["SELECTED_TIER"]
        }

    @staticmethod
    def update_booking_status(booking_id: str, new_status: BookingStatus) -> bool:
        if settings.mock_mode:
            return True
            
        query = "UPDATE BOOKINGS SET STATUS = %s WHERE BOOKING_ID = %s"
        params = [new_status, booking_id]
        
        try:
            run_command(query, params)
            return True
        except Exception:
            return False
