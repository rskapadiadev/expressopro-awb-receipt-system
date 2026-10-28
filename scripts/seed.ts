import { parseArgs } from 'node:util';
import type { FieldType } from '../shared/fields';
import { hashPassword, randomToken } from '../shared/password';
import { consignmentNote } from './consignment-note';
import { q, runSql } from './d1';
import { standardA5 } from './standard-a5';

const { values: args } = parseArgs({
    options: {
        remote: {
            type: 'boolean',
            default: false,
        },
        username: {
            type: 'string',
            default: 'superadmin',
        },
        password: { type: 'string' },
        name: {
            type: 'string',
            default: 'Super Admin',
        },
        // Overwrites the seeded templates with the versions in scripts/ (drops edits and tracing guides).
        'reset-templates': {
            type: 'boolean',
            default: false,
        },
    },
});

const fields: [
    key: string,
    label: string,
    type: FieldType,
    required: boolean,
    searchable: boolean,
    options?: string[],
][] = [
    ['sender_name', 'Sender Name', 'text', true, true],
    ['sender_phone', 'Sender Phone', 'phone', true, true],
    ['sender_address', 'Sender Address', 'textarea', false, false],
    ['receiver_name', 'Receiver Name', 'text', true, true],
    ['receiver_phone', 'Receiver Phone', 'phone', true, true],
    ['receiver_address', 'Receiver Address', 'textarea', true, false],
    ['origin', 'Origin', 'text', false, false],
    ['destination', 'Destination', 'text', true, false],
    ['pieces', 'Pieces', 'number', true, false],
    ['weight_kg', 'Weight (kg)', 'number', false, false],
    ['payment_mode', 'Payment Mode', 'select', true, false, ['Paid', 'To Pay', 'Credit']],
    ['description', 'Description', 'textarea', false, false],
    ['customer_code', 'Customer Code', 'text', false, true],
    ['mot', 'Mode of Transport', 'select', true, false, ['AIR', 'SRF']],
    ['amount', 'Amount', 'number', false, false],
    ['remarks', 'Remarks', 'text', false, false],
    ['fasttrack_service', 'Fast Track Service', 'select', false, false, ['Yes', 'No']],
];

const password = args.password ?? randomToken().slice(0, 14);
const sql = [
    `INSERT OR IGNORE INTO users (name, username, password_hash, role) VALUES (${q(args.name)}, ${q(args.username.toLowerCase())}, ${q(await hashPassword(password))}, 'super_admin');`,
    ...fields.map(
        ([key, label, type, required, searchable, options = []], i) =>
            `INSERT OR IGNORE INTO field_definitions (key, label, type, required, searchable, options, sort_order) VALUES (${q(key)}, ${q(label)}, ${q(type)}, ${q(required)}, ${q(searchable)}, ${q(JSON.stringify(options))}, ${i * 10});`,
    ),
    `INSERT INTO templates (name, layout) SELECT ${q(standardA5.name)}, ${q(JSON.stringify(standardA5.layout))} WHERE NOT EXISTS (SELECT 1 FROM templates);`,
    `INSERT INTO templates (name, layout) SELECT ${q(consignmentNote.name)}, ${q(JSON.stringify(consignmentNote.layout))} WHERE NOT EXISTS (SELECT 1 FROM templates WHERE name = ${q(consignmentNote.name)});`,
    // Receipts keep their own layout snapshot, so resetting a template never changes old prints.
    ...(args['reset-templates']
        ? [standardA5, consignmentNote].map(
              (t) =>
                  `UPDATE templates SET layout = ${q(JSON.stringify(t.layout))}, guide = NULL, version = version + 1 WHERE name = ${q(t.name)};`,
          )
        : []),
    `INSERT OR IGNORE INTO branches (code, name, city) VALUES ('SURT', 'Surat Head Office', 'Surat');`,
    // The sample branch gets every template, with the consignment note as its default.
    `INSERT OR IGNORE INTO branch_templates (branch_id, template_id, is_default) SELECT b.id, t.id, t.name = ${q(consignmentNote.name)} FROM branches b, templates t WHERE b.code = 'SURT';`,
];

runSql(sql, args.remote);
console.log(`\nSuper Admin: ${args.username} / ${password} (ignored if this user already existed)`);
