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
import { getCompany } from '../lib/company';
import { body, fail, paramId, parse } from '../lib/http';
import { detailQuery, listQuery, receiptTotal, scopeFor, toListItem } from '../lib/receipts';
import { type SearchPlan, searchPlan } from '../lib/search';
import { fieldsForTemplate, getUsableTemplate } from '../lib/templates';
import { istDayEnd, istDayStart, istToday } from '../lib/time';
import { requirePermission } from '../middleware/auth';

// Only the plan's matching rows are read: an AWB index range, or text matches within a date window.
async function searchCondition(db: Db, plan: SearchPlan) {
    if (plan.mode === 'awb') {
        return sql`${receipts.awbNumber} >= ${plan.prefix} AND ${receipts.awbNumber} < ${`${plan.prefix}~`}`;
    }
    if (plan.mode === 'none') {
        return undefined;
    }
    // Searchable keys are loaded once here rather than re-read for every receipt row.
    const keys = await db
        .select({ key: fieldDefinitions.key })
        .from(fieldDefinitions)
        .where(eq(fieldDefinitions.searchable, true));
    return or(
        sql`${receipts.awbNumber} LIKE ${plan.like}`,
        ...keys.map(
            ({ key }) => sql`json_extract(${receipts.data}, ${`$.${key}`}) LIKE ${plan.like}`,
        ),
    );
}

// Next number for the branch, computed inside the INSERT (D1 runs statements one at a time), using
// the (branch_id, receipt_no) index for max(); the branch's start lets it continue a paper book.
const nextReceiptNo = (branchId: number) =>
    sql`(SELECT max(
        coalesce((SELECT max(${receipts.receiptNo}) FROM ${receipts} WHERE ${receipts.branchId} = ${branchId}), 0),
        (SELECT ${branches.receiptStart} - 1 FROM ${branches} WHERE ${branches.id} = ${branchId})
    ) + 1)`;

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
        const plan = searchPlan(query.q, query.from, istToday());
        const where = and(
            scopeFor(me),
            plan.from ? gte(receipts.createdAt, istDayStart(plan.from)) : undefined,
            query.to ? lt(receipts.createdAt, istDayEnd(query.to)) : undefined,
            await searchCondition(db, plan),
        );
        const unfiltered = plan.mode === 'none' && !plan.from && !query.to;
        // Promise.all, not db.batch: Drizzle's D1 batch mis-maps joined columns that share a name.
        const [total, rows] = await Promise.all([
            unfiltered
                ? receiptTotal(db, me)
                : db
                      .select({ n: count() })
                      .from(receipts)
                      .where(where)
                      .then(([row]) => row?.n ?? 0),
            listQuery(db)
                .where(where)
                .orderBy(desc(receipts.createdAt), desc(receipts.id))
                .limit(PAGE_SIZE)
                .offset((query.page - 1) * PAGE_SIZE),
        ]);
        const result: Page<ReceiptListItem> = {
            items: rows.map(toListItem),
            total,
            page: query.page,
            pageSize: PAGE_SIZE,
            searchedFrom: plan.mode === 'text' && plan.windowed ? plan.from : null,
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
        const [fields, branch, companyProfile] = await Promise.all([
            fieldsForTemplate(db, template),
            bookingBranch(db, me.branchId ?? input.branchId),
            getCompany(db),
        ]);
        const data = parse(buildDataSchema(fields), input.data);
        const snapshot: LayoutSnapshot = {
            ...template.layout,
            branch: {
                code: branch.code,
                name: branch.name,
            },
            company: companyProfile,
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
                    receiptNo: nextReceiptNo(branch.id),
                })
                .returning({
                    id: receipts.id,
                    awbNumber: receipts.awbNumber,
                    receiptNo: receipts.receiptNo,
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
