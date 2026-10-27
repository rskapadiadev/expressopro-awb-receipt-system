import { desc, eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';
import { hashPassword } from '../../shared/password';
import { manageableRoles } from '../../shared/permissions';
import { type UserInput, userCreateSchema, userUpdateSchema } from '../../shared/schemas';
import type { Me, UserRow } from '../../shared/types';
import type { Db } from '../db';
import { branches, users } from '../db/schema';
import type { AppEnv } from '../env';
import { body, fail, isUniqueViolation, paramId } from '../lib/http';
import { requirePermission } from '../middleware/auth';

function assertManageable(me: Me, role: UserInput['role']) {
    if (!manageableRoles(me.role).includes(role)) {
        fail(403, 'You cannot manage users with this role');
    }
}

async function saveUser(db: Db, userId: number | null, input: UserInput) {
    const values = {
        name: input.name,
        username: input.username,
        role: input.role,
        branchId: input.branchId,
        isActive: input.isActive,
        ...(input.password
            ? {
                  passwordHash: await hashPassword(input.password),
                  failedLogins: 0,
                  lockedUntil: null,
              }
            : {}),
    };
    if (input.branchId !== null) {
        const [branch] = await db
            .select({ id: branches.id })
            .from(branches)
            .where(eq(branches.id, input.branchId));
        if (!branch) {
            fail(400, 'Branch not found');
        }
    }
    try {
        if (userId) {
            await db.update(users).set(values).where(eq(users.id, userId));
            return userId;
        }
        const [row] = await db
            .insert(users)
            .values({
                ...values,
                passwordHash: values.passwordHash ?? '',
            })
            .returning({ id: users.id });
        return row?.id ?? fail(500, 'Could not create user');
    } catch (err) {
        if (isUniqueViolation(err)) {
            fail(409, 'Username already exists');
        }
        throw err;
    }
}

export const userRoutes = new Hono<AppEnv>()
    .use(requirePermission('users.manage'))
    .get('/', async (c) => {
        const items: UserRow[] = await c.var.db
            .select({
                id: users.id,
                name: users.name,
                username: users.username,
                role: users.role,
                branchId: users.branchId,
                isActive: users.isActive,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(inArray(users.role, manageableRoles(c.var.me.role)))
            .orderBy(desc(users.createdAt));
        return c.json(items);
    })
    .post('/', async (c) => {
        const input = await body(c, userCreateSchema);
        assertManageable(c.var.me, input.role);
        const id = await saveUser(c.var.db, null, input);
        return c.json({ id }, 201);
    })
    .put('/:id', async (c) => {
        const id = paramId(c);
        const input = await body(c, userUpdateSchema);
        const me = c.var.me;
        const [existing] = await c.var.db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        if (!existing) {
            fail(404, 'User not found');
        }
        assertManageable(me, existing.role);
        assertManageable(me, input.role);
        if (id === me.id && (!input.isActive || input.role !== me.role)) {
            fail(400, 'You cannot deactivate yourself or change your own role');
        }
        await saveUser(c.var.db, id, input);
        return c.json({ id });
    });
