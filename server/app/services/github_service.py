import os
import shutil
from git import Repo


def _is_valid_clone(clone_path: str) -> bool:
    """
    A folder existing isn't enough proof of a successful clone - an
    interrupted/failed previous attempt can leave an empty or partial
    directory behind. Presence of .git is a reliable signal that the
    clone actually completed.
    """
    return os.path.isdir(clone_path) and os.path.isdir(os.path.join(clone_path, ".git"))


def clone_repository(repo_url: str):
    repo_name = repo_url.rstrip("/").split("/")[-1]

    if repo_name.endswith(".git"):
        repo_name = repo_name[:-4]

    clone_path = os.path.join("temp_repos", repo_name)

    os.makedirs("temp_repos", exist_ok=True)

    if os.path.exists(clone_path):
        if _is_valid_clone(clone_path):
            return clone_path

        # Stale/incomplete clone from a previous interrupted attempt -
        # remove it so we clone fresh instead of silently reusing garbage.
        print(f"[clone_repository] Found invalid/incomplete clone at "
              f"'{clone_path}' - removing and re-cloning.")
        shutil.rmtree(clone_path, ignore_errors=True)

    Repo.clone_from(
    repo_url,
    clone_path,
    depth=1,
    )

    return clone_path