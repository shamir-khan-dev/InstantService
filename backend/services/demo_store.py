"""
In-memory persistence for local development, demos, and MOCK_MODE deployments.
Enables the full analyze → tier → dispatch → voice flow without Snowflake.
"""
from __future__ import annotations

from typing import Dict, List, Optional
from passlib.context import CryptContext

from models.domain_models import Booking, BookingStatus, Contractor, Tier

_pwd = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Demo login: demo@instantservice.app / DemoPass1!
DEMO_CLIENT_EMAIL = "demo@instantservice.app"
DEMO_CONTRACTOR_EMAIL = "contractor@instantservice.app"
DEMO_PASSWORD = "DemoPass1!"

_users: Dict[str, dict] = {}
_users_ready = False


def _ensure_users() -> None:
    global _users_ready
    if _users_ready:
        return
    _users[DEMO_CLIENT_EMAIL.lower()] = {
        "USER_ID": "user_demo_client",
        "EMAIL": DEMO_CLIENT_EMAIL,
        "PASSWORD_HASH": _pwd.hash(DEMO_PASSWORD),
        "FULL_NAME": "Demo Client",
        "PHONE_NUMBER": "(647) 555-0100",
        "ROLE": "client",
    }
    _users[DEMO_CONTRACTOR_EMAIL.lower()] = {
        "USER_ID": "user_demo_contractor",
        "EMAIL": DEMO_CONTRACTOR_EMAIL,
        "PASSWORD_HASH": _pwd.hash(DEMO_PASSWORD),
        "FULL_NAME": "Demo Contractor",
        "PHONE_NUMBER": "(647) 555-0101",
        "ROLE": "contractor",
    }
    _users_ready = True

_CONTRACTORS: List[Contractor] = [
    Contractor(
        contractor_id="cont_001",
        name="Samir Plumbing Co.",
        service_category="Plumbing",
        location="Toronto",
        tier=Tier.BASIC,
        five_star_review_count=12,
        acceptance_rate=0.45,
        is_active=True,
        distance_km=8.0,
    ),
    Contractor(
        contractor_id="cont_002",
        name="Apex Plumbing Services",
        service_category="Plumbing",
        location="Toronto",
        tier=Tier.PLUS,
        five_star_review_count=45,
        acceptance_rate=0.58,
        is_active=True,
        distance_km=5.0,
    ),
    Contractor(
        contractor_id="cont_003",
        name="Elite Rapid Repairs",
        service_category="Plumbing",
        location="Toronto",
        tier=Tier.PREMIUM,
        five_star_review_count=132,
        acceptance_rate=0.78,
        is_active=True,
        distance_km=3.0,
    ),
    Contractor(
        contractor_id="cont_004",
        name="BrightWire Electric",
        service_category="Electrical",
        location="Toronto",
        tier=Tier.PLUS,
        five_star_review_count=52,
        acceptance_rate=0.62,
        is_active=True,
        distance_km=6.0,
    ),
    Contractor(
        contractor_id="cont_005",
        name="CoolAir HVAC Pros",
        service_category="HVAC",
        location="Toronto",
        tier=Tier.PREMIUM,
        five_star_review_count=110,
        acceptance_rate=0.74,
        is_active=True,
        distance_km=4.0,
    ),
    Contractor(
        contractor_id="cont_006",
        name="HandyPro General Services",
        service_category="General Handyman",
        location="Toronto",
        tier=Tier.BASIC,
        five_star_review_count=20,
        acceptance_rate=0.55,
        is_active=True,
        distance_km=10.0,
    ),
]

_service_requests: Dict[str, dict] = {}
_bookings: Dict[str, Booking] = {}


def get_all_contractors() -> List[Contractor]:
    return list(_CONTRACTORS)


def get_contractor(contractor_id: str) -> Optional[Contractor]:
    for c in _CONTRACTORS:
        if c.contractor_id == contractor_id:
            return c
    return None


def save_service_request(request_id: str, client_id: str, analysis: dict) -> None:
    _service_requests[request_id] = {
        "request_id": request_id,
        "client_id": client_id,
        "service_category": analysis["service_category"],
        "problem_summary": analysis["problem_summary"],
        "urgency": analysis["urgency"],
        "recommended_tier": analysis["recommended_tier"],
        "selected_tier": None,
        "raw_analysis": analysis,
    }


def save_tier_selection(request_id: str, tier_name: str) -> None:
    if request_id in _service_requests:
        _service_requests[request_id]["selected_tier"] = tier_name


def get_service_request(request_id: str) -> Optional[dict]:
    return _service_requests.get(request_id)


def save_booking(booking: Booking) -> None:
    _bookings[booking.booking_id] = booking


def get_booking(booking_id: str) -> Optional[Booking]:
    return _bookings.get(booking_id)


def update_booking_status(booking_id: str, new_status: BookingStatus) -> bool:
    booking = _bookings.get(booking_id)
    if not booking:
        return False
    booking.status = new_status
    return True


def find_user_by_email(email: str) -> Optional[dict]:
    _ensure_users()
    return _users.get(email.lower())


def create_user(
    user_id: str,
    email: str,
    password_hash: str,
    full_name: str,
    phone_number: Optional[str],
    role: str,
) -> None:
    _ensure_users()
    _users[email.lower()] = {
        "USER_ID": user_id,
        "EMAIL": email,
        "PASSWORD_HASH": password_hash,
        "FULL_NAME": full_name,
        "PHONE_NUMBER": phone_number,
        "ROLE": role,
    }


def update_contractor(contractor: Contractor) -> None:
    for i, c in enumerate(_CONTRACTORS):
        if c.contractor_id == contractor.contractor_id:
            _CONTRACTORS[i] = contractor
            return
