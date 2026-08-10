"""
____name____:____method____ — the sql surface, in python.

The image's entry point imports this module and serves every public coroutine in
it as `POST /<name>`, which is how the platform addresses `____name____:<name>`.
A second function is a second coroutine here and a second entry in `methods[]`;
nothing else changes. A helper that must not become a route is either a plain
`def` or lives in another module.
"""

from typing import Any, Protocol, TypedDict

from constructive_runtime import DbSession


class Params(TypedDict):
    """
    The inputs `handler.json` declares, as types.

    `subject` is a required string there, so it is a `str` here: the runtime
    compiles the declaration to JSON Schema and answers a payload that violates
    it with a 400 before this coroutine is entered — which is why nothing below
    checks for it. An optional port is `optional: true` in the manifest, not an
    `if` in the body.
    """

    subject: str


class Result(TypedDict):
    answer: str
    #: The role the invocation's transaction assumed — the tenant's, not the pod's.
    role: str


class SqlContext(Protocol):
    """
    What this function is handed as `ctx`: the platform's context, including the
    database.

    Written out as a protocol so an editor and a type checker know the surface —
    the runtime passes its own `FunctionContext`, which satisfies it
    structurally. The **gql** surface is the same protocol without `db`
    (`fun init <name> --surface gql --lang python`).
    """

    job: dict
    agent: Any
    db: Any
    secrets: Any
    storage: Any
    log: Any
    env: dict
    capabilities: Any


async def ____method____(params: Params, ctx: SqlContext) -> Result:
    """
    The sql surface: this function holds a database connection.

    `ctx.db(fn)` runs the callback in one transaction that has assumed a
    low-privilege role and stamped this invocation's identity claims, so the
    tenant's RLS applies to every statement — it commits on return and rolls
    back on raise. There is deliberately no pool on the context: a raw pool is
    the worker's own privileged, RLS-exempt connection, and a handler that
    opened one would be reading every tenant's rows.

    The query below reads what that transaction *is*, because it is the one
    thing true of every database this feature might run against: the role
    follows the invocation's actor (`authenticated` with one, `anonymous`
    without), and the claims name the tenant. Replace it with your own
    statements against the rows a seed put there — the tables belong to the
    platform and the seeds, never to a feature.
    """

    async def read(db: DbSession) -> Any:
        return await db.fetchrow(
            "SELECT current_user AS role, "
            "current_setting('jwt.claims.database_id', true) AS database_id"
        )

    row = await ctx.db(read)
    role = row["role"] if row else None
    database_id = row["database_id"] if row else None
    if not isinstance(role, str) or not isinstance(database_id, str):
        # The transaction always assumes a role and always stamps the claim, so
        # reading neither means this ran somewhere it should not have.
        raise RuntimeError(
            f"____name____:____method____: read role={role} database={database_id}"
        )

    return {"answer": f"{params['subject']} read for {database_id}", "role": role}
