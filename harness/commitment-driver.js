/**
 * Commitment-shape driver — swaps the commitment scheme that
 * `@jeswr/sparql-noir` uses to bind the dataset before signing.
 *
 * `sparql_noir` currently ships sorted-leaf Merkle (`processQuadsForMerkle`).
 * The prefix-tree shape (paper §4.3 round-4) is not yet wired; this
 * driver returns `{ supported: false }` for that axis value so the
 * harness can emit `n/a`.
 *
 * Update this file the moment a new commitment shape lands in
 * `circuits/sparql_noir/src/scripts/sign.ts` — add a branch on `id`
 * that supplies the appropriate config / extra setup.
 */

export function configureCommitment(id) {
  switch (id) {
    case 'sorted-leaf-merkle':
      // Default sparql_noir behaviour — no overrides needed.
      return { supported: true, configOverrides: {} };
    case 'prefix-tree':
      return {
        supported: false,
        reason: 'prefix-tree commitment not yet shipped (paper §4.3 round-4 pending)',
      };
    default:
      return { supported: false, reason: `unknown commitment id: ${id}` };
  }
}
