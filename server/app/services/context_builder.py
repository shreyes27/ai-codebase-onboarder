import json

from app.services.flow_builder import build_flow_hints
from app.services.repository_type_detector import detect_repository_type


MAX_MODULE_SUMMARIES = 25
MAX_CODE_SNIPPETS = 2
MAX_SNIPPET_CHARS = 500
MAX_README_CHARS = 1500
MAX_RUNTIME_DEPENDENCY_SAMPLE = 10

MAX_KNOWN_FILE_PATHS = 80

HIGH_VALUE_CATEGORIES = {
    "routes",
    "controllers",
    "services",
    "api",
    "api_client",
    "models",
}

MANIFEST_FILENAMES = {
    "package.json",
    "requirements.txt",
    "pyproject.toml",
}

ENTRY_POINT_TYPE_MEANING = {
    "app_entry": (
        "Possible application bootstrap file. Only call this THE main "
        "entry point if no stronger server_entry evidence exists."
    ),
    "server_entry": (
        "File whose content matched a server-startup pattern "
        "(e.g. app.listen/createServer) - the strongest evidence of a "
        "real runtime entry point."
    ),
    "package_entry": (
    "Package/module entry point used to expose a library or package. "
    "It is NOT a primary application entry point."
    ),
    "script_entry": (
        "Executable/tooling or benchmark script. Not part of the "
        "production application runtime path."
    ),
    "fixture_entry": (
        "Test, example, or fixture-related file. Illustrative only - "
        "never part of the real application flow."
    ),
    "test_entry": (
        "Test-related executable or test entry point. Not part of the "
        "production application runtime path."
    ),
    "cli_entry": (
        "Command-line interface entry point."
    ),
}


def _select_primary_entry_point(entry_points: list):
    server_entries = [
        entry
        for entry in entry_points
        if entry["type"] == "server_entry"
    ]

    if len(server_entries) == 1:
        return server_entries[0]

    if len(server_entries) > 1:
        return None

    app_entries = [
        entry
        for entry in entry_points
        if entry["type"] == "app_entry"
    ]

    if len(app_entries) == 1:
        return app_entries[0]

    return None


def _select_module_summaries(
    module_summaries: dict,
    entry_point_paths: set,
    max_count: int,
):
    items = list(module_summaries.items())

    def score(item):
        path, summary = item

        is_entry = (
            1
            if path in entry_point_paths
            else 0
        )

        is_high_value_category = (
            1
            if summary.get("category") in HIGH_VALUE_CATEGORIES
            else 0
        )

        used_by_count = len(
            summary.get("used_by", [])
        )

        resolved_dependency_count = len(
            summary.get("resolved_dependencies", [])
        )

        return (
            -is_entry,
            -is_high_value_category,
            -used_by_count,
            -resolved_dependency_count,
            path,
        )

    items.sort(key=score)

    selected = {}

    for path, summary in items[:max_count]:
        selected[path] = {
            "category": summary.get("category"),
            "summary": summary.get("summary"),
            "used_by": summary.get("used_by", [])[:8],
            "resolved_dependencies": summary.get(
                "resolved_dependencies",
                [],
            )[:8],
        }

    return selected


def _snippet_score(
    path: str,
    entry_point_paths: set,
    module_summaries: dict,
) -> int:
    if path in entry_point_paths:
        return 10_000

    summary = module_summaries.get(path, {})

    category = summary.get("category")

    used_by_count = len(
        summary.get("used_by", [])
    )

    score = used_by_count * 10

    if category in HIGH_VALUE_CATEGORIES:
        score += 200

    filename = (
        path.replace("\\", "/")
        .rsplit("/", 1)[-1]
    )

    if filename in MANIFEST_FILENAMES:
        score += 150

    return score


def _select_code_snippets(
    file_contents: dict,
    entry_point_paths: set,
    module_summaries: dict,
    max_files: int,
    max_chars: int,
):
    known_core_paths = (
        set(module_summaries.keys())
        | entry_point_paths
    )

    candidates = []

    for path in file_contents:
        normalized_filename = (
            path.replace("\\", "/")
            .rsplit("/", 1)[-1]
        )

        if normalized_filename.lower() == "readme.md":
            continue

        is_manifest = (
            normalized_filename in MANIFEST_FILENAMES
        )

        if (
            path not in known_core_paths
            and not is_manifest
        ):
            continue

        candidates.append(path)

    candidates.sort(
        key=lambda path: -_snippet_score(
            path,
            entry_point_paths,
            module_summaries,
        )
    )

    snippets = []

    for path in candidates[:max_files]:
        content = file_contents[path]

        truncated = content[:max_chars]

        if len(content) > max_chars:
            truncated += "\n... [truncated]"

        snippets.append(
            {
                "file": path,
                "content": truncated,
            }
        )

    return snippets


