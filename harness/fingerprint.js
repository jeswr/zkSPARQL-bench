/**
 * Reproducibility fingerprint — every result row carries:
 *   - commit-SHA-of-sparql_noir
 *   - dataset-version (= zkSPARQL-bench commit-SHA when datasets/ lives here)
 *   - query-version (= sha256 of the query file)
 *   - hardware-fingerprint (CPU model + arch + memory)
 *   - date (ISO-8601, UTC)
 *
 * Per the brief: "every result row carries (commit-SHA-of-sparql_noir,
 * dataset-version, query-version, hardware-fingerprint, date). Paper
 * §8 cites a specific commit."
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

function safeGit(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/**
 * Return the commit SHA of the sparql_noir checkout the harness is
 * importing from. Resolved by `import.meta.resolve` then `git rev-parse`.
 */
export function sparqlNoirCommit() {
  // Best-effort: walk up from the require-resolved path until we find a .git.
  // Falls back to the `version` from the package's package.json.
  try {
    const pkgPath = require.resolve?.('@jeswr/sparql-noir/package.json');
    if (pkgPath) {
      const pkgDir = dirname(pkgPath);
      const sha = safeGit('git rev-parse HEAD', pkgDir);
      if (sha) return sha;
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      return `v${pkg.version}`;
    }
  } catch { /* ignore */ }
  // Workspace layout — sparql_noir is a sibling sub-repo.
  const candidate = resolve(REPO_ROOT, '../../../circuits/sparql_noir');
  const sha = safeGit('git rev-parse HEAD', candidate);
  if (sha) return sha;
  return 'unknown';
}

/**
 * Repo-local commit SHA — uniquely identifies the dataset / query
 * snapshot.
 */
export function benchRepoCommit() {
  return safeGit('git rev-parse HEAD', REPO_ROOT) ?? 'unknown';
}

/**
 * SHA-256 of a query file's contents — uniquely identifies the
 * query version irrespective of file relocation.
 */
export function queryVersion(queryPath) {
  try {
    return createHash('sha256').update(readFileSync(queryPath)).digest('hex').slice(0, 16);
  } catch {
    return 'unknown';
  }
}

/**
 * Hardware fingerprint — CPU model, architecture, total memory (GB),
 * and platform. Identifies whether numbers came from M1 / Linux x86_64
 * GitHub runner / EC2 c7i.2xlarge.
 */
export function hardwareFingerprint() {
  const cpus = os.cpus();
  return {
    cpuModel: cpus[0]?.model ?? 'unknown',
    cpuCount: cpus.length,
    arch: os.arch(),
    platform: os.platform(),
    totalMemoryGb: Math.round(os.totalmem() / 1024 / 1024 / 1024),
    nodeVersion: process.version,
  };
}

export function isoNow() {
  return new Date().toISOString();
}

/**
 * Build the full provenance block stamped on every result row.
 */
export function provenance({ queryPath } = {}) {
  return {
    sparqlNoirCommit: sparqlNoirCommit(),
    benchRepoCommit: benchRepoCommit(),
    queryVersion: queryPath ? queryVersion(queryPath) : null,
    hardware: hardwareFingerprint(),
    date: isoNow(),
  };
}
