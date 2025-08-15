import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const res = {};

function collect(dir) {
  const base = path.join(__dirname, '..', 'dist', dir, 'cid');
  if (!fs.existsSync(base)) return;
  for (const file of fs.readdirSync(base, { recursive: true })) {
    const p = path.join(base, file);
    if (fs.statSync(p).isDirectory()) continue;
    const content = JSON.parse(fs.readFileSync(p, 'utf8'));
    res[content.id] = content;
  }
}

collect('bsbm');
collect('lubm');
collect('sp2b');

fs.writeFileSync(path.join(__dirname, '..', 'dist', 'cids.json'), JSON.stringify(res, null, 2));
