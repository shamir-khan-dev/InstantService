from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
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
