import httpx
from config import (
    LLM_PROVIDER,
    LLM_MODEL,
    OLLAMA_BASE_URL,
    OPENROUTER_API_KEY,
    OPENROUTER_MODEL,
)

SYSTEM_PROMPT = (
    "You are a helpful assistant that answers questions based on the provided documents. "
    "Use the context below to answer the user's question accurately. "
    "If the context doesn't contain enough information, say so honestly. "
    "Always cite which document the information came from when possible. "
    "Respond in the same language the user writes in."
)


async def generate_response(query: str, context: str) -> str:
    if not context:
        return (
            "I couldn't find relevant information in the uploaded documents. "
            "Please upload documents related to your question or try rephrasing."
        )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Context from documents:\n\n{context}\n\n"
                f"---\n\nQuestion: {query}"
            ),
        },
    ]

    if LLM_PROVIDER == "ollama":
        return await _ollama_chat(messages)
    if LLM_PROVIDER == "openrouter":
        return await _openrouter_chat(messages)
    raise ValueError(f"Unknown LLM provider: {LLM_PROVIDER}")


async def _ollama_chat(messages: list[dict]) -> str:
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={"model": LLM_MODEL, "messages": messages, "stream": False},
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"]


async def _openrouter_chat(messages: list[dict]) -> str:
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY not set in .env")
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"model": OPENROUTER_MODEL, "messages": messages},
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def check_llm_health() -> dict:
    try:
        if LLM_PROVIDER == "ollama":
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                models = [m["name"] for m in resp.json().get("models", [])]
                return {
                    "provider": "ollama",
                    "status": "connected",
                    "model": LLM_MODEL,
                    "available_models": models,
                }
        if LLM_PROVIDER == "openrouter":
            return {
                "provider": "openrouter",
                "status": "configured" if OPENROUTER_API_KEY else "missing_key",
                "model": OPENROUTER_MODEL,
            }
    except httpx.ConnectError:
        return {"provider": LLM_PROVIDER, "status": "disconnected"}
    return {"provider": LLM_PROVIDER, "status": "unknown"}
