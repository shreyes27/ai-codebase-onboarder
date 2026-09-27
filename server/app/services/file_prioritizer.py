# Files that are almost always worth reading regardless of location -
# project manifests, entry points, core config.
CORE_PRIORITY_FILES = {
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "README.md",
    "Dockerfile",
    "docker-compose.yml",
    "vite.config.js",
    "vite.config.ts",
    "tsconfig.json",
    "jsconfig.json",
    "main.py",
    "app.py",
    "server.js",
    "index.js",
}

CORE_PRIORITY_DIRECTORIES = {
    "src",
    "app",
    "server",
    "api",
    "routes",
    "controllers",
    "services",
    "models",
    "components",
}

TEST_MARKERS = {"test", "tests", "__tests__", "spec", "specs", "__mocks__"}
FIXTURE_MARKERS = {"fixtures", "fixture"}
BENCHMARK_MARKERS = {"bench", "benchmark", "benchmarks"}
GENERATED_MARKERS = {"npm", "dist", "build", "coverage", ".cache", "out"}
DOC_MARKERS = {"docs", "doc", "documentation", "examples", "example"}

CONFIG_FILENAME_SUFFIXES = ("config.js", "config.ts", "config.json", "rc.js")


def _is_test_file(filename_lower: str, dir_parts_lower: set) -> bool:
    if dir_parts_lower & TEST_MARKERS:
        return True
    if ".test." in filename_lower or ".spec." in filename_lower:
        return True
    if filename_lower.startswith("test_") or filename_lower.endswith("_test.py"):
        return True
    return False


def _is_config_file(filename: str, filename_lower: str) -> bool:
    if filename.startswith("."):
        return True
    if any(filename_lower.endswith(suffix) for suffix in CONFIG_FILENAME_SUFFIXES):
        return True
    return False


def classify_priority(relative_path: str) -> str:
    """
    Returns one of: 'high', 'normal', 'test', 'fixture', 'benchmark',
    'generated', 'config', 'doc'
    """
    normalized = relative_path.replace("\\", "/")
    parts = normalized.split("/")
    filename = parts[-1]
    filename_lower = filename.lower()
    dir_parts_lower = {p.lower() for p in parts[:-1]}

    if filename in CORE_PRIORITY_FILES:
        return "high"

    if _is_test_file(filename_lower, dir_parts_lower):
        return "test"

    if dir_parts_lower & FIXTURE_MARKERS:
        return "fixture"

    if dir_parts_lower & BENCHMARK_MARKERS:
        return "benchmark"

    if dir_parts_lower & GENERATED_MARKERS:
        return "generated"

    if filename_lower.endswith(".md"):
        return "doc"

    if dir_parts_lower & DOC_MARKERS:
        return "doc"

    if _is_config_file(filename, filename_lower):
        return "config"

    if dir_parts_lower & CORE_PRIORITY_DIRECTORIES:
        return "high"

    return "normal"


def prioritize_files(repo_path: str, relevant_files: list):
    buckets = {
        "high_priority": [],
        "normal_priority": [],
        "test": [],
        "fixture": [],
        "benchmark": [],
        "generated": [],
        "config": [],
        "doc": [],
    }

    for relative_path in relevant_files:
        tier = classify_priority(relative_path)
        if tier == "high":
            buckets["high_priority"].append(relative_path)
        elif tier == "normal":
            buckets["normal_priority"].append(relative_path)
        else:
            buckets[tier].append(relative_path)

    low_value = {
        "test": buckets["test"],
        "fixture": buckets["fixture"],
        "benchmark": buckets["benchmark"],
        "generated": buckets["generated"],
        "config": buckets["config"],
        "doc": buckets["doc"],
    }

    return {
        "high_priority": buckets["high_priority"],
        "normal_priority": buckets["normal_priority"],
        "low_value": low_value,
        "high_priority_count": len(buckets["high_priority"]),
        "normal_priority_count": len(buckets["normal_priority"]),
        "low_value_count": sum(len(v) for v in low_value.values()),
    }