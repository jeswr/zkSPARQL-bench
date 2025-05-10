import { rdfDereferencer } from 'rdf-dereference';
import { StreamWriter } from 'n3';
import fs from 'node:fs';
import context from './context.json' with { type: 'json' };
import { union, fromArray } from 'asynciterator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url)); 

const start = Date.now();

const files = fs.readdirSync(path.join(__dirname, './dist/bsbm/data-signed-preprocessed'), { recursive: true })
  .filter(file => file.endsWith('.jsonld'))
  .map(file => path.join(__dirname, './dist/bsbm/data-signed-preprocessed', file));

const outFile = path.join(__dirname, './dist/bsbm/data-signed-preprocessed.nq');

if (fs.existsSync(outFile)) {
  fs.unlinkSync(outFile);
}

const outputStream = fs.createWriteStream(outFile);
const writer = new StreamWriter({ format: 'N-Quads' });
writer.pipe(outputStream);

const contextAsString = {};

for (const key in context) {
  contextAsString[key] = JSON.stringify(context[key]);
}

const fetch = (url) => {
  if (url in contextAsString) {
    return new Response(contextAsString[url], {
      headers: {
        'Content-Type': 'application/ld+json',
      },
    });
  }

  throw new Error(`Unknown URL: ${url}`);
};

const it = union(files.map(async (file) => {
  const dereferenced = await rdfDereferencer.dereference(file, {
    fetch,
    localFiles: true,
  });
  return dereferenced.data;
}));

writer.import(it).on('finish', () => {
  console.log(`Done in ${Date.now() - start}ms`);
});
