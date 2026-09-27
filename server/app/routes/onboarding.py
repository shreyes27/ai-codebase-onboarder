from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.analysis_pipeline import run_repository_analysis
from app.services.onboarding_generator import generate_onboarding_guide
from app.services.onboarding_cache import get_cached_onboarding, store_cached_onboarding
from app.services.llm import LLMProviderError
from app.services.stats_service import (
    get_stats,
    increment_repos_analyzed,
)

router = APIRouter()


@router.get("/stats")
def get_application_stats():
    return get_stats()


class OnboardingRequest(BaseModel):
    repo_url: str
    force_refresh: bool = False


@router.post("/onboard")
def generate_onboarding(request: OnboardingRequest):

    if not request.force_refresh:
        cached = get_cached_onboarding(request.repo_url)
        if cached is not None:
            cached["cache_hit"] = True
            return cached

    try:
        analysis = run_repository_analysis(request.repo_url)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))

    try:
        result = generate_onboarding_guide(
            project_info=analysis["project_info"],
            dependencies=analysis["dependencies"],
            structure=analysis["structure"],
            repository_context=analysis["repository_context"],
            file_contents=analysis["file_contents"],
            relevant_files=analysis["relevant_files"],
            file_priorities=analysis["file_priorities"],
        )
    except LLMProviderError as error:
        if "rate limit" in str(error).lower():
            raise HTTPException(
                status_code=429,
                detail="Please try again after 1 minute.",
            )

        raise HTTPException(
            status_code=502,
            detail=str(error),
        )

    analysis_summary = {
        "total_files": analysis["structure"].get("total_files"),
        "total_folders": analysis["structure"].get("total_folders"),
        "relevant_files": len(analysis["relevant_files"]),
        "entry_points": len(
            analysis["repository_context"].get("entry_points", [])
        ),
        "modules_analyzed": analysis["repository_context"].get(
            "modules_analyzed"
        ),
    }

    response = {
        "message": "Onboarding guide generated successfully",
        "repo_url": request.repo_url,
        "provider": result["provider"],
        "repository_type": result["repository_type"],
        "context_size": result["context_size"],
        "generation_time_seconds": result["generation_time_seconds"],
        "analysis_summary": analysis_summary,
        "validation": result["validation"],
        "onboarding_guide": result["onboarding_guide"],
        "cache_hit": False,
    }

    store_cached_onboarding(request.repo_url, response)

    increment_repos_analyzed()

    return response