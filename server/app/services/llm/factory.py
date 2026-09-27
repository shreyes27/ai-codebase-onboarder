import os
from dotenv import load_dotenv
from .groq_provider import GroqProvider

from .base import LLMConfigurationError

load_dotenv()


def get_llm_provider():
    """
    Reads LLM_PROVIDER from the environment and returns the matching
    LLMProvider implementation. Concrete providers are imported lazily
    inside each branch so selecting 'ollama' never requires Gemini/OpenAI
    dependencies to be configured, and vice versa.
    """
    provider_name = os.getenv("LLM_PROVIDER", "ollama").strip().lower()

    if provider_name == "ollama":
        from .ollama_provider import OllamaProvider
        return OllamaProvider()

    if provider_name == "gemini":
        from .gemini_provider import GeminiProvider
        return GeminiProvider()

    if provider_name == "openai":
        from .openai_provider import OpenAIProvider
        return OpenAIProvider()

    if provider_name == "groq":
        from .groq_provider import GroqProvider
        return GroqProvider()

    raise LLMConfigurationError(
        f"Unknown LLM_PROVIDER '{provider_name}'. Supported values: "
        f"ollama, gemini, openai, groq."
    )