def _build_known_file_paths(
    selected_summaries: dict,
    entry_point_paths: set,
    code_context: list,
    important_files: list,
    file_priorities: dict,
    relevant_files: list = None,
    max_count: int = MAX_KNOWN_FILE_PATHS,
):
    ordered = []
    seen = set()

    def add(path):
        if not path:
            return

        normalized = path.replace("\\", "/")

        if normalized in seen:
            return

        seen.add(normalized)
        ordered.append(normalized)

    # Highest confidence paths first.
    for path in sorted(entry_point_paths):
        add(path)

    for path in selected_summaries.keys():
        add(path)

    for snippet in code_context:
        add(snippet.get("file"))

    for path in important_files:
        add(path)

    # Complete verified relevant file list.
    if relevant_files:
        for path in relevant_files:
            if len(ordered) >= max_count:
                break

            add(path)

    # High and normal priority files.
    if file_priorities and len(ordered) < max_count:
        for path in file_priorities.get(
            "high_priority",
            [],
        ):
            if len(ordered) >= max_count:
                break

            add(path)

        for path in file_priorities.get(
            "normal_priority",
            [],
        ):
            if len(ordered) >= max_count:
                break

            add(path)

    return sorted(
        ordered[:max_count]
    )


def _build_setup_evidence(
    readme_excerpt: str,
    project_info: dict,
    dependencies: dict,
):
    """
    Keep setup evidence explicit.

    The LLM is allowed to use this evidence for Developer Setup,
    but should not invent commands that are not present here.
    """

    evidence = {
        "readme_excerpt": readme_excerpt,
        "package_name": dependencies.get("package_name"),
        "important_files": project_info.get(
            "important_files",
            [],
        ),
        "note": (
            "Only commands explicitly present in readme_excerpt or "
            "other verified setup metadata should be presented as "
            "developer setup commands. Do not infer commands from "
            "filenames or framework conventions."
        ),
    }

    return evidence


