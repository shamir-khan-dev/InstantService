import sys
import os

# Add the backend directory to sys.path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_path)

from passlib.context import CryptContext
from services.snowflake_service import run_command, run_query

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def seed_demo_users():
    print("Seeding demo users into Snowflake database...")
    hashed_password = pwd_context.hash("DemoPass1!")
    
    # 1. Seed Demo Client
    client_email = "demo@instantservice.app"
    existing_client = run_query("SELECT USER_ID FROM USERS WHERE EMAIL = %s", [client_email])
    if not existing_client:
        user_id = "user_demo_client"
        print(f"Creating user entry for {client_email}...")
        run_command(
            "INSERT INTO USERS (USER_ID, EMAIL, PASSWORD_HASH, FULL_NAME, PHONE_NUMBER, ROLE) VALUES (%s, %s, %s, %s, %s, 'client')",
            [user_id, client_email, hashed_password, "Demo Client", "(647) 555-0100"]
        )
        print(f"Creating client entry for {client_email}...")
        run_command(
            "INSERT INTO CLIENTS (CLIENT_ID, FULL_NAME, EMAIL, PHONE) VALUES (%s, %s, %s, %s)",
            [user_id, "Demo Client", client_email, "(647) 555-0100"]
        )
    else:
        print(f"Demo client {client_email} already exists.")

    # 2. Seed Demo Contractor
    contractor_email = "contractor@instantservice.app"
    existing_contractor = run_query("SELECT USER_ID FROM USERS WHERE EMAIL = %s", [contractor_email])
    if not existing_contractor:
        user_id = "user_demo_contractor"
        print(f"Creating user entry for {contractor_email}...")
        run_command(
            "INSERT INTO USERS (USER_ID, EMAIL, PASSWORD_HASH, FULL_NAME, PHONE_NUMBER, ROLE) VALUES (%s, %s, %s, %s, %s, 'contractor')",
            [user_id, contractor_email, hashed_password, "Demo Contractor", "(647) 555-0101"]
        )
        print(f"Creating contractor entry for {contractor_email}...")
        run_command(
            """
            INSERT INTO CONTRACTORS (
                CONTRACTOR_ID, FULL_NAME, BUSINESS_NAME, LICENSE_ID, 
                INSURANCE_VERIFIED, TIER, SERVICE_CATEGORY, SERVICE_RANGE_KM, 
                LOCATION, RATING_AVERAGE, FIVE_STAR_REVIEW_COUNT, ACCEPTED_REQUESTS, 
                TOTAL_REQUESTS_PINGED, AVAILABILITY_STATUS, ACTIVE_STATUS
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            [
                user_id,
                "Demo Contractor",
                "Demo Contractor Solutions",
                "LIC-DEMO-999",
                True,
                "Plus",
                "Plumbing",
                25,
                "Toronto",
                4.8,
                45,
                20,
                30,
                "Available",
                "Active"
            ]
        )
    else:
        print(f"Demo contractor {contractor_email} already exists.")

    print("Demo users seeding complete!")

if __name__ == "__main__":
    seed_demo_users()
