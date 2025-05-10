import { parentPort } from 'node:worker_threads';
import { preprocessEd25519Verification, getDocumentLoaderContent } from '@jeswr/vc-cli';
import fs from 'node:fs';
import path from 'node:path';
import cids from './dist/cids.json' with { type: 'json' };
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const documentLoaderContent = getDocumentLoaderContent({
  documentLoaderContent: './dist/documentLoaderContent.json'
});

const exists = {};

async function preprocess(file) {
  try {
    const data = await fs.promises.readFile(path.join(__dirname, './dist/bsbm/data-signed', file), { encoding: 'utf8' });
    const document = JSON.parse(data);
    const cid = cids[document.issuer.id];
    const preprocessedData = await preprocessEd25519Verification({
      document,
      cid,
      documentLoaderContent: await documentLoaderContent
    });
    const dir = path.dirname(file);
    const outPath = path.join(__dirname, './dist/bsbm/data-signed-preprocessed', dir);
    if (!exists[outPath]) {
      if (!fs.existsSync(outPath)) {
        fs.mkdirSync(outPath, { recursive: true });
      }
      exists[outPath] = true;
    }
    await fs.promises.writeFile(
      path.join(__dirname, './dist/bsbm/data-signed-preprocessed', file),
      JSON.stringify(preprocessedData, null, 2)
    );
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
}

parentPort.on('message', async ({ files }) => {
  const promises = files.map(file => preprocess(file));
  await Promise.all(promises);
  parentPort.postMessage('done');
}); 