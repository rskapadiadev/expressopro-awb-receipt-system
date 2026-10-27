import { and, eq, gt, ne } from 'drizzle-orm';
import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { randomToken, sha256Hex } from '../../shared/password';
import type { Me } from '../../shared/types';
import type { Db } from '../db';
import { sessions, users } from '../db/schema';

const COOKIE = 'sid';
const TTL_MS = 7 * 86_400_000;

export async function createSession(c: Context, db: Db, userId: number) {
    const token = randomToken();
    await db.insert(sessions).values({
        id: await sha256Hex(token),
        userId,
        expiresAt: Date.now() + TTL_MS,
    });
    setCookie(c, COOKIE, token, {
        httpOnly: true,
        secure: new URL(c.req.url).protocol === 'https:',
        sameSite: 'Lax',
        path: '/',
        maxAge: TTL_MS / 1000,
    });
}

export async function readSession(c: Context, db: Db): Promise<Me | null> {
    const token = getCookie(c, COOKIE);
    if (!token) {
        return null;
    }
    const [row] = await db
        .select({
            id: users.id,
            name: users.name,
            username: users.username,
            role: users.role,
            branchId: users.branchId,
        })
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        .where(
            and(
                eq(sessions.id, await sha256Hex(token)),
                gt(sessions.expiresAt, Date.now()),
                eq(users.isActive, true),
            ),
        )
        .limit(1);
    return row ?? null;
}

// After a password change, sign out every other browser/device but keep this one.
export async function destroyOtherSessions(c: Context, db: Db, userId: number) {
    const token = getCookie(c, COOKIE);
    const current = token ? await sha256Hex(token) : '';
    await db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, current)));
}

export async function destroySession(c: Context, db: Db) {
    const token = getCookie(c, COOKIE);
    if (token) {
        await db.delete(sessions).where(eq(sessions.id, await sha256Hex(token)));
    }
    deleteCookie(c, COOKIE, { path: '/' });
}
