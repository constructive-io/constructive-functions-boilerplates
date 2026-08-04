"""____description____"""


def ____method____(params: dict, headers: dict) -> dict:
    """The sync lane: a JSON request the caller waits on.

    The return value IS the response — the gateway wraps it as
    `{ok, result, invocationId}` — so keep it small and serializable, and raise
    to return a failure rather than encoding one.
    """
    return {"ok": True}
