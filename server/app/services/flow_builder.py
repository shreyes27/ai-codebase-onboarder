# flow builder
# Only these entry types represent a real "start here" path worth walking.
# fixture/test/script/package entries are noise for flow purposes even
# though they're legitimate entry points architecturally.

FLOW_WORTHY_ENTRY_TYPES = {"app_entry", "server_entry", "cli_entry"}

MAX_ENTRY_POINTS_FOR_FLOW = 5
MAX_DEPTH = 2
MAX_BRANCHES_PER_NODE = 4


def _walk_dependencies(current_path, module_summaries, depth_remaining, max_branches, visited):
    if depth_remaining == 0:
        return []

    summary = module_summaries.get(current_path, {})
    deps = summary.get("resolved_dependencies", [])[:max_branches]

    steps = []
    for dep_path in deps:
        if dep_path in visited:
            continue
        visited.add(dep_path)

        dep_summary = module_summaries.get(dep_path, {})
        steps.append({
            "file": dep_path,
            "category": dep_summary.get("category", "other"),
            "purpose": dep_summary.get("purpose", ""),
            "next": _walk_dependencies(
                dep_path, module_summaries, depth_remaining - 1, max_branches, visited
            ),
        })

    return steps


def build_flow_hints(repository_context: dict, max_entry_points: int = MAX_ENTRY_POINTS_FOR_FLOW):
    """
    Returns {"flows": [...], "note": str | None}.

    'flows' entries are {entry_point, entry_type, flow}, where 'flow' is a
    shallow dependency tree walked from resolved_dependencies (real import
    edges already extracted by module_summary_builder) - never guessed.

    IMPORTANT: this does NOT fall back to fixture/script/package entries
    when no real app/server/cli entry point exists. A previous version did
    this and it caused fixture/example files to be treated as if they were
    part of the real application flow. If there's no confident entry
    point, we say so explicitly via 'note' instead of fabricating a chain.
    """
    entry_points = repository_context.get("entry_points", [])
    module_summaries = repository_context.get("module_summaries", {})

    flow_worthy = [e for e in entry_points if e["type"] in FLOW_WORTHY_ENTRY_TYPES]

    if not flow_worthy:
        return {
            "flows": [],
            "note": (
                "No entry point was classified as app_entry, server_entry, or "
                "cli_entry, so a confident runtime flow could not be "
                "constructed from static analysis evidence."
            ),
        }

    flows = []
    for entry in flow_worthy[:max_entry_points]:
        path = entry["path"]
        if path not in module_summaries:
            continue

        visited = {path}
        flows.append({
            "entry_point": path,
            "entry_type": entry["type"],
            "flow": _walk_dependencies(
                path, module_summaries, MAX_DEPTH, MAX_BRANCHES_PER_NODE, visited
            ),
        })

    if not flows:
        return {
            "flows": [],
            "note": (
                "Entry points were identified but none had resolvable "
                "module data available to construct a dependency flow."
            ),
        }

    return {"flows": flows, "note": None}
