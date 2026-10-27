import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { branchInputSchema } from '../../shared/schemas';
import { branches } from '../db/schema';
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
    isActive: branches.isActive,
};

// Unique code is the AWB prefix, so a duplicate would make receipt numbers ambiguous.
const saveErrors = (err: unknown) => {
    if (isUniqueViolation(err, 'branches.code')) {
        fail(409, 'Another branch already uses this code');
    }
    throw err;
};

export const branchRoutes = new Hono<AppEnv>()
    .get('/', async (c) => {
        const rows = await c.var.db.select(columns).from(branches).orderBy(branches.code);
        return c.json(rows);
    })
    .post('/', manage, async (c) => {
        const input = await body(c, branchInputSchema);
        const [row] = await c.var.db
            .insert(branches)
            .values(input)
            .returning(columns)
            .catch(saveErrors);
        return c.json(row, 201);
    })
    .put('/:id', manage, async (c) => {
        const id = paramId(c);
        const input = await body(c, branchInputSchema);
        const [row] = await c.var.db
            .update(branches)
            .set(input)
            .where(eq(branches.id, id))
            .returning(columns)
            .catch(saveErrors);
        return row ? c.json(row) : fail(404, 'Branch not found');
    });
