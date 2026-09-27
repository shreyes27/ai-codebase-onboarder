# main
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.analyze import router as analyze_router
from app.routes.onboarding import router as onboarding_router

app = FastAPI(
    title="AI Codebase Onboarder API",
    description="Backend API for AI-powered repository analysis",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    analyze_router,
    prefix="/api"
)

app.include_router(
    onboarding_router,
    prefix="/api"
)

@app.get("/")
def root():
    return {
        "message": "AI Codebase Onboarder API is running"
    }