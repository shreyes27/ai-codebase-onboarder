import os
from typing import Optional

import requests

from .base import LLMProvider, LLMConfigurationError, LLMConnectionError, LLMProviderError


class OpenAIProvider(LLMProvider):

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

        if not self.api_key:
            raise LLMConfigurationError(
                "OPENAI_API_KEY is not set. Add it to your .env file."
            )

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"model": self.model, "messages": messages},
                timeout=180,
            )
        except requests.exceptions.ConnectionError as error:
            raise LLMConnectionError(f"Could not reach OpenAI API: {error}") from error
        except requests.exceptions.Timeout as error:
            raise LLMConnectionError("OpenAI API request timed out after 180s.") from error

        if response.status_code == 401:
            raise LLMConfigurationError(
                "OpenAI API rejected the request - check OPENAI_API_KEY."
            )

        if response.status_code != 200:
            raise LLMProviderError(
                f"OpenAI API returned {response.status_code}: {response.text[:300]}"
            )

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError) as error:
            raise LLMProviderError(f"Unexpected OpenAI response shape: {data}") from error