import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { verifyPassword } from '../../shared/password';
import { loginSchema } from '../../shared/schemas';
import { users } from '../db/schema';
import type { AppEnv } from '../env';
import { body, fail } from '../lib/http';
import { createSession, destroySession } from '../lib/session';
import { requireAuth } from '../middleware/auth';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60_000;

export const authRoutes = new Hono<AppEnv>()
    .post('/login', async (c) => {
        const { username, password } = await body(c, loginSchema);
        const db = c.var.db;
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.username, username.toLowerCase()))
            .limit(1);
        if (user?.lockedUntil && user.lockedUntil > Date.now()) {
            fail(429, 'Too many failed attempts. Try again in 15 minutes.');
        }
        if (!user?.isActive || !(await verifyPassword(password, user.passwordHash))) {
            if (user) {
                const attempts = user.failedLogins + 1;
                await db
                    .update(users)
                    .set({
                        failedLogins: attempts >= MAX_ATTEMPTS ? 0 : attempts,
                        lockedUntil: attempts >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : null,
                    })
                    .where(eq(users.id, user.id));
            }
            fail(401, 'Invalid username or password');
        }
        if (user.failedLogins > 0) {
            await db
                .update(users)
                .set({
                    failedLogins: 0,
                    lockedUntil: null,
                })
                .where(eq(users.id, user.id));
        }
        await createSession(c, db, user.id);
        return c.json({
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            branchId: user.branchId,
        });
    })
    .post('/logout', async (c) => {
        await destroySession(c, c.var.db);
        return c.json({ ok: true });
    })
    .get('/me', requireAuth, (c) => c.json(c.var.me));
