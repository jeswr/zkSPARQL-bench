/**
 * Metric collection helpers — measure prove-time, verify-time,
 * proof-size, and (eventually) circuit-gate counts from a
 * sparql_noir prove/verify cycle.
 *
 * Per `feedback_paper_focus_over_completeness.md` we only collect
 * metrics the paper §8.3 actually cites. Anything richer goes into
 * `results/` raw JSON and is dropped by the analysis pass.
 */

import { performance } from 'node:perf_hooks';

/**
 * Wall-clock a synchronous function. Returns `{ result, elapsedMs }`.
 */
export function timeSync(fn) {
  const t0 = performance.now();
  const result = fn();
  const elapsedMs = performance.now() - t0;
  return { result, elapsedMs };
}

/**
 * Wall-clock an async function. Returns `{ result, elapsedMs }`.
 */
export async function timeAsync(fn) {
  const t0 = performance.now();
  const result = await fn();
  const elapsedMs = performance.now() - t0;
  return { result, elapsedMs };
}

/**
 * Sum the proof byte-size across every proof in a sparql_noir
 * `ProveResult`.
 */
export function proofSizeBytes(proveResult) {
  if (!proveResult || !Array.isArray(proveResult.proofs)) return null;
  let total = 0;
  for (const p of proveResult.proofs) {
    const buf = p.proof instanceof Uint8Array ? p.proof : new Uint8Array(p.proof ?? []);
    total += buf.byteLength;
  }
  return total;
}

/**
 * Stretch — return circuit gate-count if accessible. UltraHonk does
 * not expose this directly through `@aztec/bb.js`; flag and let the
 * caller record `n/a` until a `gate_count` introspection lands.
 */
export function circuitGates(/* compiledCircuit */) {
  return null;
}
