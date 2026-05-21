from fastapi import APIRouter, HTTPException
import uuid
from models.request_models import AnalyzeRequestPayload
from models.response_models import AnalyzeRequestResponse
from services.gemini_service import analyze_service_request
from services.database import DatabaseService

router = APIRouter()

@router.post("/analyze-request", response_model=AnalyzeRequestResponse)
async def analyze_request(payload: AnalyzeRequestPayload):
    """
    Analyzes a client's problem description using AI (Gemini) and saves to Snowflake.
    """
    try:
        # 1. Generate a unique request ID
        request_id = f"req_{uuid.uuid4().hex[:8]}"
        
        # 2. Call Gemini Service
        analysis = analyze_service_request(
            message=payload.message,
            location=payload.location,
            property_type=payload.property_type
        )
        
        # 3. Save to Snowflake (using a demo client ID for now)
        DatabaseService.save_service_request(
            request_id=request_id,
            client_id=payload.client_id,
            analysis=analysis,
        )
        
        # 4. Return response
        return AnalyzeRequestResponse(
            request_id=request_id,
            **analysis
        )
        
    except Exception as e:
        print(f"ANALYZE ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze request: {str(e)}")
