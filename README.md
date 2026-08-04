# constructive-functions-boilerplates

Templates `fun init` scaffolds a **feature** from — one directory in
[constructive-functions](https://github.com/constructive-io/constructive-functions)
holding a pgpm module, its functions, its site and its tests.

Its sibling, [function-boilerplates](https://github.com/constructive-io/function-boilerplates),
templates a *handler image* (`node-graphql`, `python`) — the unit a cluster
deploys. This repo templates the unit a developer authors.

```bash
fun init feature my-thing                    # a job: enqueue → worker → handler
fun init feature my-thing --repo <this repo> # explicit
```

## Structure

```
feature/
└── job/    a feature whose function runs off the job queue
```

Kinds land here as their lane becomes runnable outside a cluster: `sync` and
`page` (the sync gateway), `graph` (an FBP graph), and the site kinds.

## Placeholders

Templates use the `____placeholder____` pattern — four underscores each side —
substituted by [genomic](https://www.npmjs.com/package/genomic) at scaffold
time. They appear in file *paths* too: `deploy/schemas/____name_____public/`
becomes `deploy/schemas/greeting_public/`.

Each kind declares its own prompts in `.boilerplate.json`:

| Placeholder | What it is |
|---|---|
| `____name____` | the feature: its directory, pgpm module, and `<name>_public` schema |
| `____task____` | the task identifier a job is queued under, `category:name` |
| `____version____` | initial version, `0.0.1` |
| `____description____` | one line, used in `package.json` and the control file |

## Verifying a template

A template is only correct if the feature it produces installs and passes its
own tests in the workspace:

```bash
fun init feature probe && pnpm install
pnpm --filter "@constructive-functions/feature-probe" test
```
