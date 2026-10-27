import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { z } from 'zod';

export function fail(status: ContentfulStatusCode, message: string): never {
    throw new HTTPException(status, { message });
}

export function parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
    const result = schema.safeParse(input);
    if (!result.success) {
        const issues = Object.fromEntries(
            result.error.issues.map((i) => [i.path.join('.'), i.message]),
        );
        throw new HTTPException(400, {
            res: Response.json(
                {
                    error: 'Please fix the highlighted fields',
                    issues,
                },
                { status: 400 },
            ),
        });
    }
    return result.data;
}

export async function body<T extends z.ZodType>(c: Context, schema: T): Promise<z.output<T>> {
    const json: unknown = await c.req.json().catch(() => fail(400, 'Invalid JSON body'));
    return parse(schema, json);
}

export const paramId = (c: Context) => parse(z.coerce.number().int().positive(), c.req.param('id'));

export const isUniqueViolation = (err: unknown, column = '') =>
    err instanceof Error &&
    `${err.cause instanceof Error ? err.cause.message : ''} ${err.message}`.includes(
        `UNIQUE constraint failed: ${column}`,
    );
