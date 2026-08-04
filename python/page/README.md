# ____name____

____description____

```
deploy/ revert/ verify/   the feature's SQL, authored with `pgpm add`
handlers/                 its function — handlers/server.py
__tests__/                the lane, end to end: no cluster, no keys, no network
```

## The lane

This is a **page**: runtime `http` (the code is a container the platform
POSTs to, which is what lets you ship it without rebuilding the compute worker),
channel `page` — a browser reaches it directly: the request is forwarded verbatim and the response goes back unwrapped, headers and status included.

The image serves ordinary routes — `____route____` — because a page is not an envelope.

## Running it

```bash
pgpm docker start --image docker.io/constructiveio/postgres-plus:18
eval "$(pgpm env)"
pnpm --filter "@constructive-functions/feature-____name____" test
```
