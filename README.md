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

## Verifying a template

A template is only correct if the feature it produces installs and passes its
own tests in the workspace:

```bash
fun init probe --kind sync --lang python && pnpm install
pnpm --filter "@constructive-functions/feature-probe" test
```
