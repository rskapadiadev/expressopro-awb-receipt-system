import { and, count, desc, gte, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import type { DashboardStats } from '../../shared/types';
import { receipts } from '../db/schema';
import type { AppEnv } from '../env';
import { listQuery, receiptTotal, scopeFor, toListItem } from '../lib/receipts';
import { istDayStart, istToday, shiftDays } from '../lib/time';

const CHART_DAYS = 14;
const IST_OFFSET_S = 19_800;

// Receipt timestamp as an India-time calendar date (YYYY-MM-DD).
const istDate = sql<string>`date(${receipts.createdAt} / 1000 + ${IST_OFFSET_S}, 'unixepoch')`;

export const dashboardRoutes = new Hono<AppEnv>().get('/', async (c) => {
    const { db, me } = c.var;
    const today = istToday();
    const monthStart = `${today.slice(0, 8)}01`;
    // Oldest first, so days with no receipts still show as zero.
    const days = Array.from({ length: CHART_DAYS }, (_, i) => shiftDays(today, i - CHART_DAYS + 1));
    const firstDay = days[0] ?? today;
    // One indexed date-range read covers today, this month and the chart; older receipts aren't touched.
    const windowStart = firstDay < monthStart ? firstDay : monthStart;
    const scope = scopeFor(me);
    // Promise.all, not db.batch: Drizzle's D1 batch mis-maps joined columns that share a name.
    const [perDay, recent, total] = await Promise.all([
        db
            .select({
                date: istDate,
                count: count(),
            })
            .from(receipts)
            .where(and(scope, gte(receipts.createdAt, istDayStart(windowStart))))
            .groupBy(istDate),
        listQuery(db).where(scope).orderBy(desc(receipts.createdAt)).limit(10),
        receiptTotal(db, me),
    ]);
    const byDate = new Map(perDay.map((d) => [d.date, d.count]));
    const result: DashboardStats = {
        today: byDate.get(today) ?? 0,
        month: perDay.filter((d) => d.date >= monthStart).reduce((sum, d) => sum + d.count, 0),
        total,
        daily: days.map((date) => ({
            date,
            count: byDate.get(date) ?? 0,
        })),
        recent: recent.map(toListItem),
    };
    return c.json(result);
});
