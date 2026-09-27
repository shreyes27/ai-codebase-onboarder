import os

MAX_FILE_SIZE = 100_000  # 100 KB
MAX_FILES = 40

IMPORTANT_FILENAMES = {
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "README.md",
    "Dockerfile",
    "docker-compose.yml",
    "vite.config.js",
    "vite.config.ts",
    "tsconfig.json",
    "main.py",
    "app.py",
    "server.py",
    "server.js",
    "index.js",
    "index.ts",
    "index.jsx",
    "index.tsx",
    "App.jsx",
    "App.tsx",
}

IMPORTANT_DIRECTORIES = {
    "src",
    "app",
    "server",
    "api",
    "routes",
    "controllers",
    "services",
    "models",
}


def read_file_content(repo_path: str, relative_path: str):

    file_path = os.path.join(repo_path, relative_path)

    if not os.path.exists(file_path):
        return None

    try:
        file_size = os.path.getsize(file_path)

        if file_size > MAX_FILE_SIZE:
            return "[File too large to read]"

        with open(
            file_path,
            "r",
            encoding="utf-8",
            errors="ignore"
        ) as file:
            return file.read()

    except Exception:
        return "[Unable to read file]"


def select_files_for_analysis(
    relevant_files: list,
    max_files: int = MAX_FILES
):

    selected_files = []

    # First: important root/config files
    for file_path in relevant_files:

        filename = os.path.basename(file_path)
        normalized_path = file_path.replace("\\", "/")
        parts = normalized_path.split("/")

        if filename in IMPORTANT_FILENAMES and file_path not in selected_files:
            selected_files.append(file_path)

    # Second: files inside important directories
    for file_path in relevant_files:

        if len(selected_files) >= max_files:
            break

        normalized_path = file_path.replace("\\", "/")
        parts = normalized_path.split("/")

        if any(
            directory in IMPORTANT_DIRECTORIES
            for directory in parts[:-1]
        ):
            if file_path not in selected_files:
                selected_files.append(file_path)

    # Final safety limit
    return selected_files[:max_files]