import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

import requests

from .base import LLMProvider, LLMConfigurationError, LLMConnectionError, LLMProviderError


class GeminiProvider(LLMProvider):

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

        if not self.api_key:
            raise LLMConfigurationError(
                "GEMINI_API_KEY is not set. Add it to your .env file."
            )

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )

        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": system_prompt}]})
            contents.append({"role": "model", "parts": [{"text": "Understood."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        try:
            response = requests.post(
                url,
                json={
                    "contents": contents,
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 4000,
                        "thinkingConfig":{
                            "thinkingLevel": "low"
                        }
                    },
                },
                timeout=180,
                )
        except requests.exceptions.ConnectionError as error:
            raise LLMConnectionError(f"Could not reach Gemini API: {error}") from error
        except requests.exceptions.Timeout as error:
            raise LLMConnectionError("Gemini API request timed out after 180s.") from error

        if response.status_code in (401, 403):
            raise LLMConfigurationError(
                "Gemini API rejected the request - check GEMINI_API_KEY."
            )

        if response.status_code != 200:
            raise LLMProviderError(
                f"Gemini API returned {response.status_code}: {response.text[:300]}"
            )

        data = response.json()

        print("[gemini] usage:", data.get("usageMetadata", {}))
        print("[gemini] model:", self.model)
        print("[gemini] response candidates:", len(data.get("candidates", [])))

        if data.get("candidates"):
            print("[gemini] finish_reason:", data["candidates"][0].get("finishReason"))
            print("[gemini] candidate_metadata:", data["candidates"][0].get("finishMessage"))

        try:
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError) as error:
            raise LLMProviderError(f"Unexpected Gemini response shape: {data}") from error
        