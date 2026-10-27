import { and, eq, inArray } from 'drizzle-orm';
import type { FieldDefinition } from '../../shared/fields';
import { fieldKeysOf } from '../../shared/layout';
import { can } from '../../shared/permissions';
import type { Me, Template } from '../../shared/types';
import type { Db } from '../db';
import { fieldDefinitions, templates, userTemplates } from '../db/schema';
import { fail } from './http';

const templateColumns = {
    id: templates.id,
    name: templates.name,
    isActive: templates.isActive,
    version: templates.version,
    layout: templates.layout,
};

// Templates the user may create receipts with, plus their default choice.
export async function usableTemplates(db: Db, me: Me) {
    if (can(me.role, 'templates.useAll')) {
        const items = await db
            .select(templateColumns)
            .from(templates)
            .where(eq(templates.isActive, true))
            .orderBy(templates.name);
        return {
            items,
            defaultId: items[0]?.id ?? null,
        };
    }
    const rows = await db
        .select({
            ...templateColumns,
            isDefault: userTemplates.isDefault,
        })
        .from(userTemplates)
        .innerJoin(templates, eq(templates.id, userTemplates.templateId))
        .where(and(eq(userTemplates.userId, me.id), eq(templates.isActive, true)))
        .orderBy(templates.name);
    return {
        items: rows.map(({ isDefault: _, ...t }) => t),
        defaultId: (rows.find((r) => r.isDefault) ?? rows[0])?.id ?? null,
    };
}

export async function getUsableTemplate(db: Db, me: Me, id: number): Promise<Template> {
    const template = can(me.role, 'templates.manage')
        ? (await db.select(templateColumns).from(templates).where(eq(templates.id, id)).limit(1))[0]
        : (await usableTemplates(db, me)).items.find((t) => t.id === id);
    return template ?? fail(404, 'Template not found');
}

export async function fieldsForTemplate(db: Db, template: Template): Promise<FieldDefinition[]> {
    const keys = fieldKeysOf(template.layout);
    if (keys.length === 0) {
        return [];
    }
    const rows = await db
        .select()
        .from(fieldDefinitions)
        .where(and(inArray(fieldDefinitions.key, keys), eq(fieldDefinitions.isActive, true)))
        .orderBy(fieldDefinitions.sortOrder);
    return rows;
}
