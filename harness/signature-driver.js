/**
 * Signature-suite driver — maps the harness signature axis to the
 * `config.signature` enum recognised by `@jeswr/sparql-noir`.
 *
 * Per `circuits/sparql_noir/src/config.ts`, the supported set is:
 *   { 'secp256k1', 'secp256r1', 'babyjubjubOpt', 'schnorr' }.
 *
 * `bbs-plus`, `sd-jwt-vc`, `ml-dsa` are paper §4.5 / §7.4 / §7.5
 * future-work and emit `n/a` until the corresponding circuits ship.
 */

import { SIGNATURES } from './axes.js';

export function configureSignature(id) {
  const entry = SIGNATURES.find((s) => s.id === id);
  if (!entry) return { supported: false, reason: `unknown signature id: ${id}` };
  if (!entry.supported || !entry.sparqlNoir) {
    return { supported: false, reason: entry.note ?? 'signature not yet wired' };
  }
  return {
    supported: true,
    configOverrides: { signature: entry.sparqlNoir },
  };
}
