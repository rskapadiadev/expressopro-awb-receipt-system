import { and, count, desc, eq, gte, inArray, lt, or, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { buildDataSchema } from '../../shared/fields';
import type { LayoutSnapshot } from '../../shared/layout';
import {
    idsSchema,
    PAGE_SIZE,
    receiptCreateSchema,
    receiptQuerySchema,
} from '../../shared/schemas';
import type { Page, Receipt, ReceiptListItem } from '../../shared/types';
import type { Db } from '../db';
import { branches, fieldDefinitions, receipts } from '../db/schema';
import type { AppEnv } from '../env';
import { withUniqueAwb } from '../lib/awb';
import { body, fail, paramId, parse } from '../lib/http';
import { detailQuery, listQuery, scopeFor, toListItem } from '../lib/receipts';
import { fieldsForTemplate, getUsableTemplate } from '../lib/templates';
import { istDayEnd, istDayStart } from '../lib/time';
import { requirePermission } from '../middleware/auth';

// Matches the AWB number or any field the Super Admin marked as searchable.
const searchCondition = (q: string) => {
    const like = `%${q}%`;
    return or(
        sql`${receipts.awbNumber} LIKE ${like}`,
        sql`EXISTS (SELECT 1 FROM ${fieldDefinitions} WHERE ${fieldDefinitions.searchable} = 1
            AND json_extract(${receipts.data}, '$.' || ${fieldDefinitions.key}) LIKE ${like})`,
    );
};

// Users book under their own branch; admins without one choose a branch per receipt.
async function bookingBranch(db: Db, branchId: number | null | undefined) {
    if (!branchId) {
        return fail(400, 'Select a branch for this receipt');
    }
    const [branch] = await db
        .select({
            id: branches.id,
            code: branches.code,
            name: branches.name,
        })
        .from(branches)
        .where(and(eq(branches.id, branchId), eq(branches.isActive, true)))
        .limit(1);
    return branch ?? fail(400, 'Branch not found or inactive');
}

export const receiptRoutes = new Hono<AppEnv>()
    .get('/', async (c) => {
        const { db, me } = c.var;
        const query = parse(receiptQuerySchema, c.req.query());
        const where = and(
            scopeFor(me),
            query.from ? gte(receipts.createdAt, istDayStart(query.from)) : undefined,
            query.to ? lt(receipts.createdAt, istDayEnd(query.to)) : undefined,
            query.q ? searchCondition(query.q) : undefined,
        );
        // Promise.all, not db.batch: Drizzle's D1 batch mis-maps joined columns that share a name.
        const [[total], rows] = await Promise.all([
            db.select({ n: count() }).from(receipts).where(where),
            listQuery(db)
                .where(where)
                .orderBy(desc(receipts.createdAt), desc(receipts.id))
                .limit(PAGE_SIZE)
                .offset((query.page - 1) * PAGE_SIZE),
        ]);
        const result: Page<ReceiptListItem> = {
            items: rows.map(toListItem),
            total: total?.n ?? 0,
            page: query.page,
            pageSize: PAGE_SIZE,
        };
        return c.json(result);
    })
    .get('/print', async (c) => {
        const { db, me } = c.var;
        const { ids } = parse(idsSchema, c.req.query());
        const rows: Receipt[] = await detailQuery(db).where(
            and(scopeFor(me), inArray(receipts.id, ids)),
        );
        rows.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
        return c.json(rows);
    })
    .get('/:id', async (c) => {
        const { db, me } = c.var;
        const [row] = await detailQuery(db)
            .where(and(scopeFor(me), eq(receipts.id, paramId(c))))
            .limit(1);
        return row ? c.json(row satisfies Receipt) : fail(404, 'Receipt not found');
    })
    .post('/', async (c) => {
        const { db, me } = c.var;
        const input = await body(c, receiptCreateSchema);
        const template = await getUsableTemplate(db, me, input.templateId);
        if (!template.isActive) {
            fail(400, 'This template is inactive');
        }
        const [fields, branch] = await Promise.all([
            fieldsForTemplate(db, template),
            bookingBranch(db, me.branchId ?? input.branchId),
        ]);
        const data = parse(buildDataSchema(fields), input.data);
        const snapshot: LayoutSnapshot = {
            ...template.layout,
            branch: {
                code: branch.code,
                name: branch.name,
            },
            fields: fields.map(({ key, label, type }) => ({
                key,
                label,
                type,
            })),
        };
        const created = await withUniqueAwb(branch.code, async (awbNumber) => {
            const [row] = await db
                .insert(receipts)
                .values({
                    awbNumber,
                    templateId: template.id,
                    layoutSnapshot: snapshot,
                    data,
                    createdBy: me.id,
                    branchId: branch.id,
                })
                .returning({
                    id: receipts.id,
                    awbNumber: receipts.awbNumber,
                });
            return row;
        });
        return c.json(created, 201);
    })
    .post('/:id/void', requirePermission('receipts.void'), async (c) => {
        const [row] = await c.var.db
            .update(receipts)
            .set({ status: 'void' })
            .where(eq(receipts.id, paramId(c)))
            .returning({ id: receipts.id });
        return row ? c.json(row) : fail(404, 'Receipt not found');
    });
