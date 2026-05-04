/**
 * Axes definitions for the zkSPARQL-bench cross-product.
 *
 * Each axis lists every value the paper §8.3 table contemplates,
 * even if the corresponding circuit / commitment shape has not yet
 * shipped in `circuits/sparql_noir`. The harness enumerates the
 * full cross-product; unsupported cells emit `n/a` rather than
 * crashing (per brief — "harness should enumerate the full
 * cross-product but mark unsupported cells `n/a`").
 *
 * `supported` reflects what is wired against `@jeswr/sparql-noir`
 * today. Update this file as new commitment shapes / signature
 * suites land in `circuits/sparql_noir/src/config.ts`.
 */

// Commitment-shape axis (paper §4.3 + §8.3 Q4 framing).
export const COMMITMENTS = [
  { id: 'sorted-leaf-merkle', supported: true,  note: 'default; Merkle over canonicalised + sorted N-Quads' },
  { id: 'prefix-tree',        supported: false, note: 'paper §4.3 round-4 — not yet shipped in sparql_noir' },
];

// Signature-suite axis (paper §4.5 + §7.4).
// Maps `id` -> the sparql_noir `config.signature` value where one exists.
export const SIGNATURES = [
  { id: 'ed25519',     sparqlNoir: 'babyjubjubOpt', supported: true,  note: 'modelled via babyjubjubOpt (Edwards curve over BN254)' },
  { id: 'schnorr',     sparqlNoir: 'schnorr',       supported: true,  note: 'native Noir schnorr stdlib' },
  { id: 'ecdsa-p256',  sparqlNoir: 'secp256r1',     supported: true,  note: 'secp256r1 ECDSA' },
  { id: 'ecdsa-k1',    sparqlNoir: 'secp256k1',     supported: true,  note: 'secp256k1 ECDSA' },
  { id: 'bbs-plus',    sparqlNoir: null,            supported: false, note: 'paper §4.5 via Braun — not yet shipped' },
  { id: 'sd-jwt-vc',   sparqlNoir: null,            supported: false, note: 'paper §7.4 stretch — not yet shipped' },
  { id: 'ml-dsa',      sparqlNoir: null,            supported: false, note: 'paper §7.5 PQ stretch — not yet shipped' },
];

// Query-class axis (paper §8.3 query column).
// Each class maps to a folder under `queries/<class>/`.
export const QUERY_CLASSES = [
  { id: 'bgp',        folder: 'bgp',        supported: true  },
  { id: 'filter',     folder: 'filter',     supported: true  },
  { id: 'optional',   folder: 'optional',   supported: false, note: 'OPTIONAL collapse — sparql_noir round-3 partial / round-4 single-circuit pending' },
  { id: 'aggregate',  folder: 'aggregate',  supported: false, note: 'verifier-side post-processing pattern; in-circuit not in scope' },
  { id: 'path',       folder: 'path',       supported: false, note: 'property paths — not yet shipped' },
  { id: 'exists',     folder: 'exists',     supported: false, note: 'EXISTS — sparql_noir round-3 partial' },
  { id: 'not-exists', folder: 'not-exists', supported: false, note: 'NOT EXISTS — sparql_noir round-3 partial' },
  { id: 'minus',      folder: 'minus',      supported: false, note: 'MINUS — sparql_noir round-3 partial' },
];

// Dataset-size axis (paper §8.3 dataset column).
export const DATASETS = [
  { id: 'LUBM-1',    suite: 'lubm', scale: 1,    supported: true,  note: 'LUBM(1,0) — canonical small instance' },
  { id: 'LUBM-10',   suite: 'lubm', scale: 10,   supported: false, note: 'requires LUBM generator + dist/ build via build.sh' },
  { id: 'BSBM-1k',   suite: 'bsbm', scale: 1000, supported: false, note: 'requires BSBM generator + Docker' },
  { id: 'BSBM-10k',  suite: 'bsbm', scale: 10000,  supported: false, note: 'EC2 / heavy-CI only' },
  { id: 'BSBM-100k', suite: 'bsbm', scale: 100000, supported: false, note: 'EC2 / heavy-CI only — `decisions/aws-credentials-setup.md` Step 6' },
];

// Metric axis (paper §8.3 metric column).
export const METRICS = [
  { id: 'prove-time-ms',  unit: 'ms',    supported: true  },
  { id: 'verify-time-ms', unit: 'ms',    supported: true  },
  { id: 'proof-size-b',   unit: 'bytes', supported: true  },
  { id: 'circuit-gates',  unit: 'gates', supported: false, note: 'requires gate-count introspection from UltraHonk backend' },
];

/**
 * Generate every cell of the axial cross-product.
 *
 * Yields `{ commitment, signature, queryClass, query, dataset, metric }`
 * objects. The caller decides whether each cell is runnable based on
 * the `.supported` flags.
 */
export function* enumerate({ queryFiles }) {
  for (const commitment of COMMITMENTS)
    for (const signature of SIGNATURES)
      for (const queryClass of QUERY_CLASSES)
        for (const query of queryFiles[queryClass.id] ?? [])
          for (const dataset of DATASETS)
            for (const metric of METRICS)
              yield { commitment, signature, queryClass, query, dataset, metric };
}

/**
 * A cell is runnable iff every axis value is supported.
 */
export function isRunnable(cell) {
  return cell.commitment.supported
      && cell.signature.supported
      && cell.queryClass.supported
      && cell.dataset.supported
      && cell.metric.supported;
}
