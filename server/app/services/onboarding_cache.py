import hashlib
import json
import os
import time

CACHE_DIR = os.path.join("cache", "onboarding")
# 1 hour: repo content can change, so we don't want to serve an
# indefinitely stale guide. This is a simple TTL, not commit-aware,
# since repo_url is currently the only stable key we have.
CACHE_TTL_SECONDS = 60 * 60


def _cache_key(repo_url: str) -> str:
    normalized_repo = repo_url.strip().rstrip("/").lower()

    provider = os.getenv("LLM_PROVIDER", "ollama").strip().lower()

    if provider == "groq":
        model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()
    elif provider == "gemini":
        model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
    elif provider == "ollama":
        model = os.getenv("OLLAMA_MODEL", "").strip()
    elif provider == "openai":
        model = os.getenv("OPENAI_MODEL", "").strip()
    else:
        model = ""

    cache_identity = f"{normalized_repo}|{provider}|{model}"

    return hashlib.sha256(
        cache_identity.encode("utf-8")
    ).hexdigest()


def _cache_path(repo_url: str) -> str:
    os.makedirs(CACHE_DIR, exist_ok=True)
    return os.path.join(CACHE_DIR, f"{_cache_key(repo_url)}.json")


def get_cached_onboarding(repo_url: str):
    """
    Returns the cached response dict if a fresh (within TTL) entry
    exists, otherwise None. Never raises - any read failure just means
    "no usable cache", falling through to normal generation.
    """
    path = _cache_path(repo_url)

    if not os.path.exists(path):
        return None

    try:
        with open(path, "r", encoding="utf-8") as f:
            entry = json.load(f)
    except Exception:
        return None

    if time.time() - entry.get("cached_at", 0) > CACHE_TTL_SECONDS:
        return None

    return entry.get("response")


def store_cached_onboarding(repo_url: str, response: dict):
    """Best-effort write - a cache-write failure must never break the request."""
    path = _cache_path(repo_url)

    entry = {
        "cached_at": time.time(),
        "repo_url": repo_url,
        "response": response,
    }

    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(entry, f)
    except Exception:
        pass
