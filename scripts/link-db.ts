import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

// Finds (or creates) the production D1 database named in wrangler.jsonc and writes its id into the
// `DB` binding. `wrangler d1 create` instead appends a second `"remote": true` binding, which leaves
// `DB` on a stale id and points local dev at production; this also removes any such extra entry.
const CONFIG = 'wrangler.jsonc';

interface D1Database {
    uuid: string;
    name: string;
}

const wrangler = (args: string[]) =>
    execFileSync('npx', ['wrangler', ...args], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
    });

const listDatabases = () => JSON.parse(wrangler(['d1', 'list', '--json'])) as D1Database[];

let config = readFileSync(CONFIG, 'utf8');
const name = /"database_name":\s*"([^"]+)"/.exec(config)?.[1];
if (!name) {
    throw new Error(`No database_name found in ${CONFIG}`);
}

let db = listDatabases().find((d) => d.name === name);
if (!db) {
    console.log(`Creating D1 database "${name}"…`);
    wrangler(['d1', 'create', name]);
    db = listDatabases().find((d) => d.name === name);
}
if (!db) {
    throw new Error(`Database "${name}" was not found after creating it`);
}

// Drop any extra binding wrangler appended, then point the single DB binding at the real id.
config = config.replace(/,\s*\{[^{}]*"remote":\s*true[^{}]*\}/g, '');
config = config.replace(/("binding":\s*"DB"[^{}]*?"database_id":\s*")[^"]*(")/, `$1${db.uuid}$2`);
writeFileSync(CONFIG, config);

console.log(`Linked binding DB → ${name} (${db.uuid})`);
console.log('Next: npm run db:migrate:remote, then seed, then npm run deploy.');
