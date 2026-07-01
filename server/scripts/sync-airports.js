import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetDir = path.resolve(__dirname, '../src/data');
const targetFile = path.join(targetDir, 'airports.csv');
const sourceUrl = 'https://davidmegginson.github.io/ourairports-data/airports.csv';

await mkdir(targetDir, { recursive: true });

await new Promise((resolve, reject) => {
  const file = createWriteStream(targetFile);

  https.get(sourceUrl, (response) => {
    if (response.statusCode !== 200) {
      reject(new Error(`Download fallito con status ${response.statusCode}`));
      return;
    }

    response.pipe(file);
    file.on('finish', () => {
      file.close(resolve);
    });
  }).on('error', reject);
});

console.log(`Catalogo aeroporti salvato in ${targetFile}`);
