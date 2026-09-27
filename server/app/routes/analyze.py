from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.analysis_pipeline import run_repository_analysis

router = APIRouter()


class RepositoryRequest(BaseModel):
    repo_url: str


@router.post("/analyze")
def analyze_repository(request: RepositoryRequest):

    try:
        result = run_repository_analysis(request.repo_url)
        file_priorities = result["file_priorities"]

        return {
            "message": "Repository analyzed successfully",
            "repo_url": request.repo_url,
            "structure": result["structure"],
            "project_info": result["project_info"],
            "dependencies": result["dependencies"],
            "relevant_files_count": len(result["relevant_files"]),
            "file_priorities": {
                "high_priority_count": file_priorities["high_priority_count"],
                "normal_priority_count": file_priorities["normal_priority_count"],
                "low_value_count": file_priorities["low_value_count"],
                "low_value_breakdown": {
                    tier: len(files)
                    for tier, files in file_priorities["low_value"].items()
                },
            },
            "repository_context": result["repository_context"],
            "files_for_analysis": result["files_for_analysis"],
            "file_contents": result["file_contents"],
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )