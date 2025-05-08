import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const res = {};

for (const file of fs.readdirSync(path.join(__dirname, '..', 'dist', 'bsbm', 'cid'), { recursive: true })) {
  if (fs.statSync(path.join(__dirname, '..', 'dist', 'bsbm', 'cid', file)).isDirectory()) {
    continue;
  }
  const content = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'dist', 'bsbm', 'cid', file), 'utf8'));
  res[content.id] = content;
}

fs.writeFileSync(path.join(__dirname, '..', 'dist', 'cids.json'), JSON.stringify(res, null, 2));
