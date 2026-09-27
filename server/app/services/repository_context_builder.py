# repository context builder
from app.services.entry_point_detector import detect_entry_points
from app.services.module_classifier import classify_file
from app.services.import_extractor import extract_imports_exports
from app.services.module_summary_builder import build_module_summaries

# Temporary safety cap on how many files get full module-map treatment
# (classification + import/export parsing). Only high + normal priority
# files are eligible - tests/fixtures/benchmarks/generated/config/docs
# are intentionally excluded so the budget goes to real production code.
MAX_FILES_FOR_MODULE_MAP = 1500


def build_repository_context(
    repo_path: str,
    project_info: dict,
    dependencies: dict,
    relevant_files: list,
    file_priorities: dict,
    max_files_for_module_map: int = MAX_FILES_FOR_MODULE_MAP,
):
    entry_points = detect_entry_points(repo_path, relevant_files)

    entry_point_type_counts = {}
    for entry in entry_points:
        entry_point_type_counts[entry["type"]] = entry_point_type_counts.get(entry["type"], 0) + 1

    ordered_files = (
        file_priorities.get("high_priority", [])
        + file_priorities.get("normal_priority", [])
    )
    files_to_process = ordered_files[:max_files_for_module_map]

    module_map = {}
    category_counts = {}

    for relative_path in files_to_process:
        category = classify_file(relative_path)
        category_counts[category] = category_counts.get(category, 0) + 1

        imports_exports = extract_imports_exports(repo_path, relative_path)

        module_map[relative_path] = {
            "category": category,
            "imports": imports_exports["imports"],
            "exports": imports_exports["exports"],
        }

    # Layer 5: rule-based summaries + resolved dependency graph.
    # module_map itself stays untouched above - this is additive.
    module_summaries = build_module_summaries(module_map)

    return {
        "entry_points": entry_points,
        "entry_point_type_counts": entry_point_type_counts,
        "module_map": module_map,
        "module_summaries": module_summaries,
        "category_counts": category_counts,
        "modules_analyzed": len(files_to_process),
        "modules_skipped": max(0, len(ordered_files) - len(files_to_process)),
        "low_value_files_excluded": file_priorities.get("low_value_count", 0),
        "technologies": project_info.get("technologies", []),
        "dependency_summary": {
            "runtime_count": len(dependencies.get("runtime", [])),
            "development_count": len(dependencies.get("development", [])),
        },
    }