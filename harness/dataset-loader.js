/**
 * Dataset loader — resolves a dataset axis value (`LUBM-1`, `BSBM-1k`,
 * ...) to an in-memory N3.Store ready to be passed to
 * `@jeswr/sparql-noir`'s `sign()`.
 *
 * Strategy:
 *   1. If `dist/<suite>/data-signed/` already exists (post-`npm run build`),
 *      load the credential subjects from there.
 *   2. Otherwise, for `LUBM-1` we ship a tiny seed turtle file at
 *      `datasets/lubm/seed.ttl` so the bootstrap cell is runnable in
 *      CI without the Docker-heavy generator.
 *   3. Anything else returns `{ supported: false }`; the harness emits `n/a`.
 *
 * This deliberately decouples the harness from `build.sh`. Per
 * `feedback_offload_to_ci.md`, heavy dataset generation is a CI /
 * EC2 concern; local + PR CI use the seed.
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

async function importN3() {
  try {
    const mod = await import('n3');
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

async function parseTurtle(path) {
  const N3 = await importN3();
  if (!N3) return null;
  const store = new N3.Store();
  const parser = new N3.Parser();
  const turtle = readFileSync(path, 'utf8');
  return new Promise((resolveP, rejectP) => {
    parser.parse(turtle, (error, quad) => {
      if (error) rejectP(error);
      else if (quad) store.addQuad(quad);
      else resolveP(store);
    });
  });
}

export async function loadDataset(datasetEntry) {
  const { id, suite, scale } = datasetEntry;

  // Prefer the generator output when it exists.
  const distSigned = resolve(REPO_ROOT, 'dist', suite, 'data-signed');
  if (existsSync(distSigned)) {
    // Real generator output — out of scope for the bootstrap cell;
    // we'd iterate the credential JSON-LD files here. Mark `n/a` for
    // now so the harness only consumes the lightweight seed.
    return {
      supported: false,
      reason: `dist/${suite}/data-signed/ present but loader not yet wired (bootstrap-cell scope)`,
    };
  }

  // Bootstrap seed — only wired for LUBM-1.
  if (id === 'LUBM-1') {
    const seed = resolve(REPO_ROOT, 'datasets', 'lubm', 'seed.ttl');
    if (!existsSync(seed)) {
      return { supported: false, reason: `seed file missing: ${seed}` };
    }
    const store = await parseTurtle(seed);
    if (!store) {
      return { supported: false, reason: 'n3 package not installed; run `npm install`' };
    }
    return { supported: true, store, source: seed };
  }

  return {
    supported: false,
    reason: `dataset ${id} (suite=${suite}, scale=${scale}) not loadable without generator output`,
  };
}
