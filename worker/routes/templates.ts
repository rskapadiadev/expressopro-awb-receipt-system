import { eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { can } from '../../shared/permissions';
import { templateInputSchema } from '../../shared/schemas';
import type { TemplateWithFields } from '../../shared/types';
import { templates } from '../db/schema';
import type { AppEnv } from '../env';
import { body, fail, paramId } from '../lib/http';
import { fieldsForTemplate, getUsableTemplate, usableTemplates } from '../lib/templates';
import { requirePermission } from '../middleware/auth';

const manage = requirePermission('templates.manage');

export const templateRoutes = new Hono<AppEnv>()
    .get('/', async (c) => {
        const { db, me } = c.var;
        if (can(me.role, 'templates.manage') && c.req.query('all') === '1') {
            const items = await db
                .select({
                    id: templates.id,
                    name: templates.name,
                    isActive: templates.isActive,
                    version: templates.version,
                    layout: templates.layout,
                })
                .from(templates)
                .orderBy(templates.name);
            return c.json({
                items,
                defaultId: null,
            });
        }
        return c.json(await usableTemplates(db, me));
    })
    .get('/:id', async (c) => {
        const { db, me } = c.var;
        const template = await getUsableTemplate(db, me, paramId(c));
        // Only template managers need the (large) tracing image.
        const [fields, guide] = await Promise.all([
            fieldsForTemplate(db, template),
            can(me.role, 'templates.manage')
                ? db
                      .select({ guide: templates.guide })
                      .from(templates)
                      .where(eq(templates.id, template.id))
                      .then(([row]) => row?.guide ?? null)
                : undefined,
        ]);
        const result: TemplateWithFields = {
            template: {
                ...template,
                guide,
            },
            fields,
        };
        return c.json(result);
    })
    .post('/', manage, async (c) => {
        const input = await body(c, templateInputSchema);
        const [row] = await c.var.db
            .insert(templates)
            .values(input)
            .returning({ id: templates.id });
        return c.json(row, 201);
    })
    .put('/:id', manage, async (c) => {
        const id = paramId(c);
        const input = await body(c, templateInputSchema);
        const [row] = await c.var.db
            .update(templates)
            .set({
                ...input,
                version: sql`${templates.version} + 1`,
            })
            .where(eq(templates.id, id))
            .returning({ id: templates.id });
        return row ? c.json(row) : fail(404, 'Template not found');
    });
