import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'dist', 'lubm', 'cid');

function fixDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Flatten any nested 'http:' folder by moving its files up and removing the folder
      if (e.name === 'http:') {
        const nested = fs.readdirSync(p, { withFileTypes: true });
        for (const n of nested) {
          const from = path.join(p, n.name);
          const to = path.join(dir, n.name.replace(/^http:-+/, '').replace(/^www\./, 'www.'));
          if (fs.existsSync(to)) fs.rmSync(to, { force: true });
          fs.renameSync(from, to);
        }
        fs.rmSync(p, { recursive: true, force: true });
      } else {
        fixDir(p);
      }
    }
  }
}

function run() {
  if (!fs.existsSync(root)) {
    console.error('No dist/lubm/cid directory found.');
    process.exit(1);
  }
  for (const type of fs.readdirSync(root, { withFileTypes: true })) {
    if (!type.isDirectory()) continue;
    fixDir(path.join(root, type.name));
  }
  console.log('Repaired dist/lubm/cid folder structure.');
}

run();
