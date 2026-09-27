# module summary builder
import posixpath

CATEGORY_PURPOSE_TEMPLATES = {
    "routes": "Defines route/endpoint handling for {exports}",
    "controllers": "Controller logic handling {exports}",
    "services": "Service module providing {exports}",
    "models": "Data model(s): {exports}",
    "components": "UI component: {exports}",
    "pages": "Page-level view: {exports}",
    "hooks": "Custom hook(s): {exports}",
    "middleware": "Middleware handling {exports}",
    "api": "API client wrapper exposing {exports}",
    "config": "Configuration module",
    "utils": "Utility function(s): {exports}",
    "database": "Database access/schema layer: {exports}",
    "auth": "Authentication logic: {exports}",
    "tests": "Test suite",
    "styles": "Stylesheet",
    "state": "State management (reducer/actions/store): {exports}",
    "layouts": "Layout component: {exports}",
    "assets": "Static asset",
    "other": "Module",
}

# Only relative imports (./foo, ../bar) can be reliably resolved to a
# file inside the repo without a full module-resolution algorithm.
# Package imports (react, lodash, ./node_modules/x) are left as external.
RESOLVE_EXTENSIONS = ["", ".js", ".jsx", ".ts", ".tsx", ".py"]
RESOLVE_INDEX_SUFFIXES = ["/index.js", "/index.jsx", "/index.ts", "/index.tsx"]


def _resolve_relative_import(current_file: str, import_path: str, known_files: set):
    if not import_path.startswith("."):
        return None

    current_dir = posixpath.dirname(current_file)
    combined = posixpath.normpath(posixpath.join(current_dir, import_path))

    for ext in RESOLVE_EXTENSIONS:
        candidate = combined + ext
        if candidate in known_files:
            return candidate

    for suffix in RESOLVE_INDEX_SUFFIXES:
        candidate = combined + suffix
        if candidate in known_files:
            return candidate

    return None


def _build_purpose(category: str, exports: list) -> str:
    template = CATEGORY_PURPOSE_TEMPLATES.get(category, CATEGORY_PURPOSE_TEMPLATES["other"])

    if "{exports}" not in template:
        return template

    if not exports:
        return template.split(":")[0].split(" {exports}")[0]

    shown = ", ".join(exports[:4])
    if len(exports) > 4:
        shown += ", ..."

    return template.format(exports=shown)


def build_module_summaries(module_map: dict):
    """
    Input: {relative_path: {"category":.., "imports":[...], "exports":[...]}}
    (the existing module_map - read-only, not mutated)

    Output: {relative_path: {
        "category", "imports", "exports",   <- carried over unchanged
        "purpose",                          <- rule-based one-line description
        "resolved_dependencies",            <- imports resolved to repo files
        "external_dependencies",            <- imports that are external packages
        "used_by",                          <- reverse of resolved_dependencies
    }}
    """
    known_files = set(module_map.keys())

    resolved_deps = {}
    external_deps = {}

    for file_path, info in module_map.items():
        local_deps = []
        ext_deps = []

        for imp in info.get("imports", []):
            resolved = _resolve_relative_import(file_path, imp, known_files)
            if resolved:
                local_deps.append(resolved)
            else:
                ext_deps.append(imp)

        resolved_deps[file_path] = sorted(set(local_deps))
        external_deps[file_path] = sorted(set(ext_deps))

    used_by = {file_path: [] for file_path in module_map.keys()}
    for file_path, deps in resolved_deps.items():
        for dep in deps:
            if dep in used_by:
                used_by[dep].append(file_path)

    summaries = {}
    for file_path, info in module_map.items():
        category = info.get("category", "other")
        exports = info.get("exports", [])

        summaries[file_path] = {
            "category": category,
            "imports": info.get("imports", []),
            "exports": exports,
            "purpose": _build_purpose(category, exports),
            "resolved_dependencies": resolved_deps[file_path],
            "external_dependencies": external_deps[file_path],
            "used_by": sorted(set(used_by[file_path])),
        }

    return summaries