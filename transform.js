import { rdfDereferencer } from 'rdf-dereference';
import { StreamWriter } from 'n3';
import fs from 'node:fs';
import context from './context.json' with { type: 'json' };
import { union, fromArray } from 'asynciterator';

const start = Date.now();

function listSignedFiles(dataset) {
  const root = `./dist/${dataset}/data-signed/`;
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { recursive: true })
    .filter(file => file.endsWith('.jsonld'))
    .map(file => `${root}${file}`);
}

const bsbmFiles = listSignedFiles('bsbm');
const lubmFiles = listSignedFiles('lubm');

// Create a write stream for the output file
const outputs = [
  { files: bsbmFiles, out: './output-bsbm.nq' },
  { files: lubmFiles, out: './output-lubm.nq' },
].filter(x => x.files.length > 0);

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

await Promise.all(outputs.map(async ({ files, out }) => {
  const outputStream = fs.createWriteStream(out);
  const writer = new StreamWriter({ format: 'N-Quads' });
  writer.pipe(outputStream);
  const it = union(fromArray(files).map(async (file) => {
    const dereferenced = await rdfDereferencer.dereference(file, {
      fetch,
      localFiles: true,
    });
    return dereferenced.data;
  }));
  writer.import(it);
}));

process.on('exit', () => {
  console.log(`Done in ${Date.now() - start}ms`);
});
