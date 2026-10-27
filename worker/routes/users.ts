import { desc, eq, inArray } from 'drizzle-orm';
import { Hono } from 'hono';
import { hashPassword } from '../../shared/password';
import { can, manageableRoles } from '../../shared/permissions';
import { type UserInput, userCreateSchema, userUpdateSchema } from '../../shared/schemas';
import type { Me, UserRow } from '../../shared/types';
import type { Db } from '../db';
import { branches, users, userTemplates } from '../db/schema';
import type { AppEnv } from '../env';
import { body, fail, isUniqueViolation, paramId } from '../lib/http';
import { requirePermission } from '../middleware/auth';

function assertManageable(me: Me, role: UserInput['role']) {
    if (!manageableRoles(me.role).includes(role)) {
        fail(403, 'You cannot manage users with this role');
    }
}

// Replaces a user's template assignments in the same batch as the user write.
function assignmentStatements(db: Db, userId: number, input: UserInput) {
    const ids = [...new Set(input.templateIds)];
    const remove = db.delete(userTemplates).where(eq(userTemplates.userId, userId));
    if (ids.length === 0) {
        return [remove] as const;
    }
    const defaultId = ids.includes(input.defaultTemplateId ?? 0) ? input.defaultTemplateId : ids[0];
    const insert = db.insert(userTemplates).values(
        ids.map((templateId) => ({
            userId,
            templateId,
            isDefault: templateId === defaultId,
        })),
    );
    return [remove, insert] as const;
}

async function saveUser(db: Db, me: Me, userId: number | null, input: UserInput) {
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
        const id =
            userId ??
            (
                await db
                    .insert(users)
                    .values({
                        ...values,
                        passwordHash: values.passwordHash ?? '',
                    })
                    .returning({ id: users.id })
            )[0]?.id ??
            fail(500, 'Could not create user');
        const statements = [
            ...(userId ? [db.update(users).set(values).where(eq(users.id, id))] : []),
            ...(can(me.role, 'templates.assign') ? assignmentStatements(db, id, input) : []),
        ];
        const [first, ...rest] = statements;
        if (first) {
            await db.batch([first, ...rest]);
        }
        return id;
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
        const db = c.var.db;
        const rows = await db
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
        const links = rows.length
            ? await db
                  .select()
                  .from(userTemplates)
                  .where(
                      inArray(
                          userTemplates.userId,
                          rows.map((r) => r.id),
                      ),
                  )
            : [];
        const items: UserRow[] = rows.map((r) => {
            const mine = links.filter((l) => l.userId === r.id);
            return {
                ...r,
                templateIds: mine.map((l) => l.templateId),
                defaultTemplateId: mine.find((l) => l.isDefault)?.templateId ?? null,
            };
        });
        return c.json(items);
    })
    .post('/', async (c) => {
        const input = await body(c, userCreateSchema);
        assertManageable(c.var.me, input.role);
        const id = await saveUser(c.var.db, c.var.me, null, input);
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
        await saveUser(c.var.db, me, id, input);
        return c.json({ id });
    });
