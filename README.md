# constructive-functions-boilerplates

The templates `fun init` scaffolds a **feature** from — one directory in
[constructive-functions](https://github.com/constructive-io/constructive-functions)
holding a pgpm module, its function, and the test that runs it end to end.

```bash
fun init billing --kind job  --lang typescript
fun init billing --kind sync --lang python
```

## Structure

Language first, kind inside it — a directory per template, no hyphenated names:

```
typescript/          python/
├── job/             ├── job/
├── sync/            ├── sync/
└── page/            └── page/
```

Six templates, two axes, and nothing else: **kind** is what you are making,
**language** is what you write it in.

| kind | runtime | channel | invoked by |
|---|---|---|---|
| `job` | `http` | *(none)* | the queue — returns a job id, nobody waits |
| `sync` | `http` | `sync` | the gateway, POST JSON, caller waits |
| `page` | `http` | `page` | a browser — request and response pass through verbatim |

All three are the **`http` runtime**: your code is a container the platform
POSTs to, which is what lets you ship one without rebuilding the compute worker.
What differs is the channel. The platform's other runtimes (`handler`, `inline`,
`sql`, `graph`, `resource`) are internal and are not templated here.

Language is independent of all of that, because an image is a URL: a python
feature is the same definition row with a different process behind it. Both
languages' templates are tested the same way, by the same harness.

## Placeholders

Templates use the `____placeholder____` pattern — four underscores each side —
substituted by [genomic](https://www.npmjs.com/package/genomic) at scaffold
time, in file *contents* and file *paths* alike.

| Placeholder | What it is |
|---|---|
| `____name____` | the feature: its directory, pgpm module, package and image |
| `____schema____` | the schema its SQL lives in, e.g. `billing_public` |
| `____method____` | the function: its route on the image, and `____name____:____method____` as the task |
| `____route____` | `sync`/`page` only: the path the gateway serves it at |
| `____version____` | initial version, `0.0.1` |
| `____description____` | one line, used in `package.json` and the control file |

Each template declares its own prompts in its `.boilerplate.json`.

## `handler.json` — the one place a feature is described

Every template scaffolds `handlers/handler.json`, and it is the single source of
truth for everything about the feature that is not behaviour: its task, the
image serving it, the channel and route the gateway mounts it on, and the
capabilities it is allowed to reach. `fun deploy` registers from it, and the
template's own suite registers from it (`registerFeature`), so the deployed
function and the tested function cannot describe themselves differently.

Handler code is therefore behaviour only — no `TASK`, no `IMAGE`, no channel
restated in TypeScript next to the same fact in JSON.

```json
{
  "name": "billing",
  "taskIdentifier": "billing:export",
  "scope": "platform",
  "runtime": "http",
  "accessChannels": ["sync"],
  "route": "/billing/export",
  "requiredBuckets": ["exports"],
  "requiredSecrets": [{ "name": "STRIPE_KEY", "required": true }],
  "requiredConfigs": [{ "name": "EXPORT_ROW_LIMIT", "required": false }],
  "requiredModules": ["notifications_module"],
  "requiredModels": ["gpt-4o"]
}
```

**Declaring is how a capability becomes reachable.** The platform resolves the
declared set per invocation and binds it to the context; `ctx.storage` and
`ctx.secrets` throw on a key the manifest never declared instead of returning
`undefined`, so a forgotten declaration fails in the template's own test rather
than in production. The keys are always logical — `ctx.storage.write('exports', …)`
resolves to the invoking tenant's bucket, and secret *values* never travel in the
manifest, the capability bundle, the payload, the logs, or the pod's environment.

The five declaration arrays are scaffolded empty, which is the correct state for
a feature that reaches for nothing yet.

**`scope` is stated, never inferred.** It decides which definitions plane owns
the function and whether `database_id` keys the row, so registration refuses to
guess: a manifest without it fails rather than landing in whichever plane a
default happened to name. Templates scaffold `"scope": "platform"`; a feature
that belongs to a tenant's own plane changes it to `"database"`.

## Verifying a template

A template is only correct if the feature it produces installs and passes its
own tests in the workspace:

```bash
fun init probe --kind sync --lang python && pnpm install
pnpm --filter "@constructive-functions/feature-probe" test
```
