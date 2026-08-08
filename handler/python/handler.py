"""
____name____ — a python handler on the platform's runtime.

Every public async function in this module is a method the generated server
serves at `POST /<function>`, which is how the platform addresses
`____name____:<function>`. A second function is a second `async def` here and a
second entry in `methods[]` in `handler.json`; nothing else changes.

Dependencies go in `requirements.txt` beside this file — pip's file, in pip's
shape. `handler.json` carries only what the platform reads: this handler's
identity and the capabilities it may reach.
"""

from datetime import datetime, timezone


async def ____method____(payload: dict, agent=None) -> dict:
    """____description____

    A payload arrives as untyped JSON, so validate it here and raise on anything
    else: a malformed payload is the caller's bug, and raising is how this
    function reports failure — the platform records it and retries.

    `agent` is the inference context, when this handler declares a model:
        result = await agent.inference(
            messages=[{"role": "user", "content": "Hello"}],
            model="gpt-4o",
        )
    """
    print(f"____name____:____method____ received: {payload}")
    return {
        "status": "ok",
        "received": payload,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
