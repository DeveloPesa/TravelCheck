import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
const dbPath = path.join(dataDir, 'travelcheck.json');

const initialData = {
  users: [],
  trips: []
};

export async function readDb() {
  await mkdir(dataDir, { recursive: true });

  try {
    const raw = await readFile(dbPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }

    await writeDb(initialData);
    return structuredClone(initialData);
  }
}

export async function writeDb(data) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dbPath, JSON.stringify(data, null, 2));
}
