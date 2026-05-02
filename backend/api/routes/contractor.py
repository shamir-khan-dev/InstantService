from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.snowflake_service import run_query, run_command

router = APIRouter(prefix="/api/contractor", tags=["contractor"])


class ContractorResponse(BaseModel):
    request_id: str
    contractor_id: str
    action: str


@router.get("/dashboard/{contractor_id}")
def get_contractor_dashboard(contractor_id: str):
    contractors = run_query(
        """
        SELECT
          CONTRACTOR_ID,
          FULL_NAME,
          BUSINESS_NAME,
          TIER,
          SERVICE_CATEGORY,
          FIVE_STAR_REVIEW_COUNT,
          ACCEPTED_REQUESTS,
          TOTAL_REQUESTS_PINGED,
          AVAILABILITY_STATUS
        FROM CONTRACTORS
        WHERE CONTRACTOR_ID = %s
        """,
        [contractor_id],
    )

    if not contractors:
        raise HTTPException(status_code=404, detail="Contractor not found")

    contractor = contractors[0]

    accepted = contractor["ACCEPTED_REQUESTS"] or 0
    total = contractor["TOTAL_REQUESTS_PINGED"] or 0
    acceptance_rate = round((accepted / total) * 100, 2) if total > 0 else 0

    incoming_pings = run_query(
        """
        SELECT
          de.EVENT_ID,
          de.REQUEST_ID,
          de.CONTRACTOR_ID,
          de.EVENT_TYPE,
          de.EVENT_DETAILS,
          sr.SERVICE_CATEGORY,
          sr.PROBLEM_SUMMARY,
          sr.URGENCY,
          sr.SELECTED_TIER,
          sr.LOCATION
        FROM DISPATCH_EVENTS de
        JOIN SERVICE_REQUESTS sr
          ON de.REQUEST_ID = sr.REQUEST_ID
        WHERE de.CONTRACTOR_ID = %s
          AND de.EVENT_TYPE = 'PING_SENT'
        ORDER BY de.CREATED_AT DESC
        LIMIT 1
        """,
        [contractor_id],
    )

    incoming_ping = incoming_pings[0] if incoming_pings else None

    return {
        "contractor": contractor,
        "metrics": {
            "five_star_review_count": contractor["FIVE_STAR_REVIEW_COUNT"] or 0,
            "accepted_requests": accepted,
            "total_requests_pinged": total,
            "acceptance_rate": acceptance_rate,
        },
        "incoming_ping": incoming_ping,
    }


@router.post("/respond")
def respond_to_ping(payload: ContractorResponse):
    if payload.action not in ["accept", "decline"]:
        raise HTTPException(
            status_code=400,
            detail="Action must be either accept or decline",
        )

    contractor_exists = run_query(
        """
        SELECT CONTRACTOR_ID
        FROM CONTRACTORS
        WHERE CONTRACTOR_ID = %s
        """,
        [payload.contractor_id],
    )

    if not contractor_exists:
        raise HTTPException(status_code=404, detail="Contractor not found")

    request_exists = run_query(
        """
        SELECT REQUEST_ID
        FROM SERVICE_REQUESTS
        WHERE REQUEST_ID = %s
        """,
        [payload.request_id],
    )

    if not request_exists:
        raise HTTPException(status_code=404, detail="Service request not found")

    if payload.action == "accept":
        event_type = "PING_ACCEPTED"

        run_command(
            """
            UPDATE CONTRACTORS
            SET
              ACCEPTED_REQUESTS = ACCEPTED_REQUESTS + 1,
              TOTAL_REQUESTS_PINGED = TOTAL_REQUESTS_PINGED + 1
            WHERE CONTRACTOR_ID = %s
            """,
            [payload.contractor_id],
        )

    else:
        event_type = "PING_DECLINED"

        run_command(
            """
            UPDATE CONTRACTORS
            SET
              TOTAL_REQUESTS_PINGED = TOTAL_REQUESTS_PINGED + 1
            WHERE CONTRACTOR_ID = %s
            """,
            [payload.contractor_id],
        )

    run_command(
        """
        INSERT INTO DISPATCH_EVENTS (
          EVENT_ID,
          REQUEST_ID,
          BOOKING_ID,
          CONTRACTOR_ID,
          EVENT_TYPE,
          EVENT_DETAILS
        )
        SELECT
          UUID_STRING(),
          %s,
          NULL,
          %s,
          %s,
          PARSE_JSON(%s)
        """,
        [
            payload.request_id,
            payload.contractor_id,
            event_type,
            '{"source": "contractor_dashboard", "status": "response_recorded"}',
        ],
    )

    updated_dashboard = get_contractor_dashboard(payload.contractor_id)

    return {
        "success": True,
        "action": payload.action,
        "event_type": event_type,
        "message": "Contractor response recorded.",
        "dashboard": updated_dashboard,
    }