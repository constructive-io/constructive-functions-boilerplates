# constructive-functions-boilerplates

The templates `fun init` scaffolds from: a **feature** in
[constructive-functions](https://github.com/constructive-io/constructive-functions)
— its function, its `handler.json`, and the test that runs it end to end — or a
**platform handler** in constructive-db's own `functions/handlers/`.

```bash
fun init billing --surface gql            # a GraphQL/HTTP feature — no database
fun init billing --surface sql            # a db-connected feature, owning its SQL
fun init billing --surface sql --kind sync --route /billing/export
fun init report --type python             # a platform handler
```

## Structure

```
typescript/            handler/
├── gql/               ├── node-multi-method/
└── sql/               └── python/
```

Two axes, and nothing else: the **surface** is what the function is connected to,
the **language** is what you write it in. Python features wait on the python
runtime mirror (constructive-planning#1455, phase 0.3) — until it lands, a
feature is TypeScript and `handler/python` is how python code ships.

| surface | what it reaches | database |
|---|---|---|
| `gql` | the tenant's API through `ctx.client`, its buckets, secrets and models | **none** — `ctx.db` is not on the context type |
| `sql` | the same, plus a transaction through `ctx.db(fn)`, and a pgpm module of its own | yes |

`ctx.db(fn)` runs the callback in one transaction that has assumed a
low-privilege role and stamped the invocation's identity claims, so the tenant's
RLS applies to every statement. There is no pool on the context by design: a raw
pool is the worker's own privileged, RLS-exempt connection. On the `gql` surface
`db` is removed from the context type outright, so a query is unwritable rather
than discouraged — and a `gql` feature carries no pgpm module, because a schema
named after a feature that owns no SQL was only ever ceremony (and it used to be
granted to `anonymous`).

The **kind** is not a template but a parameter: the same feature, reached a
different way.

| kind | channel | invoked by |
|---|---|---|
| `job` | *(none)* | the queue — returns a job id, nobody waits |
| `sync` | `sync` | the gateway, POST JSON, caller waits |
| `page` | `page` | a browser — request and response pass through verbatim |

All three are the `http` runtime: the code is a container the platform POSTs to,
which is what lets a feature ship without rebuilding the compute worker. `fun
init --kind` writes the channel and route into `handler.json`.

## Placeholders

Templates use the `____placeholder____` pattern — four underscores each side —
substituted by [genomic](https://www.npmjs.com/package/genomic) at scaffold time,
in file *contents* and file *paths* alike.

| Placeholder | What it is |
|---|---|
| `____name____` | the feature: its directory, package, image and the task's category |
| `____method____` | the function: its route on the image, and `____name____:____method____` as the task |
| `____schema____` | `sql` only: the schema its SQL lives in, e.g. `billing_public` |
| `____version____` | initial version |
| `____description____` | one line, used in `package.json` and the control file |

Each template declares its own prompts in its `.boilerplate.json`.

## `handler.json` — the one place a feature is described

Every template scaffolds a `handler.json`, and it is the single source of truth
for everything about the feature that is not behaviour: its task, the image
serving it, the channel and route the gateway mounts it on, the scope that owns
its definition row, and the capabilities it may reach. `fun register` registers
from it and the template's own suite registers from the same file
(`registerFeature`), so the deployed function and the tested function cannot
describe themselves differently.

```json
{
  "name": "billing",
  "type": "node-multi-method",
  "scope": "platform",
  "image": "fn-billing",
  "runtime": "http",
  "accessChannels": ["sync"],
  "route": "/billing/export",
  "requires": {
    "buckets": ["exports"],
    "secrets": [{ "name": "STRIPE_KEY", "required": true }],
    "configs": [{ "name": "EXPORT_ROW_LIMIT", "required": false }],
    "modules": ["notifications_module"],
    "models": ["gpt-4o"]
  },
  "methods": [
    {
      "taskIdentifier": "billing:export",
      "inputs": [{ "name": "month", "type": "string" }],
      "outputs": [{ "name": "url", "type": "string" }]
    }
  ]
}
```

**Declaring is how a capability becomes reachable.** The platform resolves the
declared set per invocation and binds it to the context; `ctx.storage` and
`ctx.secrets` throw on a key the manifest never declared instead of returning
`undefined`, so a forgotten declaration fails in the template's own test rather
than in production. The keys are always logical — `ctx.storage.write('exports', …)`
resolves to the invoking tenant's bucket — and secret *values* never travel in
the manifest, the capability bundle, the payload, the logs, or the pod's
environment.

Capabilities are declared once for the image, not per method: what one route into
a container can touch, every route can. `methods[]` carries what makes a function
a *different* function — its task, its typed `inputs`/`outputs`/`props`.

Dependencies are **not** in `handler.json`. A node feature declares them in the
`package.json` beside it and a python handler in its `requirements.txt`, because
those are the files node and pip actually read; image and system packages belong
to the Dockerfile.

## Verifying a template

A template is only correct if the feature it produces installs and passes its own
tests in the workspace:

```bash
fun init probe --surface sql && pnpm install
pnpm --filter "@constructive-functions/feature-probe" test
```
