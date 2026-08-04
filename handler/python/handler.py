"""
____name____ Python function handler.

The handler receives a dict payload from the job queue and an optional
AgentContext for LLM inference:
    result = await agent.inference(
        messages=[{"role": "user", "content": "Hello"}],
        model="gpt-4o"
    )
"""

from datetime import datetime, timezone


async def handler(payload: dict, agent=None) -> dict:
    """Process a job payload and return a result."""
    print(f"____name____ received: {payload}")
    return {
        "status": "ok",
        "received": payload,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
