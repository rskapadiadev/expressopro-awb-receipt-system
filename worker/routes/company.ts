import { Hono } from 'hono';
import { companySchema } from '../../shared/company';
import { company } from '../db/schema';
import type { AppEnv } from '../env';
import { getCompany, PROFILE_ID } from '../lib/company';
import { body } from '../lib/http';
import { requirePermission } from '../middleware/auth';

export const companyRoutes = new Hono<AppEnv>()
    .get('/', async (c) => c.json(await getCompany(c.var.db)))
    .post('/', requirePermission('company.manage'), async (c) => {
        const input = await body(c, companySchema);
        // Upsert keeps working even if the migration's seed row was ever removed.
        await c.var.db
            .insert(company)
            .values({
                id: PROFILE_ID,
                ...input,
            })
            .onConflictDoUpdate({
                target: company.id,
                set: input,
            });
        return c.json({ id: PROFILE_ID });
    });
