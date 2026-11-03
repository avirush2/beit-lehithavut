// גיבוי של כל האוספים הציבוריים לקובץ JSON בתיקייה backups (לא עולה ל-GitHub).
// הרצה: node scripts/backup.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'https://firestore.googleapis.com/v1/projects/chazon-9fc00/databases/(default)/documents';
const COLLECTIONS = [
  'meta', 'users', 'content', 'compass', 'categories', 'cards', 'readings', 'harvests', 'settings',
  'definitionVersions', 'definitionProposals', 'journal', 'dreams', 'ideas', 'pain', 'voices',
  'comments', 'resonances', 'studyCircles',
];

const out = {};
for (const col of COLLECTIONS) {
  out[col] = [];
  let token = '';
  do {
    const res = await fetch(`${BASE}/${col}?pageSize=300${token ? `&pageToken=${token}` : ''}`);
    const json = await res.json();
    if (json.error) throw new Error(`${col}: ${json.error.message}`);
    out[col].push(...(json.documents || []));
    token = json.nextPageToken || '';
  } while (token);
}

mkdirSync('backups', { recursive: true });
const file = `backups/firestore-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
writeFileSync(file, JSON.stringify(out, null, 1));
console.log(file, Object.entries(out).map(([k, v]) => `${k}:${v.length}`).join(' '));
