import { parseArgs } from 'node:util';
import { randomAwb } from '../shared/awb';
import { fieldKeysOf } from '../shared/layout';
import { hashPassword } from '../shared/password';
import { consignmentNote } from './consignment-note';
import { q, runSql } from './d1';

const { values: args } = parseArgs({
    options: {
        remote: {
            type: 'boolean',
            default: false,
        },
        confirm: {
            type: 'boolean',
            default: false,
        },
        clean: {
            type: 'boolean',
            default: false,
        },
        password: {
            type: 'string',
            default: 'Demo@12345',
        },
        receipts: {
            type: 'string',
            default: '40',
        },
    },
});

// Everything demo is tagged by these codes/prefix, so --clean removes exactly this and nothing real.
const BRANCHES = [
    {
        code: 'DEM1',
        name: 'Demo – Surat',
        city: 'Surat',
        user: 'demo_surat',
        userName: 'Demo Surat Desk',
    },
    {
        code: 'DEM2',
        name: 'Demo – Baroda',
        city: 'Vadodara',
        user: 'demo_baroda',
        userName: 'Demo Baroda Desk',
    },
];
const DEMO_CODES = BRANCHES.map((b) => q(b.code)).join(', ');
const DEMO_USERS = `SELECT id FROM users WHERE username LIKE 'demo\\_%' ESCAPE '\\'`;
const DEMO_BRANCHES = `SELECT id FROM branches WHERE code IN (${DEMO_CODES})`;

const RECEIVERS = [
    'Ketan Bhai',
    'Anita Shah',
    'Ravi Kumar',
    'Meena Iyer',
    'Arjun Mehta',
    'Priya Nair',
];
const CITIES = ['DUBAI', 'LONDON', 'MUMBAI', 'DELHI', 'SINGAPORE', 'TORONTO', 'SYDNEY', 'PUNE'];
const DAY_MS = 86_400_000;

const cleanSql = [
    `DELETE FROM receipts WHERE branch_id IN (${DEMO_BRANCHES}) OR created_by IN (${DEMO_USERS});`,
    `DELETE FROM sessions WHERE user_id IN (${DEMO_USERS});`,
    `DELETE FROM users WHERE id IN (${DEMO_USERS});`,
    // A real user accidentally moved onto a demo branch would otherwise block the branch delete.
    `UPDATE users SET branch_id = NULL WHERE branch_id IN (${DEMO_BRANCHES});`,
    `DELETE FROM branch_templates WHERE branch_id IN (${DEMO_BRANCHES});`,
    `DELETE FROM branches WHERE code IN (${DEMO_CODES});`,
];

// Snapshot built in SQL from the live template and field labels, so demo receipts render like real ones.
const fieldSnapshot = `json((SELECT json_group_array(json_object('key', f.key, 'label', f.label, 'type', f.type))
    FROM field_definitions f WHERE f.key IN (${fieldKeysOf(consignmentNote.layout).map(q).join(', ')})))`;

function receiptSql(i: number, now: number) {
    const branch = BRANCHES[i % BRANCHES.length] ?? BRANCHES[0];
    if (!branch) {
        throw new Error('No demo branches defined');
    }
    const createdAt = now - (i % 14) * DAY_MS - ((i * 104_729) % 36_000_000);
    const data = {
        sender_name: 'EXPRESSOPRO',
        sender_phone: '9876543210',
        receiver_name: RECEIVERS[i % RECEIVERS.length],
        receiver_phone: `98765${10_000 + i}`,
        receiver_address: 'Main Road',
        origin: branch.city.toUpperCase(),
        destination: CITIES[(i * 3) % CITIES.length],
        pieces: 1 + (i % 3),
        payment_mode: i % 5 === 0 ? 'Credit' : 'Paid',
        mot: i % 4 === 0 ? 'SRF' : 'AIR',
        amount: 900 + i * 75,
        customer_code: `C${1000 + i}`,
        weight_kg: 0.5 + (i % 8) * 0.75,
        fasttrack_service: i % 3 === 0 ? 'Yes' : 'No',
    };
    return `INSERT OR IGNORE INTO receipts (awb_number, template_id, layout_snapshot, data, status, created_by, branch_id, created_at)
SELECT ${q(randomAwb(branch.code))}, t.id,
    json_set(t.layout, '$.fields', ${fieldSnapshot}, '$.branch', json_object('code', b.code, 'name', b.name)),
    ${q(JSON.stringify(data))}, 'active', u.id, b.id, ${createdAt}
FROM templates t, branches b, users u
WHERE t.name = ${q(consignmentNote.name)} AND b.code = ${q(branch.code)} AND u.username = ${q(branch.user)};`;
}

async function seedSql() {
    const hash = q(await hashPassword(args.password));
    const now = Date.now();
    return [
        ...BRANCHES.flatMap((b) => [
            `INSERT INTO branches (code, name, city) VALUES (${q(b.code)}, ${q(b.name)}, ${q(b.city)});`,
            `INSERT INTO branch_templates (branch_id, template_id, is_default)
SELECT b.id, t.id, t.name = ${q(consignmentNote.name)} FROM branches b, templates t WHERE b.code = ${q(b.code)};`,
            `INSERT INTO users (name, username, password_hash, role, branch_id)
SELECT ${q(b.userName)}, ${q(b.user)}, ${hash}, 'user', id FROM branches WHERE code = ${q(b.code)};`,
        ]),
        `INSERT INTO users (name, username, password_hash, role) VALUES ('Demo Admin', 'demo_admin', ${hash}, 'admin');`,
        ...Array.from({ length: Number(args.receipts) }, (_, i) => receiptSql(i, now)),
        // Demo receipts are inserted out of date order, so number them per branch by booking time.
        `UPDATE receipts SET receipt_no = n.rn FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY branch_id ORDER BY created_at, id) AS rn
    FROM receipts WHERE branch_id IN (${DEMO_BRANCHES})
) AS n WHERE receipts.id = n.id;`,
    ];
}

if (args.remote && !args.confirm) {
    console.error(
        'Refusing to touch PRODUCTION without --confirm.\n' +
            'Demo receipts look like real bookings; remove them before go-live with the clean command.',
    );
    process.exit(1);
}

// Seeding always cleans first, so re-running resets the demo data instead of piling it up.
runSql(args.clean ? cleanSql : [...cleanSql, ...(await seedSql())], args.remote);

console.log(
    args.clean
        ? '\nDemo data removed.'
        : `\nDemo data ready. Logins (password: ${args.password}): demo_admin, demo_surat, demo_baroda`,
);
