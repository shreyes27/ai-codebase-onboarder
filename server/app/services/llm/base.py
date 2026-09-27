from abc import ABC, abstractmethod
from typing import Optional


class LLMProviderError(Exception):
    """Base exception for any LLM provider failure."""
    pass


class LLMConfigurationError(LLMProviderError):
    """Raised when required configuration/credentials are missing or invalid."""
    pass


class LLMConnectionError(LLMProviderError):
    """Raised when the provider cannot be reached (network/connection issue)."""
    pass


class LLMProvider(ABC):
    """
    The only interface the rest of the application should talk to.
    Business logic (onboarding_generator, routes, etc.) must never import
    a concrete provider (Ollama/Gemini/OpenAI) directly - only this class,
    obtained via llm.factory.get_llm_provider().
    """

    @abstractmethod
    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Send a prompt to the underlying LLM and return the generated text.
        Must raise LLMConfigurationError / LLMConnectionError / LLMProviderError
        on failure - never let a provider-specific exception leak out.
        """
        raise NotImplementedError