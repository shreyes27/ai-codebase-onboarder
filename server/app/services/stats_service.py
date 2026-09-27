import json
from pathlib import Path


STATS_FILE = Path(__file__).resolve().parent.parent / "data" / "stats.json"

DEFAULT_STATS = {
    "repos_analyzed": 0,
}


def _ensure_stats_file():
    STATS_FILE.parent.mkdir(parents=True, exist_ok=True)

    if not STATS_FILE.exists():
        STATS_FILE.write_text(
            json.dumps(DEFAULT_STATS, indent=2),
            encoding="utf-8",
        )


def get_stats():
    _ensure_stats_file()

    try:
        data = json.loads(
            STATS_FILE.read_text(encoding="utf-8")
        )
    except (json.JSONDecodeError, OSError):
        data = DEFAULT_STATS.copy()

    return {
        "repos_analyzed": int(data.get("repos_analyzed", 0)),
    }


def increment_repos_analyzed():
    stats = get_stats()
    stats["repos_analyzed"] += 1

    STATS_FILE.write_text(
        json.dumps(stats, indent=2),
        encoding="utf-8",
    )

    return stats