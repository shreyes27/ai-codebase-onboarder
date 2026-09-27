def detect_repository_type(repository_context: dict, project_info: dict) -> str:
    """
    Best-effort classification based on evidence already gathered by the
    pipeline (category_counts, entry_point_type_counts, technologies).
    This is a heuristic, not a certainty - the prompt treats it as a
    starting hypothesis, not a fact to assert confidently.
    """
    category_counts = repository_context.get("category_counts", {})
    entry_type_counts = repository_context.get("entry_point_type_counts", {})

    has_components = category_counts.get("components", 0) > 0
    has_backend_layer = (
        category_counts.get("routes", 0)
        + category_counts.get("api", 0)
        + category_counts.get("controllers", 0)
    ) > 0
    has_cli_entry = entry_type_counts.get("cli_entry", 0) > 0
    package_entry_count = entry_type_counts.get("package_entry", 0)
    total_entry_count = sum(entry_type_counts.values()) or 1
    package_entry_ratio = package_entry_count / total_entry_count
    has_utils_only = (
        category_counts.get("utils", 0) > 0
        and not has_components
        and not has_backend_layer
    )

    # A monorepo claim requires BOTH a meaningful absolute count AND that
    # package entries dominate the detected entry points - a handful of
    # stray package-classified entries in an otherwise ordinary repo
    # should not be enough to call it a monorepo.
    if package_entry_count >= 5 and package_entry_ratio >= 0.5:
        return "monorepo"
    if has_cli_entry:
        return "cli_tool"
    if has_components and has_backend_layer:
        return "full_stack_application"
    if has_components and not has_backend_layer:
        return "frontend_application"
    if has_backend_layer and not has_components:
        return "backend_api"
    if has_utils_only:
        return "library"

    return "general_repository"