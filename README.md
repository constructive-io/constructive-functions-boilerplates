# constructive-functions-boilerplates

The templates `fun init` scaffolds from: a **feature** in
[constructive-functions](https://github.com/constructive-io/constructive-functions)
— its function, its `handler.json`, and the test that runs it end to end — or a
**platform handler** in constructive-db's own `functions/handlers/`.

```bash
fun init billing --surface gql            # a GraphQL/HTTP feature — no database
fun init billing --surface sql            # a db-connected feature — statements, not schema
fun init billing --surface sql --kind sync --route /billing/export
fun init billing --surface sql --lang python   # the same feature, in python
fun init report --type python             # a platform handler
```

## Structure

```
typescript/            python/             handler/
├── gql/               ├── gql/            ├── node-multi-method/
└── sql/               └── sql/            └── python/
```

Two axes, and nothing else: the **surface** is what the function is connected to,
the **language** is what you write it in. The four cells are the same feature
shape twice, each at home in its own language — `handler.json` beside a
`package.json` for node, beside a `requirements.txt` for python — over one
runtime, mirrored in both (`functions/runtime` and `functions/runtime-py` in
constructive-db), never two implementations free to disagree. `handler/*` is the
separate thing: a *platform* handler in constructive-db's own tree.

A **page** is a node image (`type: "node-page"`), so `--kind page` is a node
feature; a python feature that serves a browser route puts those methods in a
node manifest nested beside its own.

| surface | what it reaches | database |
|---|---|---|
| `gql` | the tenant's API through `ctx.client`, its buckets, secrets and models | **none** — `ctx.db` is not on the context type |
| `sql` | the same, plus a transaction through `ctx.db(fn)` (`await ctx.db(fn)` in python) | yes |

`ctx.db(fn)` runs the callback in one transaction that has assumed a
low-privilege role and stamped the invocation's identity claims, so the tenant's
RLS applies to every statement. There is no pool on the context by design: a raw
pool is the worker's own privileged, RLS-exempt connection. On the `gql` surface
`db` is removed from the context type outright, so a query is unwritable rather
than discouraged.

Statements yes, schema no: neither surface owns the *shape* of the database. Every
table a feature reads exists because the platform or a seed put it there, so a
feature never ships a migration, a grant, or a table invented for a test.

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
| `____version____` | initial version |
| `____description____` | one line, used in `package.json` and the manifest |

Each template declares its own prompts in its `.boilerplate.json`.

## `handler.json` — the one place a feature is described

Every template scaffolds a `handler.json`, and it is the single source of truth
for everything about the feature that is not behaviour: its task, the image
serving it, the channel and route the gateway mounts it on, the scope that owns
its definition row, and the capabilities it may reach. `fun register` registers
from it and the template's own suite registers from the same file
(`registerFeature`), so the deployed function and the tested function cannot
describe themselves differently.

A feature's `image` is its own path, `features/<name>`: that is what
constructive-functions publishes, as
`ghcr.io/constructive-io/features/<name>`, so a manifest naming anything else
names an image nothing builds. (A platform handler in constructive-db keeps the
`fn-<name>` form it has always had.)

```json
{
  "name": "billing",
  "type": "node-multi-method",
  "scope": "platform",
  "image": "features/billing",
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
`package.json` beside it and a python feature in its
`handlers/requirements.txt`, because those are the files node and pip actually
read; image and system packages belong to the Dockerfile.

## What a python feature looks like

The same four files, in python's shape. The image is `constructive_runtime` plus
a FastAPI entry point that imports `handlers/handler.py` and serves every public
coroutine in it as `POST /<name>` — so a method is an `async def`, discovered
rather than registered, and `handlers/index.ts` has no python counterpart:

```python
async def export(params: Params, ctx: SqlContext) -> Result:
    async def read(db: DbSession):
        return await db.fetch("SELECT …")

    return {"rows": await ctx.db(read)}
```

Its suite is TypeScript, because the platform it drives is: it registers the
feature from `handler.json`, stages and starts the real python image
(`startPythonImage`), and invokes it through the real queue. The first run builds
the image's venv under `.image/`; later runs reuse it.

## Verifying a template

A template is only correct if the feature it produces installs and passes its own
tests in the workspace:

```bash
fun init probe --surface sql && pnpm install
pnpm --filter "@constructive-functions/feature-probe" test
```
