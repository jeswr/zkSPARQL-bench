import { Worker } from 'node:worker_threads';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const start = Date.now();

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

// Get all files that need to be processed
const files = fs.readdirSync(path.join(__dirname, './dist/bsbm/data-signed'), { recursive: true })
  .filter(file => file.endsWith('.jsonld'));

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
