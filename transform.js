import { rdfDereferencer } from 'rdf-dereference';
import { StreamWriter } from 'n3';
import fs from 'node:fs';
import context from './context.json' with { type: 'json' };
import { union, fromArray } from 'asynciterator';

const files = fs.readdirSync('./dist/bsbm/data-signed/', { recursive: true })
  .filter(file => file.endsWith('.jsonld'))
  .map(file => `./dist/bsbm/data-signed/${file}`);

// Create a write stream for the output file
const outputStream = fs.createWriteStream('./output.nq');
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

const it = union(fromArray(files).map(async (file) => {
  const dereferenced = await rdfDereferencer.dereference(file, {
    fetch,
    localFiles: true,
    data
  });
  return dereferenced.data;
}));

writer.import(it);
