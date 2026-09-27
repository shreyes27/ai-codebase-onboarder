import os
import requests

from .base import (
    LLMProviderError,
    LLMConfigurationError,
    LLMConnectionError,
)


class GroqProvider:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.model = os.getenv(
            "GROQ_MODEL",
            "openai/gpt-oss-120b"
        )
        self.base_url = os.getenv(
            "GROQ_BASE_URL",
            "https://api.groq.com/openai/v1"
        )

        if not self.api_key:
            raise LLMConfigurationError(
                "GROQ_API_KEY is not set. Add it to your .env file."
            )

    def generate(self, prompt: str, system_prompt: str | None = None) -> str:
        messages = []

        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt,
            })

        messages.append({
            "role": "user",
            "content": prompt,
        })

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": int(
                        os.getenv("GROQ_MAX_OUTPUT_TOKENS", "2200")
                    ),
                    "reasoning_effort": "low",
                },
                timeout=180,
            )

        except requests.exceptions.ConnectionError as error:
            raise LLMConnectionError(
                f"Could not reach Groq API: {error}"
            ) from error

        except requests.exceptions.Timeout as error:
            raise LLMConnectionError(
                "Groq API request timed out after 180s."
            ) from error

        if response.status_code in (401, 403):
            raise LLMConfigurationError(
                "Groq API rejected the request - check GROQ_API_KEY."
            )

        if response.status_code == 429:
            raise LLMProviderError(
                f"Groq rate limit reached: {response.text[:500]}"
            )

        if response.status_code != 200:
            raise LLMProviderError(
                f"Groq API returned {response.status_code}: "
                f"{response.text[:500]}"
            )

        data = response.json()

        print("[groq] model:", self.model)
        print("[groq] usage:", data.get("usage", {}))

        try:
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, AttributeError) as error:
            raise LLMProviderError(
                f"Unexpected Groq response shape: {data}"
            ) from error