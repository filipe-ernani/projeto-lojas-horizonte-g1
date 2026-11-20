from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.genai import types

from agente_horizonte.config import gemini_max_attempts_per_model, gemini_models
from agente_horizonte.models import GeminiFallback
from agente_horizonte.prompt import AGENT_INSTRUCTION
from agente_horizonte.tools import (
    get_product_details,
    hide_internal_ids,
    initialize_index,
    require_product_name,
    search_products,
)

model_names = gemini_models()
model = GeminiFallback(
    model=model_names[0],
    models=tuple(
        Gemini(model=name, retry_options=types.HttpRetryOptions(attempts=1)) for name in model_names
    ),
    max_attempts_per_model=gemini_max_attempts_per_model(),
)
initialize_index()

root_agent = Agent(
    name="agente_horizonte",
    model=model,
    description="Lojas Horizonte customer support grounded in catalog and review evidence.",
    instruction=AGENT_INSTRUCTION,
    before_agent_callback=require_product_name,
    after_model_callback=hide_internal_ids,
    tools=[search_products, get_product_details],
    generate_content_config=types.GenerateContentConfig(
        temperature=0.2,
        http_options=types.HttpOptions(timeout=30_000),
    ),
)
