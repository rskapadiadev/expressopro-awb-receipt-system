import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// SQL literal for values we build ourselves (strings escaped, booleans as 0/1).
export const q = (v: string | number | boolean) =>
    typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : String(Number(v));

// Runs statements against the local or production D1 database via wrangler.
export function runSql(statements: string[], remote: boolean) {
    const file = join(mkdtempSync(join(tmpdir(), 'awb-sql-')), 'run.sql');
    writeFileSync(file, statements.join('\n'));
    execFileSync(
        'npx',
        ['wrangler', 'd1', 'execute', 'DB', remote ? '--remote' : '--local', `--file=${file}`],
        { stdio: 'inherit' },
    );
}
