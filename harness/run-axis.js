#!/usr/bin/env node
/**
 * run-axis.js — run one (or many) cells of the axial cross-product.
 *
 * Usage:
 *   node harness/run-axis.js                                    # full enumeration; runnable cells executed
 *   node harness/run-axis.js --bootstrap                        # bootstrap cell only
 *   node harness/run-axis.js --filter commitment=sorted-leaf-merkle,signature=ed25519
 *   node harness/run-axis.js --enumerate-only                   # print the cross-product, run nothing
 *   node harness/run-axis.js --out results/<file>.json
 *
 * The bootstrap cell is:
 *   sorted-leaf-merkle × ed25519 × bgp/lubm-q1 × LUBM-1 × prove-time-ms
 * Per the brief — the simplest combination that produces a real number.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { enumerate, isRunnable } from './axes.js';
import { discoverQueries } from './discover-queries.js';
import { runCell } from './query-runner.js';
import { provenance } from './fingerprint.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { bootstrap: false, enumerateOnly: false, filter: {}, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--bootstrap') args.bootstrap = true;
    else if (a === '--enumerate-only') args.enumerateOnly = true;
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--filter') {
      for (const pair of argv[++i].split(',')) {
        const [k, v] = pair.split('=');
        args.filter[k] = v;
      }
    } else if (a === '--help' || a === '-h') {
      console.log(readFileSync(__filename, 'utf8').split('\n').slice(2, 16).join('\n'));
      process.exit(0);
    }
  }
  return args;
}

function matchesFilter(cell, filter) {
  for (const [k, v] of Object.entries(filter)) {
    const got = cell[k]?.id ?? cell[k];
    if (got !== v) return false;
  }
  return true;
}

function isBootstrapCell(cell) {
  return cell.commitment.id === 'sorted-leaf-merkle'
      && cell.signature.id === 'ed25519'
      && cell.queryClass.id === 'bgp'
      && cell.query.id === 'lubm-q1'
      && cell.dataset.id === 'LUBM-1'
      && cell.metric.id === 'prove-time-ms';
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const queryFiles = discoverQueries();

  const cells = [...enumerate({ queryFiles })];
  console.error(`[zkSPARQL-bench] enumerated ${cells.length} cells of the axial cross-product`);

  const targets = cells.filter((c) => {
    if (args.bootstrap) return isBootstrapCell(c);
    if (Object.keys(args.filter).length > 0) return matchesFilter(c, args.filter);
    return true;
  });

  console.error(`[zkSPARQL-bench] targeting ${targets.length} cells (runnable: ${targets.filter(isRunnable).length})`);

  if (args.enumerateOnly) {
    for (const c of targets) {
      console.log(JSON.stringify({
        commitment: c.commitment.id,
        signature: c.signature.id,
        queryClass: c.queryClass.id,
        query: c.query.id,
        dataset: c.dataset.id,
        metric: c.metric.id,
        runnable: isRunnable(c),
      }));
    }
    return;
  }

  const rows = [];
  let okCount = 0;
  let naCount = 0;
  let errCount = 0;
  for (const cell of targets) {
    const row = await runCell(cell);
    rows.push(row);
    if (row.status === 'ok') okCount++;
    else if (row.status === 'n/a') naCount++;
    else errCount++;
  }

  console.error(`[zkSPARQL-bench] ok=${okCount} n/a=${naCount} error=${errCount}`);

  const report = {
    schema: 'zkSPARQL-bench-results-v1',
    provenance: provenance(),
    summary: { total: rows.length, ok: okCount, naCount, errCount },
    rows,
  };

  if (args.out) {
    const outPath = resolve(REPO_ROOT, args.out);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.error(`[zkSPARQL-bench] wrote ${outPath}`);
  } else {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  }
}

main().catch((e) => {
  console.error('[zkSPARQL-bench] fatal:', e);
  process.exit(1);
});
