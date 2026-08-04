# ____name____

____description____

```
deploy/ revert/ verify/   the feature's SQL, authored with `pgpm add`
handlers/                 its compute functions
__tests__/                its tests: no cluster, no keys, no network
```

Its function runs the way production runs one — enqueued on `app_jobs`, claimed
by the compute worker, dispatched to the handler:

```bash
pnpm --filter "@constructive-functions/feature-____name____" test
```
