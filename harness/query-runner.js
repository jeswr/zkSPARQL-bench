/**
 * query-runner.js — drive `@jeswr/sparql-noir` for one fully-resolved
 * cell of the axial cross-product.
 *
 * Inputs:
 *   - cell: { commitment, signature, queryClass, query, dataset, metric }
 *           where `query.path` is a `.rq` / `.sparql` file and
 *           `dataset` is a `DATASETS` entry from `axes.js`.
 *
 * Output: a result row with provenance + the requested metric, or
 *         `{ status: 'n/a', reason }` when any axis is unsupported.
 *
 * Bootstrap-cell semantics (per the brief):
 *   sorted-leaf-merkle × ed25519 × bgp × LUBM-1 × prove-time-ms
 * is the one combination guaranteed to produce a real number end-to-end.
 * Everything else either returns `n/a` or runs only on environments
 * where the generator output is present.
 */

import { readFileSync } from 'node:fs';
import { configureCommitment } from './commitment-driver.js';
import { configureSignature } from './signature-driver.js';
import { loadDataset } from './dataset-loader.js';
import { timeAsync, proofSizeBytes, circuitGates } from './metrics.js';
import { provenance } from './fingerprint.js';

/**
 * Lazy-import sparql_noir so the harness can be imported even when
 * the package isn't installed (e.g. CI matrix where we're only
 * enumerating the cross-product, not running cells).
 */
async function importSparqlNoir() {
  try {
    return await import('@jeswr/sparql-noir');
  } catch (e) {
    return null;
  }
}

/**
 * Run a single cell. Always returns a row; never throws.
 */
export async function runCell(cell) {
  const baseRow = {
    cell: {
      commitment: cell.commitment.id,
      signature: cell.signature.id,
      queryClass: cell.queryClass.id,
      query: cell.query.id,
      dataset: cell.dataset.id,
      metric: cell.metric.id,
    },
    provenance: provenance({ queryPath: cell.query.path }),
  };

  // 1. Resolve commitment + signature config.
  const com = configureCommitment(cell.commitment.id);
  if (!com.supported) return { ...baseRow, status: 'n/a', reason: com.reason };

  const sig = configureSignature(cell.signature.id);
  if (!sig.supported) return { ...baseRow, status: 'n/a', reason: sig.reason };

  if (!cell.queryClass.supported) {
    return { ...baseRow, status: 'n/a', reason: cell.queryClass.note ?? 'query-class not wired' };
  }

  if (!cell.metric.supported) {
    return { ...baseRow, status: 'n/a', reason: cell.metric.note ?? 'metric not collectable' };
  }

  // 2. Load dataset.
  const ds = await loadDataset(cell.dataset);
  if (!ds.supported) return { ...baseRow, status: 'n/a', reason: ds.reason };

  // 3. Import sparql_noir.
  const sparqlNoir = await importSparqlNoir();
  if (!sparqlNoir) {
    return {
      ...baseRow,
      status: 'n/a',
      reason: '@jeswr/sparql-noir not installed; run `npm install` in paper/sources/zkSPARQL-bench',
    };
  }

  const config = { ...sparqlNoir.defaultConfig, ...sig.configOverrides, ...com.configOverrides };
  const queryText = readFileSync(cell.query.path, 'utf8');

  // 4. Sign.
  let signed;
  try {
    const signResult = await timeAsync(() => sparqlNoir.sign(ds.store, config));
    signed = signResult.result;
    baseRow.signMs = signResult.elapsedMs;
  } catch (e) {
    return { ...baseRow, status: 'error', phase: 'sign', error: e?.message ?? String(e) };
  }

  // 5. Prove.
  let proveResult, proveMs;
  try {
    const proved = await timeAsync(() => sparqlNoir.prove(queryText, signed, config));
    proveResult = proved.result;
    proveMs = proved.elapsedMs;
  } catch (e) {
    return { ...baseRow, status: 'error', phase: 'prove', error: e?.message ?? String(e) };
  }

  // 6. Verify.
  let verifyResult, verifyMs;
  try {
    const verified = await timeAsync(() => sparqlNoir.verify(proveResult, config));
    verifyResult = verified.result;
    verifyMs = verified.elapsedMs;
  } catch (e) {
    return { ...baseRow, status: 'error', phase: 'verify', error: e?.message ?? String(e), proveMs };
  }

  // 7. Pick the requested metric.
  let value = null;
  switch (cell.metric.id) {
    case 'prove-time-ms':  value = proveMs; break;
    case 'verify-time-ms': value = verifyMs; break;
    case 'proof-size-b':   value = proofSizeBytes(proveResult); break;
    case 'circuit-gates':  value = circuitGates(); break;
  }

  return {
    ...baseRow,
    status: 'ok',
    value,
    auxiliary: {
      proveMs,
      verifyMs,
      proofSizeB: proofSizeBytes(proveResult),
      verified: verifyResult.success,
      proofs: proveResult.proofs?.length ?? 0,
    },
  };
}
