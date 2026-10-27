import { createMiddleware } from 'hono/factory';
import { can, type Permission } from '../../shared/permissions';
import type { AppEnv } from '../env';
import { fail } from '../lib/http';
import { readSession } from '../lib/session';

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
    const me = await readSession(c, c.var.db);
    if (!me) {
        fail(401, 'Please log in');
    }
    c.set('me', me);
    await next();
});

export const requirePermission = (permission: Permission) =>
    createMiddleware<AppEnv>(async (c, next) => {
        if (!can(c.var.me.role, permission)) {
            fail(403, 'You do not have permission to do this');
        }
        await next();
    });
