import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { can } from '../../shared/permissions';
import { type BranchInput, branchInputSchema } from '../../shared/schemas';
import type { Branch, Me } from '../../shared/types';
import type { Db } from '../db';
import { branches, branchTemplates } from '../db/schema';
import type { AppEnv } from '../env';
import { body, fail, isUniqueViolation, paramId } from '../lib/http';
import { requirePermission } from '../middleware/auth';

const manage = requirePermission('branches.manage');

const columns = {
    id: branches.id,
    code: branches.code,
    name: branches.name,
    city: branches.city,
    phone: branches.phone,
    address: branches.address,
    receiptStart: branches.receiptStart,
    isActive: branches.isActive,
};

const branchValues = (input: BranchInput) => ({
    code: input.code,
    name: input.name,
    city: input.city,
    phone: input.phone,
    address: input.address,
    receiptStart: input.receiptStart,
    isActive: input.isActive,
});

// Unique code is the AWB prefix, so a duplicate would make receipt numbers ambiguous.
const saveErrors = (err: unknown) => {
    if (isUniqueViolation(err, 'branches.code')) {
        fail(409, 'Another branch already uses this code');
    }
    throw err;
};

// Replaces a branch's template list in one batch; only the Super Admin may change it.
async function saveAssignments(db: Db, me: Me, branchId: number, input: BranchInput) {
    if (!can(me.role, 'templates.assign')) {
        return;
    }
    const ids = [...new Set(input.templateIds)];
    const defaultId = ids.includes(input.defaultTemplateId ?? 0) ? input.defaultTemplateId : ids[0];
    const remove = db.delete(branchTemplates).where(eq(branchTemplates.branchId, branchId));
    if (ids.length === 0) {
        await remove;
        return;
    }
    await db.batch([
        remove,
        db.insert(branchTemplates).values(
            ids.map((templateId) => ({
                branchId,
                templateId,
                isDefault: templateId === defaultId,
            })),
        ),
    ]);
}

export const branchRoutes = new Hono<AppEnv>()
    .get('/', async (c) => {
        const { db } = c.var;
        const [rows, links] = await Promise.all([
            db.select(columns).from(branches).orderBy(branches.code),
            db.select().from(branchTemplates),
        ]);
        const items: Branch[] = rows.map((b) => {
            const mine = links.filter((l) => l.branchId === b.id);
            return {
                ...b,
                templateIds: mine.map((l) => l.templateId),
                defaultTemplateId: mine.find((l) => l.isDefault)?.templateId ?? null,
            };
        });
        return c.json(items);
    })
    .post('/', manage, async (c) => {
        const input = await body(c, branchInputSchema);
        const [row] = await c.var.db
            .insert(branches)
            .values(branchValues(input))
            .returning({ id: branches.id })
            .catch(saveErrors);
        const id = row?.id ?? fail(500, 'Could not create branch');
        await saveAssignments(c.var.db, c.var.me, id, input);
        return c.json({ id }, 201);
    })
    .put('/:id', manage, async (c) => {
        const id = paramId(c);
        const input = await body(c, branchInputSchema);
        const [row] = await c.var.db
            .update(branches)
            .set(branchValues(input))
            .where(eq(branches.id, id))
            .returning({ id: branches.id })
            .catch(saveErrors);
        if (!row) {
            fail(404, 'Branch not found');
        }
        await saveAssignments(c.var.db, c.var.me, id, input);
        return c.json({ id });
    });
