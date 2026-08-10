"""
____name____:____method____ — the gql surface, in python.

The image's entry point imports this module and serves every public coroutine in
it as `POST /<name>`, which is how the platform addresses `____name____:<name>`.
A second function is a second coroutine here and a second entry in `methods[]`;
nothing else changes. A helper that must not become a route is either a plain
`def` or lives in another module.
"""

from typing import Any, Protocol, TypedDict


class Params(TypedDict):
    """
    The inputs `handler.json` declares, as types.

    `subject` is a required string there, so it is a `str` here: the runtime
    compiles the declaration to JSON Schema and answers a payload that violates
    it with a 400 before this coroutine is entered. That is why there is no
    check for it below — a presence check here would be re-asking a question the
    platform has already refused the request over, and an optional port is
    `optional: true` in the manifest rather than an `if` in the body.
    """

    subject: str


class Result(TypedDict):
    ok: bool


class GqlContext(Protocol):
    """
    What this function is handed as `ctx`: the platform's context, **without the
    database**.

    A GraphQL/HTTP-served function reaches the tenant's API and its declared
    buckets, secrets and models, never Postgres directly. The runtime passes its
    own `FunctionContext`, which carries a `db`; naming the surface here is what
    keeps it out of this function — a type checker rejects `ctx.db`, exactly as
    the node template's `Omit<FunctionContext, 'db'>` does. A feature that reads
    the tenant's database is scaffolded with `--surface sql` instead.
    """

    job: dict
    agent: Any
    secrets: Any
    storage: Any
    log: Any
    env: dict
    capabilities: Any


async def ____method____(params: Params, ctx: GqlContext) -> Result:
    """
    Raising is how this function reports failure — the platform records it and
    retries. Returning an `{"ok": False}` of your own invention hides the
    failure from both.
    """
    ctx.log.info("____name____:____method____", {"subject": params["subject"]})
    return {"ok": True}
