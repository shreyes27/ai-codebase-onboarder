import os
import re


CANDIDATE_ENTRY_FILENAMES = {
    # Python
    "main.py",
    "app.py",
    "manage.py",
    "asgi.py",
    "wsgi.py",
    "run.py",

    # Node / backend
    "server.js",
    "server.ts",
    "app.js",
    "app.ts",

    # Frontend
    "main.jsx",
    "main.tsx",
    "App.jsx",
    "App.tsx",

    # Other languages
    "main.go",
    "main.rs",
}


AMBIGUOUS_INDEX_FILENAMES = {
    "index.js",
    "index.jsx",
    "index.ts",
    "index.tsx",
}


MAX_ENTRY_DEPTH = 3
MAX_FILE_SIZE_FOR_CHECK = 20_000


ENTRY_CONTENT_PATTERNS = [
    re.compile(r"ReactDOM\.\w+"),
    re.compile(r"createRoot\s*\("),
    re.compile(r"app\.listen\s*\("),
    re.compile(r"createServer\s*\("),
    re.compile(
        r"if\s+__name__\s*==\s*['\"]__main__['\"]"
    ),
    re.compile(r"uvicorn\.run\s*\("),
]


# Directory markers used to classify why a candidate file
# is considered an entry point.
TEST_MARKERS = {
    "test",
    "tests",
    "__tests__",
    "spec",
    "specs",
}

FIXTURE_MARKERS = {
    "fixtures",
    "fixture",
}

BENCH_MARKERS = {
    "bench",
    "benchmark",
    "benchmarks",
}

SCRIPT_MARKERS = {
    "scripts",
    "script",
}

PACKAGE_ARTIFACT_MARKERS = {
    "npm",
    "dist",
    "build",
}

CLI_MARKERS = {
    "bin",
    "cli",
}

MONOREPO_PACKAGE_MARKERS = {
    "packages",
}

# These directories commonly contain framework internals
# rather than application bootstrap files.
INTERNAL_MARKERS = {
    "middleware",
    "internal",
    "core",
}


def _looks_like_entry_content(
    repo_path: str,
    relative_path: str,
) -> bool:

    file_path = os.path.join(
        repo_path,
        relative_path,
    )

    try:
        if os.path.getsize(file_path) > MAX_FILE_SIZE_FOR_CHECK:
            return False

        with open(
            file_path,
            "r",
            encoding="utf-8",
            errors="ignore",
        ) as file:
            content = file.read()

    except Exception:
        return False

    return any(
        pattern.search(content)
        for pattern in ENTRY_CONTENT_PATTERNS
    )


def _classify_entry_type(
    normalized_path: str,
    filename: str,
) -> str:

    dir_parts = set(
        normalized_path.split("/")[:-1]
    )

    lower_filename = filename.lower()

    # ---------------------------------------------------------
    # Most specific signals first
    # ---------------------------------------------------------

    if (
        dir_parts & TEST_MARKERS
        or "test" in lower_filename
        or "spec" in lower_filename
    ):
        return "test_entry"

    if dir_parts & FIXTURE_MARKERS:
        return "fixture_entry"

    if (
        dir_parts & BENCH_MARKERS
        or dir_parts & SCRIPT_MARKERS
    ):
        return "script_entry"

    if dir_parts & PACKAGE_ARTIFACT_MARKERS:
        return "package_entry"

    if (
        dir_parts & CLI_MARKERS
        or lower_filename in {"cli.js", "cli.ts"}
    ):
        return "cli_entry"

    if dir_parts & MONOREPO_PACKAGE_MARKERS:
        return "package_entry"

    # ---------------------------------------------------------
    # Framework/library internal files are not automatically
    # production application entry points.
    # ---------------------------------------------------------

    if dir_parts & INTERNAL_MARKERS:
        return "package_entry"

    # ---------------------------------------------------------
    # Explicit server filenames are strongest application
    # runtime evidence.
    # ---------------------------------------------------------

    if lower_filename in {
        "server.js",
        "server.ts",
    }:
        return "server_entry"

    return "app_entry"


def detect_entry_points(
    repo_path: str,
    relevant_files: list,
):

    """
    Returns a list of:

        {
            "path": ...,
            "type": ...
        }

    Downstream consumers can distinguish real application
    bootstrap files from test, fixture, benchmark, CLI,
    package, and internal framework files.
    """

    entry_points = []

    for relative_path in relevant_files:

        normalized = relative_path.replace(
            "\\",
            "/",
        )

        filename = os.path.basename(normalized)

        depth = normalized.count("/")

        if depth > MAX_ENTRY_DEPTH:
            continue

        is_candidate = False

        # -----------------------------------------------------
        # index.* files require actual entry-like content.
        # -----------------------------------------------------

        if filename in AMBIGUOUS_INDEX_FILENAMES:

            if (
                depth <= 1
                and _looks_like_entry_content(
                    repo_path,
                    relative_path,
                )
            ):
                is_candidate = True

        # -----------------------------------------------------
        # Named candidate files are accepted, then classified
        # according to their repository location.
        # -----------------------------------------------------

        elif filename in CANDIDATE_ENTRY_FILENAMES:

            is_candidate = True

        if not is_candidate:
            continue

        entry_type = _classify_entry_type(
            normalized,
            filename,
        )

        entry_points.append(
            {
                "path": relative_path,
                "type": entry_type,
            }
        )

    entry_points.sort(
        key=lambda entry: (
            entry["path"].count("/"),
            entry["path"],
        )
    )

    return entry_points