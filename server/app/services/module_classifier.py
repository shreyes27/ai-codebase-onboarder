import os

# Directory name -> category. Checked against every path segment.
CATEGORY_DIR_MAP = {
    "routes": "routes",
    "route": "routes",
    "controllers": "controllers",
    "controller": "controllers",
    "services": "services",
    "service": "services",
    "models": "models",
    "model": "models",
    "schemas": "models",
    "components": "components",
    "pages": "pages",
    "views": "pages",
    "hooks": "hooks",
    "middleware": "middleware",
    "middlewares": "middleware",
    "api": "api",
    "config": "config",
    "configs": "config",
    "settings": "config",
    "utils": "utils",
    "util": "utils",
    "lib": "utils",
    "helpers": "utils",
    "database": "database",
    "db": "database",
    "migrations": "database",
    "auth": "auth",
    "authentication": "auth",
    "reducers": "state",
    "reducer": "state",
    "actions": "state",
    "store": "state",
    "constants": "config",
    "tests": "tests",
    "test": "tests",
    "__tests__": "tests",
    "spec": "tests",
    "styles": "styles",
    "assets": "assets",
    "layouts": "layouts",
}

CONFIG_EXTENSIONS = {".json", ".yml", ".yaml", ".toml", ".ini", ".env"}
STYLE_EXTENSIONS = {".css", ".scss", ".sass", ".less"}


def classify_file(relative_path: str) -> str:
    normalized = relative_path.replace("\\", "/")
    parts = normalized.split("/")
    filename = parts[-1]
    lower_filename = filename.lower()
    extension = os.path.splitext(filename)[1].lower()

    if "test" in lower_filename or "spec" in lower_filename:
        return "tests"

    if extension in STYLE_EXTENSIONS:
        return "styles"

    # Check directory segments (excluding the filename itself)
    for part in parts[:-1]:
        key = part.lower()
        if key in CATEGORY_DIR_MAP:
            return CATEGORY_DIR_MAP[key]

    if "auth" in lower_filename:
        return "auth"

    if lower_filename in {"agent.js", "agent.ts", "client.js", "client.ts", "apiclient.js"}:
        return "api_client"

    if extension in CONFIG_EXTENSIONS or lower_filename.startswith(".env"):
        return "config"

    if extension in {".jsx", ".tsx"}:
        return "components"

    return "other"


def classify_files(relevant_files: list) -> dict:
    """Returns {relative_path: category}"""
    return {path: classify_file(path) for path in relevant_files}