import asyncio
import logging
from collections.abc import AsyncGenerator

from google.adk.models.base_llm import BaseLlm
from google.adk.models.google_llm import Gemini
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.genai.errors import APIError

logger = logging.getLogger(__name__)
_TRANSIENT_CODES = {408, 429, 500, 502, 503, 504}


class GeminiFallback(BaseLlm):
    """ADK model adapter with bounded retries and ordered Gemini fallback."""

    models: tuple[Gemini, ...]
    max_attempts_per_model: int = 2

    async def generate_content_async(
        self, llm_request: LlmRequest, stream: bool = False
    ) -> AsyncGenerator[LlmResponse, None]:
        for model_index, model in enumerate(self.models):
            for attempt in range(self.max_attempts_per_model):
                emitted = False
                request = llm_request.model_copy(deep=True, update={"model": model.model})
                try:
                    async for response in model.generate_content_async(request, stream=stream):
                        emitted = True
                        yield response
                    logger.info("Gemini response completed: model=%s", model.model)
                    return
                except APIError as error:
                    if emitted:
                        raise RuntimeError(
                            "Gemini response interrupted; retry the request."
                        ) from None
                    if error.code not in _TRANSIENT_CODES:
                        raise RuntimeError(
                            f"Gemini request rejected (HTTP {error.code}); "
                            "check API key, model access and request configuration."
                        ) from None
                    logger.warning(
                        "Gemini transient failure: model=%s attempt=%d code=%d",
                        model.model,
                        attempt + 1,
                        error.code,
                    )
                    if attempt + 1 < self.max_attempts_per_model or model_index + 1 < len(
                        self.models
                    ):
                        await asyncio.sleep(1)
        raise RuntimeError(
            "All configured Gemini models are unavailable; try again later."
        ) from None
