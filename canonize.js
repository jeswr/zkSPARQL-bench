import { preprocessEd25519Verification, getDocumentLoaderContent } from '@jeswr/vc-cli';
import fs from 'node:fs';
import path from 'node:path';
import cids from './dist/cids.json' with { type: 'json' };
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const start = Date.now();

const files = fs.readdirSync(path.join(__dirname, './dist/bsbm/data-signed'), { recursive: true });
const documentLoaderContent = await getDocumentLoaderContent({
  documentLoaderContent: './dist/documentLoaderContent.json'
});

const errFn = (err) => {
  if (err) {
    console.error(err);
  }
}

for (const file of files) {
  if (file.endsWith('.jsonld')) {
    fs.readFile(path.join(__dirname, './dist/bsbm/data-signed', file), { encoding: 'utf8' }, async (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      const document = JSON.parse(data);
      const cid = cids[document.issuer.id];
      const preprocessedData = await preprocessEd25519Verification({
        document,
        cid,
        documentLoaderContent
      });
      const dir = path.dirname(file);
      const outPath = path.join(__dirname, './dist/bsbm/data-signed-preprocessed', dir);
      if (!fs.existsSync(outPath)) {
        fs.mkdirSync(outPath, { recursive: true });
      }
      fs.writeFile(path.join(__dirname, './dist/bsbm/data-signed-preprocessed', file), JSON.stringify(preprocessedData, null, 2), errFn);
    });
  }
}

process.on('exit', () => {
  console.log(`Done in ${Date.now() - start}ms`);
});
