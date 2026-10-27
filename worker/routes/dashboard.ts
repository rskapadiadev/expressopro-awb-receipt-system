import { count, desc, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import type { DashboardStats } from '../../shared/types';
import { receipts } from '../db/schema';
import type { AppEnv } from '../env';
import { listQuery, scopeFor, toListItem } from '../lib/receipts';
import { istDayStart, istToday } from '../lib/time';

export const dashboardRoutes = new Hono<AppEnv>().get('/', async (c) => {
    const { db, me } = c.var;
    const today = istToday();
    const dayStart = istDayStart(today);
    const monthStart = istDayStart(`${today.slice(0, 8)}01`);
    const scope = scopeFor(me);
    // Promise.all, not db.batch: Drizzle's D1 batch mis-maps joined columns that share a name.
    const [[stats], recent] = await Promise.all([
        db
            .select({
                total: count(),
                today: sql<number>`coalesce(sum(${receipts.createdAt} >= ${dayStart}), 0)`,
                month: sql<number>`coalesce(sum(${receipts.createdAt} >= ${monthStart}), 0)`,
            })
            .from(receipts)
            .where(scope),
        listQuery(db).where(scope).orderBy(desc(receipts.createdAt)).limit(10),
    ]);
    const result: DashboardStats = {
        today: stats?.today ?? 0,
        month: stats?.month ?? 0,
        total: stats?.total ?? 0,
        recent: recent.map(toListItem),
    };
    return c.json(result);
});
