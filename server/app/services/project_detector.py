import os


def detect_project(repo_path: str):
    files = set()

    for root, dirs, filenames in os.walk(repo_path):
        dirs[:] = [
            directory
            for directory in dirs
            if directory not in {
                ".git",
                "node_modules",
                "__pycache__",
                ".venv",
                "venv",
                "dist",
                "build",
            }
        ]

        for filename in filenames:
            files.add(filename)

    technologies = []
    important_files = []

    # JavaScript / Node
    if "package.json" in files:
        technologies.append("Node.js / JavaScript")
        important_files.append("package.json")

    # Python
    if "requirements.txt" in files:
        technologies.append("Python")
        important_files.append("requirements.txt")

    if "pyproject.toml" in files:
        technologies.append("Python")
        important_files.append("pyproject.toml")

    # React
    if "package.json" in files:
        technologies.append("React")

    # Docker
    if "Dockerfile" in files:
        technologies.append("Docker")
        important_files.append("Dockerfile")

    # Documentation
    if "README.md" in files:
        important_files.append("README.md")

    # Environment
    if ".env.example" in files:
        important_files.append(".env.example")

    return {
        "technologies": list(set(technologies)),
        "important_files": list(set(important_files)),
    }