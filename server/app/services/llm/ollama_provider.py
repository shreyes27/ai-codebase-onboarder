import os
from typing import Optional

import requests

from .base import LLMProvider, LLMConfigurationError, LLMConnectionError, LLMProviderError

# Centralized here (not duplicated per call-site). Every call to
# provider.generate() - whether it's the main onboarding generation or a
# later repair/regeneration pass reusing the same provider instance -
# goes through this single method and therefore always uses this same
# timeout. Override via OLLAMA_TIMEOUT_SECONDS if ever needed; defaults
# to 300s as required.
DEFAULT_TIMEOUT_SECONDS = 300


class OllamaProvider(LLMProvider):

    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
        self.model = os.getenv("OLLAMA_MODEL")
        self.timeout_seconds = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS))

        if not self.model:
            raise LLMConfigurationError(
                "OLLAMA_MODEL is not set. Add it to your .env file, e.g. "
                "OLLAMA_MODEL=llama3.1"
            )

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=self.timeout_seconds,
            )
        except requests.exceptions.ConnectionError as error:
            raise LLMConnectionError(
                f"Could not connect to Ollama at {self.base_url}. "
                f"Is Ollama running? Start it with: ollama serve"
            ) from error
        except requests.exceptions.Timeout as error:
            raise LLMConnectionError(
                f"Ollama request timed out after {self.timeout_seconds}s."
            ) from error

        if response.status_code == 404:
            raise LLMConfigurationError(
                f"Model '{self.model}' not found on Ollama at {self.base_url}. "
                f"Pull it first with: ollama pull {self.model}"
            )

        if response.status_code != 200:
            raise LLMProviderError(
                f"Ollama returned status {response.status_code}: {response.text[:300]}"
            )

        data = response.json()
        return data.get("response", "").strip()
    