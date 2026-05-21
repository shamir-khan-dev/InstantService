from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from api.routes.health import router as health_router
from api.routes.contractor import router as contractor_router
from api.routes.analyze_request import router as analyze_router
from api.routes.tier import router as tier_router
from api.routes.dispatch import router as dispatch_router
from api.routes.booking import router as booking_router
from api.routes.voice import router as voice_router
from api.routes.auth import router as auth_router

# Initialize FastAPI app
app = FastAPI(
    title="InstantService API",
    description="Backend API and Dispatch Engine for InstantService",
    version="1.0.0",
)

# Set up CORS for the frontend PWA
allowed_origins = [
    origin.strip()
    for origin in settings.frontend_origin.split(",")
    if origin.strip()
]
for local_origin in ["http://localhost:3000", "http://127.0.0.1:3000"]:
    if settings.mock_mode and local_origin not in allowed_origins:
        allowed_origins.append(local_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "InstantService Backend"}

# Include routers
app.include_router(analyze_router, prefix="/api", tags=["Analysis"])
app.include_router(tier_router, prefix="/api", tags=["Tier Selection"])
app.include_router(dispatch_router, prefix="/api", tags=["Dispatching"])
app.include_router(booking_router, prefix="/api", tags=["Booking"])
app.include_router(voice_router, prefix="/api", tags=["Voice"])
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(contractor_router)
app.include_router(health_router)
