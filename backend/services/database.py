from config.settings import settings
from typing import List, Optional
from models.domain_models import Contractor, Booking, Tier, BookingStatus
from services.snowflake_service import run_query, run_command

if settings.mock_mode:
    from services import demo_store as _store
else:
    _store = None  # type: ignore


class DatabaseService:
    @staticmethod
    def save_service_request(request_id: str, client_id: str, analysis: dict):
        if settings.mock_mode:
            _store.save_service_request(request_id, client_id, analysis)
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
            analysis["recommended_tier"],
        ]
        run_command(query, params)

    @staticmethod
    def get_all_contractors() -> List[Contractor]:
        if settings.mock_mode:
            return _store.get_all_contractors()

        query = "SELECT * FROM CONTRACTORS WHERE UPPER(COALESCE(ACTIVE_STATUS, '')) = 'ACTIVE'"
        rows = run_query(query)

        contractors = []
        for row in rows:
            accepted_requests = row.get("ACCEPTED_REQUESTS") or 0
            total_requests = row.get("TOTAL_REQUESTS_PINGED") or 0
            acceptance_rate = accepted_requests / total_requests if total_requests else 0.0
            contractors.append(
                Contractor(
                    contractor_id=row["CONTRACTOR_ID"],
                    name=row.get("FULL_NAME") or "Unnamed Contractor",
                    service_category=row.get("SERVICE_CATEGORY") or "General Handyman",
                    location=row.get("LOCATION") or "Unknown",
                    tier=row.get("TIER") or Tier.BASIC,
                    acceptance_rate=acceptance_rate,
                    five_star_review_count=row.get("FIVE_STAR_REVIEW_COUNT") or 0,
                    is_active=(str(row.get("ACTIVE_STATUS") or "").lower() == "active"),
                    distance_km=0.0,
                )
            )
        return contractors

    @staticmethod
    def save_booking(booking: Booking):
        if settings.mock_mode:
            _store.save_booking(booking)
            return

        query = """
        MERGE INTO BOOKINGS target
        USING (SELECT %s AS id) source
        ON target.BOOKING_ID = source.id
        WHEN MATCHED THEN
            UPDATE SET STATUS = %s
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
            booking.premium_coverage,
        ]
        run_command(query, params)

    @staticmethod
    def save_contractor(contractor: Contractor):
        if settings.mock_mode:
            _store.update_contractor(contractor)
            return

        query = """
        UPDATE CONTRACTORS
        SET FIVE_STAR_REVIEW_COUNT = %s,
            TIER = %s
        WHERE CONTRACTOR_ID = %s
        """
        run_command(
            query,
            [
                contractor.five_star_review_count,
                contractor.tier,
                contractor.contractor_id,
            ],
        )

    @staticmethod
    def save_review(booking: Booking):
        if settings.mock_mode:
            return
        if booking.rating is None:
            return

        query = """
        INSERT INTO REVIEWS (
            REVIEW_ID,
            BOOKING_ID,
            CLIENT_ID,
            CONTRACTOR_ID,
            RATING,
            REVIEW_TEXT
        )
        SELECT UUID_STRING(), %s, %s, %s, %s, %s
        """
        run_command(
            query,
            [
                booking.booking_id,
                booking.client_id,
                booking.contractor_id,
                booking.rating,
                booking.review,
            ],
        )

    @staticmethod
    def save_tier_selection(request_id: str, tier_name: str):
        if settings.mock_mode:
            _store.save_tier_selection(request_id, tier_name)
            return

        query = "UPDATE SERVICE_REQUESTS SET SELECTED_TIER = %s WHERE REQUEST_ID = %s"
        run_command(query, [tier_name, request_id])

    @staticmethod
    def get_service_request(request_id: str) -> Optional[dict]:
        if settings.mock_mode:
            return _store.get_service_request(request_id)

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
            "selected_tier": row["SELECTED_TIER"],
        }

    @staticmethod
    def get_booking(booking_id: str) -> Optional[Booking]:
        if settings.mock_mode:
            return _store.get_booking(booking_id)
        rows = run_query("SELECT * FROM BOOKINGS WHERE BOOKING_ID = %s", [booking_id])
        if not rows:
            return None
        row = rows[0]
        return Booking(
            booking_id=row["BOOKING_ID"],
            request_id=row["REQUEST_ID"],
            client_id=row["CLIENT_ID"],
            contractor_id=row["CONTRACTOR_ID"],
            status=row["STATUS"],
            selected_tier=row["TIER_SELECTED"],
            estimated_arrival_window=row.get("SCHEDULED_WINDOW", "30-45 minutes"),
            premium_coverage=bool(row.get("PREMIUM_COVERAGE")),
        )

    @staticmethod
    def update_booking_status(booking_id: str, new_status: BookingStatus) -> bool:
        if settings.mock_mode:
            return _store.update_booking_status(booking_id, new_status)
        try:
            result = run_command(
                "UPDATE BOOKINGS SET STATUS = %s WHERE BOOKING_ID = %s",
                [new_status, booking_id],
            )
            return (result.get("rows_affected") or 0) > 0
        except Exception:
            return False
