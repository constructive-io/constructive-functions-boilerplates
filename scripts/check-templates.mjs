#!/usr/bin/env node
/**
 * What `fun init` emits *is* the standard a feature is authored to, whatever the
 * docs say — so the templates are checked against it here, on every push.
 *
 * These are the invariants that have drifted before and that drift silently: an
 * image name nothing publishes, and a method declaring no inputs, which leaves
 * the runtime with nothing to enforce and the author writing the presence check
 * the platform exists to make unnecessary.
 *
 * Deliberately node builtins only: this repository holds templates, not a
 * package, and a check that needed installing would not be run.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Feature templates: a feature's image is its own path under `features/`. */
const FEATURE_TEMPLATES = ['typescript/gql', 'typescript/sql', 'python/gql', 'python/sql'];

/** The image `type` each language's feature template declares. */
const FEATURE_IMAGE_TYPE = { typescript: 'node-multi-method', python: 'python' };

/** Platform handler templates, which keep constructive-db's `fn-<name>` form. */
const HANDLER_TEMPLATES = ['handler/node-multi-method', 'handler/python'];

const NAME = '____name____';
const METHOD = '____method____';

const problems = [];

/** `dir/handlers/handler.json` for a feature, `dir/handler.json` for a handler. */
function manifestPath(dir) {
  const nested = path.join(root, dir, 'handlers', 'handler.json');
  return fs.existsSync(nested) ? nested : path.join(root, dir, 'handler.json');
}

function read(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    // A template whose manifest does not parse scaffolds a feature that cannot
    // be registered, so this is the check failing, not the check giving up.
    problems.push(`${path.relative(root, file)}: not valid JSON — ${err.message}`);
    return null;
  }
}

/**
 * The methods a manifest declares, in either shape: `methods[]` for an image
 * serving several, and the top-level fields for one — which is what a
 * single-function platform handler writes, and is not drift.
 */
function methodsOf(manifest) {
  if (Array.isArray(manifest.methods) && manifest.methods.length > 0) return manifest.methods;
  return manifest.taskIdentifier ? [manifest] : [];
}

function checkMethods(rel, manifest) {
  const methods = methodsOf(manifest);
  if (methods.length === 0) {
    problems.push(`${rel}: declares no method, so it serves nothing`);
    return;
  }
  for (const method of methods) {
    const task = method.taskIdentifier;
    if (task !== `${NAME}:${METHOD}`) {
      problems.push(
        `${rel}: taskIdentifier is ${JSON.stringify(task)}, expected "${NAME}:${METHOD}" — ` +
          'registration rejects a task that disagrees with <category>:<name>'
      );
    }
    if (!Array.isArray(method.inputs) || method.inputs.length === 0) {
      problems.push(
        `${rel}: ${task} declares no inputs. The runtime enforces the declaration ` +
          'before the handler runs, so a scaffold with none teaches the author to ' +
          'hand-check payloads instead of declaring them'
      );
    }
  }
}

