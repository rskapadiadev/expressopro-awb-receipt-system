import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { fieldInputSchema } from '../../shared/schemas';
import { fieldDefinitions } from '../db/schema';
import type { AppEnv } from '../env';
import { body, fail, isUniqueViolation, paramId } from '../lib/http';
import { requirePermission } from '../middleware/auth';

const manage = requirePermission('fields.manage');

export const fieldRoutes = new Hono<AppEnv>()
    .get('/', async (c) => {
        const rows = await c.var.db
            .select()
            .from(fieldDefinitions)
            .orderBy(fieldDefinitions.sortOrder, fieldDefinitions.label);
        return c.json(rows);
    })
    .post('/', manage, async (c) => {
        const input = await body(c, fieldInputSchema);
        try {
            const [row] = await c.var.db.insert(fieldDefinitions).values(input).returning();
            return c.json(row, 201);
        } catch (err) {
            if (isUniqueViolation(err)) {
                fail(409, 'A field with this key already exists');
            }
            throw err;
        }
    })
    .put('/:id', manage, async (c) => {
        const id = paramId(c);
        // Key is immutable: saved receipts reference fields by key.
        const { key: _, ...input } = await body(c, fieldInputSchema);
        const [row] = await c.var.db
            .update(fieldDefinitions)
            .set(input)
            .where(eq(fieldDefinitions.id, id))
            .returning();
        return row ? c.json(row) : fail(404, 'Field not found');
    });
