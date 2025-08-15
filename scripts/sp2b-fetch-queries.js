#!/usr/bin/env node
// Fetch SP2B queries and split into individual .sparql files under sp2b/queries
// Also generate an aggregated all.sparql and an index.json

import fs from 'node:fs';
import path from 'node:path';

const SOURCE_URL = 'https://dbis.informatik.uni-freiburg.de/content/projects/SP2B/docs/sp2b_queries.txt';
const OUT_DIR = path.resolve(process.cwd(), 'sp2b', 'queries');

async function main() {
  console.log(`[sp2b-queries] Fetching ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    console.error(`[sp2b-queries][error] HTTP ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const text = await res.text();

  // Ensure output dir exists
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // Clean existing .sparql files
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith('.sparql')) fs.rmSync(path.join(OUT_DIR, f));
  }

  // Split on delimiter lines like: /////////////////////////////////////// (Q3a)
  const delimRegex = /^\s*\/{10,}\s*\((Q[0-9]+[a-c]?)\)\s*$/m;
  // Find all indices of delimiters
  const matches = [];
  let lastIndex = 0;
  while (true) {
    const m = delimRegex.exec(text.slice(lastIndex));
    if (!m) break;
    const globalIndex = lastIndex + m.index;
    matches.push({ id: m[1], start: globalIndex, length: m[0].length });
    lastIndex = globalIndex + m[0].length;
  }

  if (matches.length === 0) {
    console.error('[sp2b-queries][error] No queries detected in source file.');
    process.exit(1);
  }

  // Extract blocks between delimiters
  const blocks = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const contentStart = cur.start + cur.length; // start after delimiter line
    const contentEnd = next ? next.start : text.length;
    const raw = text.slice(contentStart, contentEnd).trim();
    blocks.push({ id: cur.id, content: raw });
  }

  // Write individual query files
  const index = {};
  const stamp = new Date().toISOString();
  const header = (id) => `# SP2B ${id} from ${SOURCE_URL}\n# Generated ${stamp}\n\n`;
  const cleanSparql = (s) => {
    // Remove C-style block comments, non-greedy across lines
    let out = s.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove full-line // comments (but keep http:// etc. by only matching when // is first non-space)
    out = out
      .split(/\r?\n/)
      .filter((line) => !/^\s*\/\//.test(line))
      .join('\n');
    // Trim trailing spaces and collapse leading/trailing blank lines
    out = out
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+$/g, ''))
      .join('\n')
      .trim();
    return out;
  };

  for (const { id, content } of blocks) {
    const num = id.slice(1); // e.g., '1', '3a'
    const filename = `query${num}.sparql`;
    const outPath = path.join(OUT_DIR, filename);
    const cleaned = cleanSparql(content);
    fs.writeFileSync(outPath, header(id) + cleaned + '\n');
    index[id] = filename;
    console.log(`[sp2b-queries] Wrote ${filename}`);
  }

  // Aggregated file
  const allPath = path.join(OUT_DIR, 'all.sparql');
  const all = blocks
    .map(({ id, content }) => {
      const cleaned = cleanSparql(content);
      return `${header(id)}${cleaned}\n`;
    })
    .join('\n');
  fs.writeFileSync(allPath, all);
  console.log(`[sp2b-queries] Wrote all.sparql`);

  // Index JSON
  const indexPath = path.join(OUT_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`[sp2b-queries] Wrote index.json`);
}

main().catch((e) => {
  console.error('[sp2b-queries][error] Unexpected failure:', e);
  process.exit(1);
});