for (const dir of FEATURE_TEMPLATES) {
  const file = manifestPath(dir);
  const manifest = read(file);
  if (!manifest) continue;
  const rel = path.relative(root, file);

  if (manifest.image !== `features/${NAME}`) {
    problems.push(
      `${rel}: image is ${JSON.stringify(manifest.image)}, expected "features/${NAME}" — ` +
        'constructive-functions publishes ghcr.io/constructive-io/features/<name>, ' +
        'so anything else names an image nothing builds'
    );
  }
  if (!manifest.requires) {
    problems.push(`${rel}: no "requires" — a capability is reachable only if declared`);
  }
  checkMethods(rel, manifest);

  // A feature owns no schema, so a template may not scaffold a pgpm module.
  // Whatever `fun init` writes, an author copies — and eight features inventing
  // eight `documents` tables is eight schemas nothing in production has.
  for (const owned of ['pgpm.plan', 'Makefile', 'deploy', 'revert', 'verify']) {
    if (fs.existsSync(path.join(root, dir, owned))) {
      problems.push(
        `${dir}/${owned}: a feature owns no schema — statements yes, shape no. ` +
          'Everything a feature reads exists because the platform or a seed put it there'
      );
    }
  }
  if (fs.readdirSync(path.join(root, dir)).some((entry) => entry.endsWith('.control'))) {
    problems.push(`${dir}: a .control file makes this feature a pgpm module, which it may not be`);
  }

  // The index re-exports and names the image, so it can disagree with the
  // manifest — which is exactly how the last drift survived review.
  const index = path.join(root, dir, 'handlers', 'index.ts');
  if (fs.existsSync(index)) {
    const source = fs.readFileSync(index, 'utf-8');
    if (!source.includes(`'features/${NAME}'`)) {
      problems.push(`${path.relative(root, index)}: IMAGE disagrees with the manifest's image`);
    }
  }

  const [lang, surface] = dir.split('/');

  // The image the platform builds for this template is chosen by `type`, so a
  // python template declaring node's would be staged, built and served as node.
  if (manifest.type !== FEATURE_IMAGE_TYPE[lang]) {
    problems.push(
      `${rel}: type is ${JSON.stringify(manifest.type)}, expected ` +
        `${JSON.stringify(FEATURE_IMAGE_TYPE[lang])} for a ${lang} feature — that field ` +
        'chooses the template the image is generated from'
    );
  }

  // A python image imports `handler.py` and discovers its methods from it, and
  // installs `handlers/requirements.txt` — pip's file, in pip's shape.
  if (lang === 'python') {
    for (const required of ['handlers/handler.py', 'handlers/requirements.txt']) {
      if (!fs.existsSync(path.join(root, dir, required))) {
        problems.push(`${dir}: no ${required} — a python image cannot start without it`);
      }
    }
    const handler = path.join(root, dir, 'handlers', 'handler.py');
    if (fs.existsSync(handler)) {
      const source = fs.readFileSync(handler, 'utf-8');
      if (!new RegExp(`^async def ${METHOD}\\(`, 'm').test(source)) {
        problems.push(
          `${dir}/handlers/handler.py: no \`async def ${METHOD}(\` — the image serves the ` +
            'module\'s public coroutines, so the declared method must be one of them'
        );
      }
    }
  }

  // The surface is the whole difference between the two templates: gql has no
  // database, and a scaffold that reached for one would teach the opposite.
  // A *call*, not a mention: both templates explain the surface in prose, and
  // the gql one earns its explanation by naming what it does not have.
  const handlerSources = handlerFiles(path.join(root, dir, 'handlers'));
  const usesDb = handlerSources.some(({ source }) => /(?:await )?ctx\.db\(/.test(source));
  if (surface === 'gql' && usesDb) {
    problems.push(
      `${dir}: a gql feature has no database — it reaches the tenant through its ` +
        'API, and a scaffold using `ctx.db` is the sql surface (`--surface sql`)'
    );
  }
  if (surface === 'sql' && !usesDb) {
    problems.push(
      `${dir}: the sql surface is the one with a database, and nothing here uses ` +
        '`ctx.db` — the scaffold would be a gql feature with a longer name'
    );
  }
}

/** A template's handler sources: what the author reads and copies. */
function handlerFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((entry) => entry.endsWith('.ts') || entry.endsWith('.py'))
    .map((entry) => ({ entry, source: fs.readFileSync(path.join(dir, entry), 'utf-8') }));
}

for (const dir of HANDLER_TEMPLATES) {
  const file = manifestPath(dir);
  const manifest = read(file);
  if (!manifest) continue;
  checkMethods(path.relative(root, file), manifest);
}

if (problems.length > 0) {
  console.error(`${problems.length} template problem(s):\n`);
  for (const problem of problems) console.error(`  • ${problem}`);
  process.exit(1);
}

console.log(`${FEATURE_TEMPLATES.length + HANDLER_TEMPLATES.length} templates match the standard`);
