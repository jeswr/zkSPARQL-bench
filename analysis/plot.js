#!/usr/bin/env node
/**
 * plot.js — produce paper §8.3's two figures from a results JSON:
 *   (i)  prove-time bar chart by query, faceted by commitment, coloured by signature
 *   (ii) gate-count heatmap by operator
 *
 * Stub — wire to a plotting backend (vega-lite via `vega-cli`, or
 * a one-shot Python `matplotlib` fork) once we have ≥10 real
 * cells. Today the bootstrap delivers 1 cell, so plotting is
 * out-of-scope for this scaffolding pass.
 *
 * Acceptance behaviour: parses the input JSON, prints what *would*
 * be plotted (which cells / which axes), so analysts can sanity-check
 * the data shape before the real plotter lands.
 */

import { readFileSync } from 'node:fs';

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('usage: plot.js <results.json>');
    process.exit(2);
  }
  const report = JSON.parse(readFileSync(input, 'utf8'));
  const ok = report.rows.filter((r) => r.status === 'ok');
  console.log(`# Plot stub — ${ok.length} runnable rows from ${input}`);
  console.log('# Figure (i): prove-time bar chart');
  for (const r of ok.filter((r) => r.cell.metric === 'prove-time-ms')) {
    console.log(`  ${r.cell.queryClass}/${r.cell.query}\t${r.cell.commitment}\t${r.cell.signature}\t${r.cell.dataset}\t${r.value?.toFixed(1)} ms`);
  }
  console.log('# Figure (ii): gate-count heatmap — pending circuit-gates metric');
}

main();
