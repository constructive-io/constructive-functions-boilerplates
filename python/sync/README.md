# ____name____

____description____

```
deploy/ revert/ verify/   the feature's SQL, authored with `pgpm add`
handlers/                 its function — handlers/____method____.py, served by handlers/server.py
                          handlers/agent.py — the invocation: identity, and agent.embed/inference
__tests__/                the lane, end to end: no cluster, no keys, no network
```

## The lane

This is a **sync**: runtime `http` (the code is a container the platform
POSTs to, which is what lets you ship it without rebuilding the compute worker),
channel `sync` — the gateway invokes it and answers on the caller's own connection, as `{ ok, result, invocationId }`.

The image serves `POST /____method____`, the method route the platform addresses `____name____:____method____` through.

## Running it

```bash
pgpm docker start --image docker.io/constructiveio/postgres-plus:18
eval "$(pgpm env)"
pnpm --filter "@constructive-functions/feature-____name____" test
```
