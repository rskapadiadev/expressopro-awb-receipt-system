import { and, count, desc, gte, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import type { DashboardStats } from '../../shared/types';
import { receipts } from '../db/schema';
import type { AppEnv } from '../env';
import { listQuery, scopeFor, toListItem } from '../lib/receipts';
import { istDayStart, istToday } from '../lib/time';

const CHART_DAYS = 14;
const IST_OFFSET_S = 19_800;

// Receipt timestamp as an India-time calendar date (YYYY-MM-DD).
const istDate = sql<string>`date(${receipts.createdAt} / 1000 + ${IST_OFFSET_S}, 'unixepoch')`;

// The last n dates ending today, oldest first, so days with no receipts still show as zero.
const lastDays = (today: string, n: number) =>
    Array.from({ length: n }, (_, i) =>
        new Date(Date.parse(today) - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10),
    );

export const dashboardRoutes = new Hono<AppEnv>().get('/', async (c) => {
    const { db, me } = c.var;
    const today = istToday();
    const dayStart = istDayStart(today);
    const monthStart = istDayStart(`${today.slice(0, 8)}01`);
    const scope = scopeFor(me);
    const days = lastDays(today, CHART_DAYS);
    const chartStart = istDayStart(days[0] ?? today);
    // Promise.all, not db.batch: Drizzle's D1 batch mis-maps joined columns that share a name.
    const [[stats], recent, perDay] = await Promise.all([
        db
            .select({
                total: count(),
                today: sql<number>`coalesce(sum(${receipts.createdAt} >= ${dayStart}), 0)`,
                month: sql<number>`coalesce(sum(${receipts.createdAt} >= ${monthStart}), 0)`,
            })
            .from(receipts)
            .where(scope),
        listQuery(db).where(scope).orderBy(desc(receipts.createdAt)).limit(10),
        db
            .select({
                date: istDate,
                count: count(),
            })
            .from(receipts)
            .where(and(scope, gte(receipts.createdAt, chartStart)))
            .groupBy(istDate),
    ]);
    const byDate = new Map(perDay.map((d) => [d.date, d.count]));
    const result: DashboardStats = {
        today: stats?.today ?? 0,
        month: stats?.month ?? 0,
        total: stats?.total ?? 0,
        daily: days.map((date) => ({
            date,
            count: byDate.get(date) ?? 0,
        })),
        recent: recent.map(toListItem),
    };
    return c.json(result);
});
