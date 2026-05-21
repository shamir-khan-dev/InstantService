# backend/seed_electrical.py
import sys
import os
import uuid

# Add the backend directory to sys.path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_path)

from services.snowflake_service import run_command

def seed_electrical():
    print("Seeding Electrical contractors into Snowflake...")
    contractors = [
        {"name": "Expert Electrical 1", "tier": "Basic"},
        {"name": "Expert Electrical 2", "tier": "Plus"},
        {"name": "Expert Electrical 3", "tier": "Premium"},
    ]
    for c in contractors:
        query = """
        INSERT INTO CONTRACTORS (
            CONTRACTOR_ID, FULL_NAME, BUSINESS_NAME, TIER, 
            SERVICE_CATEGORY, LOCATION, RATING_AVERAGE, 
            FIVE_STAR_REVIEW_COUNT, ACCEPTED_REQUESTS, TOTAL_REQUESTS_PINGED, 
            AVAILABILITY_STATUS, ACTIVE_STATUS
        ) VALUES (%s, %s, %s, %s, %s, 'Toronto', 4.8, 50, 100, 110, 'Available', 'Active')
        """
        params = [
            f"cont_{uuid.uuid4().hex[:6]}", 
            c["name"], 
            f"{c['name']} Solutions", 
            c["tier"],
            "Electrical"
        ]
        try:
            run_command(query, params)
            print(f"Added {c['name']} ({c['tier']})")
        except Exception as e:
            print(f"Failed to add {c['name']}: {e}")
    print("Electrical seeding complete!")

if __name__ == "__main__":
    seed_electrical()
