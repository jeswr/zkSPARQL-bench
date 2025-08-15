import { Worker } from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const start = Date.now();

// Collect files from both datasets if present
async function collectDatasetFiles(dataset) {
  const dir = path.join(__dirname, `./dist/${dataset}/data-signed`);
  if (!fs.existsSync(dir)) return [];
  const files = await fs.promises.readdir(dir, { recursive: true });
  return files
    .filter(f => f.endsWith('.jsonld'))
    .map(f => `${dataset}/data-signed/${f}`);
}

const filesPromise = (async () => {
  const [bsbm, lubm] = await Promise.all([
    collectDatasetFiles('bsbm'),
    collectDatasetFiles('lubm'),
  ]);
  return [...bsbm, ...lubm];
})();

// Determine number of workers based on CPU cores
// Use number of CPU cores minus 1 to leave one core for system processes
const numWorkers = Math.max(1, Math.min(os.cpus().length - 1, 4));

// Create and initialize workers first
const workers = [];
let completedWorkers = 0;

for (let i = 0; i < numWorkers; i++) {
  const worker = new Worker('./worker.js');
  
  worker.on('message', (message) => {
    if (message === 'done') {
      completedWorkers++;
      if (completedWorkers === numWorkers) {
        console.log(`Done in ${Date.now() - start}ms`);
        process.exit(0);
      }
    }
  });

  worker.on('error', (err) => {
    console.error(`Worker ${i} error:`, err);
  });

  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Worker ${i} exited with code ${code}`);
    }
  });

  workers.push(worker);
}

// Ensure output roots exist if datasets present
for (const dataset of ['bsbm', 'lubm']) {
  const dir = path.join(__dirname, `./dist/${dataset}/data-signed-preprocessed`);
  if (fs.existsSync(path.join(__dirname, `./dist/${dataset}`)) && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const files = await filesPromise;

// Distribute files among workers by slicing the array
const chunkSize = Math.ceil(files.length / numWorkers);
const workerFiles = Array.from({ length: numWorkers }, (_, i) => 
  files.slice(i * chunkSize, (i + 1) * chunkSize)
);

// Send files to workers
workers.forEach((worker, i) => {
  worker.postMessage({
    files: workerFiles[i]
  });
});

process.on('exit', () => {
  console.log(`Done in ${Date.now() - start}ms`);
});
