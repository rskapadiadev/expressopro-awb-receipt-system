import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { FieldType, ReceiptData } from '../../shared/fields';
import type { LayoutSnapshot, TemplateGuide, TemplateLayout } from '../../shared/layout';
import type { Role } from '../../shared/permissions';

const createdAt = () =>
    integer('created_at')
        .notNull()
        .default(sql`(unixepoch() * 1000)`);

export const branches = sqliteTable('branches', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    city: text('city').notNull().default(''),
    phone: text('phone').notNull().default(''),
    address: text('address').notNull().default(''),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: createdAt(),
});

export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').$type<Role>().notNull(),
    branchId: integer('branch_id').references(() => branches.id),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    failedLogins: integer('failed_logins').notNull().default(0),
    lockedUntil: integer('locked_until'),
    createdAt: createdAt(),
});

export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: integer('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at').notNull(),
});

export const fieldDefinitions = sqliteTable('field_definitions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    key: text('key').notNull().unique(),
    label: text('label').notNull(),
    type: text('type').$type<FieldType>().notNull(),
    required: integer('required', { mode: 'boolean' }).notNull().default(false),
    options: text('options', { mode: 'json' }).$type<string[]>().notNull().default([]),
    searchable: integer('searchable', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

export const templates = sqliteTable('templates', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    layout: text('layout', { mode: 'json' }).$type<TemplateLayout>().notNull(),
    // Kept out of `layout` so the large image is never copied into receipt snapshots.
    guide: text('guide', { mode: 'json' }).$type<TemplateGuide>(),
    version: integer('version').notNull().default(1),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: createdAt(),
});

// Templates a branch's users can book with; one may be the default.
export const branchTemplates = sqliteTable(
    'branch_templates',
    {
        branchId: integer('branch_id')
            .notNull()
            .references(() => branches.id, { onDelete: 'cascade' }),
        templateId: integer('template_id')
            .notNull()
            .references(() => templates.id, { onDelete: 'cascade' }),
        isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
    },
    (t) => [primaryKey({ columns: [t.branchId, t.templateId] })],
);

export const receipts = sqliteTable(
    'receipts',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        awbNumber: text('awb_number').notNull().unique(),
        templateId: integer('template_id')
            .notNull()
            .references(() => templates.id),
        layoutSnapshot: text('layout_snapshot', { mode: 'json' }).$type<LayoutSnapshot>().notNull(),
        data: text('data', { mode: 'json' }).$type<ReceiptData>().notNull(),
        status: text('status').$type<'active' | 'void'>().notNull().default('active'),
        createdBy: integer('created_by')
            .notNull()
            .references(() => users.id),
        branchId: integer('branch_id').references(() => branches.id),
        createdAt: createdAt(),
    },
    (t) => [
        index('receipts_created_at_idx').on(t.createdAt),
        index('receipts_created_by_idx').on(t.createdBy, t.createdAt),
        index('receipts_branch_idx').on(t.branchId, t.createdAt),
    ],
);

// Running receipt counts kept by SQL triggers (see migration 0006): user_id 0 = everyone.
export const ALL_USERS = 0;
export const receiptTotals = sqliteTable('receipt_totals', {
    userId: integer('user_id').primaryKey(),
    total: integer('total').notNull().default(0),
});
