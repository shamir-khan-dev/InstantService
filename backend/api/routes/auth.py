from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
import re
from passlib.context import CryptContext
from config.settings import settings
from services.snowflake_service import run_command, run_query

if settings.mock_mode:
    from services import demo_store

router = APIRouter()
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def validate_password_complexity(password: str):
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not any(char.isupper() for char in password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not any(char.islower() for char in password):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not any(char.isdigit() for char in password):
        raise ValueError("Password must contain at least one digit.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\/~`']", password):
        raise ValueError("Password must contain at least one special character.")


class RegisterPayload(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone_number: Optional[str] = None
    role: str = "client"
    business_name: Optional[str] = None
    service_category: Optional[str] = None
    license_id: Optional[str] = None


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


def _user_response(user: dict) -> dict:
    return {
        "status": "success",
        "user": {
            "user_id": user["USER_ID"],
            "email": user["EMAIL"],
            "full_name": user["FULL_NAME"],
            "role": user["ROLE"],
            "phone_number": user.get("PHONE_NUMBER"),
        },
    }


@router.post("/register")
async def register(payload: RegisterPayload):
    try:
        validate_password_complexity(payload.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if settings.mock_mode:
        if demo_store.find_user_by_email(payload.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        user_id = f"user_{uuid.uuid4().hex[:8]}"
        demo_store.create_user(
            user_id=user_id,
            email=payload.email,
            password_hash=pwd_context.hash(payload.password),
            full_name=payload.full_name,
            phone_number=payload.phone_number,
            role=payload.role,
        )
        return {
            "status": "success",
            "user_id": user_id,
            "message": f"{payload.role.capitalize()} created successfully",
        }

    existing = run_query("SELECT * FROM USERS WHERE EMAIL = %s", [payload.email])
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(payload.password)
    user_id = f"user_{uuid.uuid4().hex[:8]}"

    query = """
    INSERT INTO USERS (USER_ID, EMAIL, PASSWORD_HASH, FULL_NAME, PHONE_NUMBER, ROLE)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    params = [
        user_id,
        payload.email,
        hashed_password,
        payload.full_name,
        payload.phone_number,
        payload.role,
    ]

    try:
        run_command(query, params)

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
                "Basic",
            ]
            run_command(contractor_query, contractor_params)
        else:
            client_query = """
            INSERT INTO CLIENTS (CLIENT_ID, FULL_NAME, EMAIL, PHONE)
            VALUES (%s, %s, %s, %s)
            """
            run_command(
                client_query,
                [user_id, payload.full_name, payload.email, payload.phone_number],
            )

        return {
            "status": "success",
            "user_id": user_id,
            "message": f"{payload.role.capitalize()} created successfully",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/login")
async def login(payload: LoginPayload):
    if settings.mock_mode:
        user = demo_store.find_user_by_email(payload.email)
        if not user or not pwd_context.verify(payload.password, user["PASSWORD_HASH"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        return _user_response(user)

    users = run_query("SELECT * FROM USERS WHERE EMAIL = %s", [payload.email])
    if not users:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = users[0]
    if not pwd_context.verify(payload.password, user["PASSWORD_HASH"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return _user_response(user)
