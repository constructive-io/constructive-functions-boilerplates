"""____description____"""

from agent import AgentContext


def ____method____(params: dict, agent: AgentContext) -> dict:
    """The sync lane: a JSON request the caller waits on.

    The return value IS the response — the gateway wraps it as
    `{ok, result, invocationId}` — so keep it small and serializable, and raise
    to return a failure rather than encoding one.

    `agent` is the invocation: `agent.database_id`, `agent.actor_id`, and
    `agent.embed(...)` / `agent.inference(...)` reaching the tenant's own model
    without this function ever holding a key.
    """
    return {"ok": True}
