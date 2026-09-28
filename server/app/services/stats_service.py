import os

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import credentials, firestore


load_dotenv()


FIRESTORE_COLLECTION = "stats"
FIRESTORE_DOCUMENT = "global"


def _get_db():
    if not firebase_admin._apps:
        credentials_path = os.getenv(
            "GOOGLE_APPLICATION_CREDENTIALS"
        )

        if not credentials_path:
            raise RuntimeError(
                "GOOGLE_APPLICATION_CREDENTIALS is not configured."
            )

        cred = credentials.Certificate(credentials_path)
        firebase_admin.initialize_app(cred)

    return firestore.client()


def get_stats():
    db = _get_db()

    document = (
        db.collection(FIRESTORE_COLLECTION)
        .document(FIRESTORE_DOCUMENT)
    )

    snapshot = document.get()

    if not snapshot.exists:
        return {
            "repos_analyzed": 0,
        }

    data = snapshot.to_dict() or {}

    return {
        "repos_analyzed": int(
            data.get("repos_analyzed", 0)
        ),
    }


def increment_repos_analyzed():
    db = _get_db()

    document = (
        db.collection(FIRESTORE_COLLECTION)
        .document(FIRESTORE_DOCUMENT)
    )

    document.set(
        {
            "repos_analyzed": firestore.Increment(1),
        },
        merge=True,
    )

    return get_stats()