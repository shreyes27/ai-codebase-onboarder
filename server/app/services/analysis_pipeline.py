# analysis pipeline
import os
import time

from fastapi import HTTPException

from app.services.github_service import clone_repository
from app.services.repository_scanner import scan_repository
from app.services.project_detector import detect_project
from app.services.dependency_analyzer import analyze_dependencies
from app.services.file_filter import filter_relevant_files
from app.services.file_prioritizer import prioritize_files
from app.services.file_reader import read_file_content, select_files_for_analysis
from app.services.repository_context_builder import build_repository_context


def run_repository_analysis(repo_url: str) -> dict:
    timings = {}
    pipeline_start = time.time()

    step_start = time.time()
    repo_path = clone_repository(repo_url)
    timings["clone"] = time.time() - step_start

    print(f"[analysis_pipeline] repo_path: {repo_path}")
    print(f"[analysis_pipeline] os.path.exists(repo_path): {os.path.exists(repo_path)}")

    if not os.path.exists(repo_path):
        raise HTTPException(
            status_code=500,
            detail=f"Cloned repo_path does not exist: {repo_path}"
        )

    step_start = time.time()
    structure = scan_repository(repo_path)
    timings["scan"] = time.time() - step_start
    print(f"[analysis_pipeline] structure.total_files: {structure['total_files']}")
    print(f"[analysis_pipeline] structure.total_folders: {structure['total_folders']}")

    if structure["total_files"] == 0:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Repository at '{repo_path}' scanned as empty (0 files). "
                f"Clone likely failed or is incomplete."
            )
        )

    step_start = time.time()
    project_info = detect_project(repo_path)
    timings["project_detection"] = time.time() - step_start

    step_start = time.time()
    dependencies = analyze_dependencies(repo_path)
    timings["dependencies"] = time.time() - step_start

    step_start = time.time()
    relevant_files = filter_relevant_files(repo_path)
    timings["file_filter"] = time.time() - step_start
    print(f"[analysis_pipeline] len(relevant_files): {len(relevant_files)}")

    step_start = time.time()
    file_priorities = prioritize_files(repo_path, relevant_files)
    timings["prioritization"] = time.time() - step_start
    print(
        f"[analysis_pipeline] high_priority: {file_priorities['high_priority_count']}, "
        f"normal_priority: {file_priorities['normal_priority_count']}, "
        f"low_value: {file_priorities['low_value_count']}"
    )

    step_start = time.time()
    repository_context = build_repository_context(
        repo_path, project_info, dependencies, relevant_files, file_priorities
    )
    timings["module_analysis"] = time.time() - step_start

    step_start = time.time()
    files_for_analysis = select_files_for_analysis(relevant_files, max_files=40)
    timings["file_selection"] = time.time() - step_start
    print(f"[analysis_pipeline] len(files_for_analysis): {len(files_for_analysis)}")

    step_start = time.time()
    file_contents = {}
    for file_path in files_for_analysis:
        content = read_file_content(repo_path, file_path)
        if content is not None:
            file_contents[file_path] = content
    timings["file_reading"] = time.time() - step_start

    timings["total_analysis"] = time.time() - pipeline_start

    print(
        "[performance] " + " ".join(f"{key}={value:.2f}s" for key, value in timings.items())
    )

    return {
        "repo_path": repo_path,
        "structure": structure,
        "project_info": project_info,
        "dependencies": dependencies,
        "relevant_files": relevant_files,
        "file_priorities": file_priorities,
        "repository_context": repository_context,
        "files_for_analysis": files_for_analysis,
        "file_contents": file_contents,
        "timings": timings,
    }
