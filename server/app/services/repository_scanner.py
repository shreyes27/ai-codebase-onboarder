import os


IGNORED_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "dist",
    "build",
}


def scan_repository(repo_path: str):
    files = []
    folders = []

    for root, dirs, filenames in os.walk(repo_path):

        # Ignore unnecessary directories
        dirs[:] = [
            directory
            for directory in dirs
            if directory not in IGNORED_DIRS
        ]

        relative_root = os.path.relpath(root, repo_path)

        if relative_root != ".":
            folders.append(relative_root)

        for filename in filenames:
            file_path = os.path.join(root, filename)
            relative_path = os.path.relpath(file_path, repo_path)

            files.append(relative_path)

    return {
        "folders": folders,
        "files": files,
        "total_files": len(files),
        "total_folders": len(folders),
    }