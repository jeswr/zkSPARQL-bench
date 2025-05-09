import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cids = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'dist', 'cids.json'), 'utf8'));
const contexts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'dist', 'context.json'), 'utf8'));

fs.writeFileSync(path.join(__dirname, '..', 'dist', 'documentLoaderContent.json'), JSON.stringify({
  ...cids,
  ...contexts,
}, null, 2));
