from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
from passlib.context import CryptContext
from services.database import DatabaseService
from services.snowflake_service import run_command, run_query

router = APIRouter()

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class RegisterPayload(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    role: str = "client" # client or contractor
    # Contractor specific fields
    business_name: Optional[str] = None
    service_category: Optional[str] = None
    license_id: Optional[str] = None

class LoginPayload(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
async def register(payload: RegisterPayload):
    # 1. Check if user exists
    existing = run_query("SELECT * FROM USERS WHERE EMAIL = %s", [payload.email])
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Hash password
    hashed_password = pwd_context.hash(payload.password)
    user_id = f"user_{uuid.uuid4().hex[:8]}"
    
    # 3. Save to Snowflake (Main Users Table)
    query = """
    INSERT INTO USERS (USER_ID, EMAIL, PASSWORD_HASH, FULL_NAME, PHONE_NUMBER, ROLE)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    params = [user_id, payload.email, hashed_password, payload.full_name, payload.phone_number, payload.role]
    
    try:
        run_command(query, params)
        
        # 4. Role-specific profile creation
        if payload.role == "contractor":
            contractor_query = """
            INSERT INTO CONTRACTORS (CONTRACTOR_ID, FULL_NAME, BUSINESS_NAME, LICENSE_ID, SERVICE_CATEGORY, ACTIVE_STATUS, TIER)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            contractor_params = [
                user_id, 
                payload.full_name, 
                payload.business_name or payload.full_name,
                payload.license_id,
                payload.service_category or "General Handyman",
                "active",
                "Basic"
            ]
            run_command(contractor_query, contractor_params)
        else:
            # Insert into CLIENTS table for regular users
            client_query = """
            INSERT INTO CLIENTS (CLIENT_ID, FULL_NAME, EMAIL, PHONE)
            VALUES (%s, %s, %s, %s)
            """
            client_params = [user_id, payload.full_name, payload.email, payload.phone_number]
            run_command(client_query, client_params)

        return {"status": "success", "user_id": user_id, "message": f"{payload.role.capitalize()} created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login")
async def login(payload: LoginPayload):
    # 1. Get user
    users = run_query("SELECT * FROM USERS WHERE EMAIL = %s", [payload.email])
    if not users:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = users[0]
    
    # 2. Verify password
    if not pwd_context.verify(payload.password, user["PASSWORD_HASH"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "status": "success",
        "user": {
            "user_id": user["USER_ID"],
            "email": user["EMAIL"],
            "full_name": user["FULL_NAME"],
            "role": user["ROLE"],
            "phone_number": user["PHONE_NUMBER"]
        }
    }
