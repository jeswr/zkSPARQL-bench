/**
 * Discover all `.rq` / `.sparql` files under `queries/<class>/` and
 * group them by class. Each entry is `{ id, path }` where `id` is
 * the basename without extension.
 */

import { readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUERY_CLASSES } from './axes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUERIES_ROOT = resolve(__dirname, '..', 'queries');

export function discoverQueries() {
  const out = {};
  for (const cls of QUERY_CLASSES) {
    const dir = join(QUERIES_ROOT, cls.folder);
    let files = [];
    try {
      files = readdirSync(dir).filter((f) => f.endsWith('.rq') || f.endsWith('.sparql'));
    } catch {
      files = [];
    }
    out[cls.id] = files.map((f) => ({
      id: f.replace(/\.(rq|sparql)$/, ''),
      path: join(dir, f),
    }));
  }
  return out;
}
