import { eq, type SQL, sql } from 'drizzle-orm';
import type { ReceiptData } from '../../shared/fields';
import { paperKey } from '../../shared/layout';
import { can } from '../../shared/permissions';
import type { Me, Receipt, ReceiptListItem } from '../../shared/types';
import type { Db } from '../db';
import { receipts, templates, users } from '../db/schema';

// Users only ever see their own receipts; admins see everything.
export const scopeFor = (me: Me): SQL | undefined =>
    can(me.role, 'receipts.viewAll') ? undefined : eq(receipts.createdBy, me.id);

// List query skips the large layout snapshot and reads only paper size from it.
export const listQuery = (db: Db) =>
    db
        .select({
            id: receipts.id,
            awbNumber: receipts.awbNumber,
            templateName: templates.name,
            widthMm: sql<number>`json_extract(${receipts.layoutSnapshot}, '$.widthMm')`,
            heightMm: sql<number>`json_extract(${receipts.layoutSnapshot}, '$.heightMm')`,
            branchCode: sql<
                string | null
            >`json_extract(${receipts.layoutSnapshot}, '$.branch.code')`,
            status: receipts.status,
            createdBy: users.name,
            createdAt: receipts.createdAt,
            data: receipts.data,
        })
        .from(receipts)
        .innerJoin(templates, eq(templates.id, receipts.templateId))
        .innerJoin(users, eq(users.id, receipts.createdBy));

type ListRow = Awaited<ReturnType<ReturnType<typeof listQuery>['all']>>[number];

const summarize = (data: ReceiptData) =>
    Object.values(data)
        .filter((v) => typeof v === 'string' && v.trim() !== '')
        .slice(0, 3)
        .join(' · ');

export const toListItem = ({ data, widthMm, heightMm, ...row }: ListRow): ReceiptListItem => ({
    ...row,
    paper: paperKey({
        widthMm,
        heightMm,
    }),
    summary: summarize(typeof data === 'string' ? (JSON.parse(data) as ReceiptData) : data),
});

export const detailQuery = (db: Db) =>
    db
        .select({
            id: receipts.id,
            awbNumber: receipts.awbNumber,
            status: receipts.status,
            createdBy: users.name,
            createdAt: receipts.createdAt,
            layout: receipts.layoutSnapshot,
            data: receipts.data,
        })
        .from(receipts)
        .innerJoin(users, eq(users.id, receipts.createdBy));

export type { Receipt };
