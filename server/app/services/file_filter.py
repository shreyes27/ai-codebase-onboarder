import os
import re
import time

IGNORED_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    "dist",
    "build",
    "coverage",
    ".next",
    ".nuxt",
    ".cache",
    ".turbo",
    ".vite",
    "vendor",
    "public",
    "static",
    "out",
    "target",
    "bin",
    "obj",
    ".idea",
    ".vscode",
    "__snapshots__",
    "test-results",
    ".pytest_cache",
    "site-packages",
    "temp_repos",
}

IGNORED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
    ".mp4", ".mp3", ".wav", ".avi", ".mov",
    ".zip", ".tar", ".gz", ".rar", ".7z",
    ".lock", ".map",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".pdf", ".doc", ".docx",
    ".pyc", ".pyo", ".class", ".o", ".so", ".dll", ".exe",
    ".db", ".sqlite", ".sqlite3",
}

# Exact filenames that are always noise regardless of extension
IGNORED_FILENAMES = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "composer.lock",
    "Pipfile.lock",
    "poetry.lock",
    ".DS_Store",
    "Thumbs.db",
}

# Filename patterns for generated/minified/bundled files
IGNORED_FILENAME_PATTERNS = [
    re.compile(r"\.min\.(js|css)$"),
    re.compile(r"\.bundle\.(js|css)$"),
    re.compile(r"\.chunk\.(js|css)$"),
    re.compile(r"\.d\.ts$"),          # generated type declarations
    re.compile(r"^generated[._-]"),
    re.compile(r"\.generated\.(js|ts|py)$"),
]

IMPORTANT_FILENAMES = {
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "README.md",
    "Dockerfile",
    "docker-compose.yml",
    ".env.example",
    "vite.config.js",
    "vite.config.ts",
    "tsconfig.json",
}

SOURCE_EXTENSIONS = {
    ".js", ".jsx", ".ts", ".tsx",
    ".py",
    ".java",
    ".cpp", ".c", ".h", ".hpp",
    ".go",
    ".rs",
    ".php",
    ".rb",
    ".cs",
    ".html",
    ".css", ".scss",
}


def _is_ignored_filename(filename: str) -> bool:
    if filename in IGNORED_FILENAMES:
        return True

    for pattern in IGNORED_FILENAME_PATTERNS:
        if pattern.search(filename):
            return True

    return False


def _looks_minified(file_path: str) -> bool:
    """
    Cheap heuristic: if a JS/CSS file's first line is extremely long,
    it's very likely minified/bundled even without a '.min.' in the name.
    """
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            first_line = f.readline()
        return len(first_line) > 1000
    except Exception:
        return False


def filter_relevant_files(repo_path: str):
    relevant_files = []

    minified_checks = 0
    minified_time = 0.0

    for root, dirs, filenames in os.walk(repo_path):

        dirs[:] = [
            directory
            for directory in dirs
            if directory not in IGNORED_DIRS and not directory.startswith(".")
        ]

        for filename in filenames:

            if filename in IMPORTANT_FILENAMES:
                is_relevant = True
            else:
                extension = os.path.splitext(filename)[1].lower()

                if extension in IGNORED_EXTENSIONS:
                    is_relevant = False
                elif _is_ignored_filename(filename):
                    is_relevant = False
                else:
                    is_relevant = extension in SOURCE_EXTENSIONS

            if not is_relevant:
                continue

            file_path = os.path.join(root, filename)

            ext = os.path.splitext(filename)[1].lower()

            if ext in {".js", ".css"}:
                minified_checks += 1

                start = time.perf_counter()
                is_minified = _looks_minified(file_path)
                minified_time += time.perf_counter() - start

                if is_minified:
                    continue

            relative_path = os.path.relpath(
                file_path,
                repo_path
            ).replace("\\", "/")

            relevant_files.append(relative_path)

    
    return relevant_files