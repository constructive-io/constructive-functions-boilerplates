# ____name____

____description____

```
deploy/ revert/ verify/   the feature's SQL, authored with `pgpm add`
handlers/                 its function — handlers/____method____.py, served by handlers/server.py
__tests__/                the lane, end to end: no cluster, no keys, no network
```

## The lane

This is a **job**: runtime `http` (the code is a container the platform
POSTs to, which is what lets you ship it without rebuilding the compute worker),
channel *(queue)* — enqueued on `app_jobs`, claimed by the compute worker, POSTed to the image; the caller gets a job id.

The image serves `POST /____method____`, the method route the platform addresses `____name____:____method____` through.

## Running it

```bash
pgpm docker start --image docker.io/constructiveio/postgres-plus:18
eval "$(pgpm env)"
pnpm --filter "@constructive-functions/feature-____name____" test
```