def build_llm_context(
    project_info: dict,
    dependencies: dict,
    structure: dict,
    repository_context: dict,
    file_contents: dict,
    relevant_files: list = None,
    file_priorities: dict = None,
    max_module_summaries: int = MAX_MODULE_SUMMARIES,
    max_code_snippets: int = MAX_CODE_SNIPPETS,
    max_snippet_chars: int = MAX_SNIPPET_CHARS,
    max_readme_chars: int = MAX_README_CHARS,
):
    entry_points = repository_context.get(
        "entry_points",
        [],
    )

    entry_point_paths = {
        entry["path"]
        for entry in entry_points
        if entry.get("path")
    }

    module_summaries_full = repository_context.get(
        "module_summaries",
        {},
    )

    selected_summaries = _select_module_summaries(
        module_summaries_full,
        entry_point_paths,
        max_module_summaries,
    )

    # ------------------------------------------------------------
    # README evidence
    # ------------------------------------------------------------

    readme_excerpt = None

    for candidate in (
        "README.md",
        "readme.md",
        "Readme.md",
    ):
        if candidate in file_contents:
            content = file_contents[candidate]

            readme_excerpt = content[:max_readme_chars]

            if len(content) > max_readme_chars:
                readme_excerpt += "\n... [truncated]"

            break

    # ------------------------------------------------------------
    # Code context
    # ------------------------------------------------------------

    code_context = _select_code_snippets(
        file_contents=file_contents,
        entry_point_paths=entry_point_paths,
        module_summaries=module_summaries_full,
        max_files=max_code_snippets,
        max_chars=max_snippet_chars,
    )

    # ------------------------------------------------------------
    # Repository type
    # ------------------------------------------------------------

    repository_type = detect_repository_type(
        repository_context,
        project_info,
    )

    # ------------------------------------------------------------
    # Flow hints
    # ------------------------------------------------------------

    flow_hints = build_flow_hints(
        repository_context
    )

    # ------------------------------------------------------------
    # Primary entry point
    # ------------------------------------------------------------

    primary_entry_point = _select_primary_entry_point(
        entry_points
    )

    # ------------------------------------------------------------
    # Verified paths
    # ------------------------------------------------------------

    known_file_paths = _build_known_file_paths(
        selected_summaries=selected_summaries,
        entry_point_paths=entry_point_paths,
        code_context=code_context,
        important_files=project_info.get(
            "important_files",
            [],
        ),
        file_priorities=file_priorities,
        relevant_files=relevant_files,
    )

    # ------------------------------------------------------------
    # Dependency evidence
    # ------------------------------------------------------------

    runtime_dependencies = dependencies.get(
        "runtime",
        [],
    )

    development_dependencies = dependencies.get(
        "development",
        [],
    )

    dependency_context = {
        "package_name": dependencies.get(
            "package_name"
        ),
        "runtime_count": len(
            runtime_dependencies
        ),
        "development_count": len(
            development_dependencies
        ),
        "runtime_sample": runtime_dependencies[
            :MAX_RUNTIME_DEPENDENCY_SAMPLE
        ],
        "excluded_builtins": dependencies.get(
            "excluded_builtins",
            [],
        ),
        "note": (
            "VERIFIED EXTERNAL PACKAGE DEPENDENCIES are represented "
            "only by runtime_sample. "
            "development_count is only a count unless a separate "
            "verified development dependency list is supplied. "
            "module_summaries.external_dependencies are import "
            "observations and are NOT package declaration evidence. "
            "Do not invent versions. "
            "Node builtin modules are not external dependencies. "
            "Do not list package_name as its own dependency."
        ),
    }

    # ------------------------------------------------------------
    # Setup evidence
    # ------------------------------------------------------------

    setup_evidence = _build_setup_evidence(
        readme_excerpt=readme_excerpt,
        project_info=project_info,
        dependencies=dependencies,
    )

    # ------------------------------------------------------------
    # Explicit evidence contract
    # ------------------------------------------------------------

    evidence_contract = {
        "known_file_paths": (
            "Complete allowlist of repository file paths that may be "
            "mentioned in the generated guide."
        ),
        "entry_points": (
            "Only authoritative source for repository entry points."
        ),
        "primary_entry_point": (
            "Only authoritative source for the primary application "
            "entry point."
        ),
        "flow_hints": (
            "Only authoritative source for Application Flow."
        ),
        "dependencies": (
            "Only authoritative source for verified package "
            "dependency claims."
        ),
        "module_summaries": (
            "Only authoritative source for Core Modules and verified "
            "module relationships."
        ),
        "code_context": (
            "Implementation evidence only. It may explain a "
            "verified module but MUST NOT create entry points, "
            "flows, dependencies, or architecture layers."
        ),
        "readme_excerpt": (
            "Only the supplied excerpt is evidence. Missing README "
            "content must not be reconstructed."
        ),
        "setup_evidence": (
            "Only explicit setup evidence should be used for "
            "developer setup commands."
        ),
    }

    return {
        # --------------------------------------------------------
        # Repository identity
        # --------------------------------------------------------

        "repository_type": repository_type,

        "evidence_contract": evidence_contract,

        # --------------------------------------------------------
        # Verified paths
        # --------------------------------------------------------

        "known_file_paths": known_file_paths,

        # --------------------------------------------------------
        # Project metadata
        # --------------------------------------------------------

        "project": {
            "important_files": project_info.get(
                "important_files",
                [],
            ),
        },

        "technologies": project_info.get(
            "technologies",
            [],
        ),

        # --------------------------------------------------------
        # Dependencies
        # --------------------------------------------------------

        "dependencies": dependency_context,

        # --------------------------------------------------------
        # Repository structure
        # --------------------------------------------------------

        "structure_summary": {
            "total_files": structure.get(
                "total_files"
            ),
            "total_folders": structure.get(
                "total_folders"
            ),
        },

        "category_counts": repository_context.get(
            "category_counts",
            {},
        ),

        # --------------------------------------------------------
        # Entry point evidence
        # --------------------------------------------------------

        "entry_points": entry_points,

        "entry_point_type_meaning": (
            ENTRY_POINT_TYPE_MEANING
        ),

        "primary_entry_point": primary_entry_point,

        # --------------------------------------------------------
        # Flow evidence
        # --------------------------------------------------------

        "flow_hints": flow_hints,

        # --------------------------------------------------------
        # Module evidence
        # --------------------------------------------------------

        "module_summaries": selected_summaries,

        # --------------------------------------------------------
        # README evidence
        # --------------------------------------------------------

        "readme_excerpt": readme_excerpt,

        # --------------------------------------------------------
        # Setup evidence
        # --------------------------------------------------------

        "setup_evidence": setup_evidence,

        # --------------------------------------------------------
        # Code snippets
        # --------------------------------------------------------

        "code_context": code_context,

        # --------------------------------------------------------
        # Analysis metadata
        # --------------------------------------------------------

        "analysis_metadata": {
            "modules_available": len(
                module_summaries_full
            ),
            "modules_in_context": len(
                selected_summaries
            ),
            "entry_points_available": len(
                entry_points
            ),
            "known_file_paths_count": len(
                known_file_paths
            ),
            "code_snippets_count": len(
                code_context
            ),
        },
    }


def estimate_context_size(context: dict) -> dict:
    serialized = json.dumps(
        context,
        ensure_ascii=False,
    )

    return {
        "characters": len(serialized),
        "approx_tokens": len(serialized) // 4,
    }
