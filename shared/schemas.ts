import { z } from 'zod';
import { FIELD_TYPES } from './fields';
import { templateGuideSchema, templateLayoutSchema } from './layout';
import { ROLES } from './permissions';

const id = z.number().int().positive();

export const loginSchema = z.object({
    username: z.string().trim().min(1).max(60),
    password: z.string().min(1).max(200),
});

const username = z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,40}$/, 'Use 3–40 letters, numbers, dot, dash or underscore');
const password = z.string().min(8, 'At least 8 characters').max(200);

// The AWB prefix: every receipt number starts with its branch code.
export const BRANCH_CODE_LENGTH = 4;
export const AWB_RANDOM_DIGITS = 7;

export const branchInputSchema = z.object({
    code: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9]{4}$/, 'Exactly 4 letters or digits'),
    name: z.string().trim().min(1).max(80),
    city: z.string().trim().max(60),
    phone: z.string().trim().max(20),
    address: z.string().trim().max(300),
    isActive: z.boolean(),
});
export type BranchInput = z.infer<typeof branchInputSchema>;

const userBase = z.object({
    name: z.string().trim().min(1).max(100),
    username,
    role: z.enum(ROLES),
    isActive: z.boolean(),
    templateIds: z.array(id).max(50),
    defaultTemplateId: id.nullable(),
    branchId: id.nullable(),
});

// Franchise users always book under their branch, so they must have one.
const requireBranch = (u: z.infer<typeof userBase>, ctx: z.RefinementCtx) => {
    if (u.role === 'user' && u.branchId === null) {
        ctx.addIssue({
            code: 'custom',
            message: 'Select a branch',
            path: ['branchId'],
        });
    }
};

export const userCreateSchema = userBase.extend({ password }).superRefine(requireBranch);
export const userUpdateSchema = userBase
    .extend({ password: password.or(z.literal('')) })
    .superRefine(requireBranch);
export type UserInput = z.infer<typeof userUpdateSchema>;

export const fieldInputSchema = z
    .object({
        key: z
            .string()
            .trim()
            .regex(/^[a-z][a-z0-9_]{1,39}$/, 'Lowercase letters, numbers and _'),
        label: z.string().trim().min(1).max(80),
        type: z.enum(FIELD_TYPES),
        required: z.boolean(),
        options: z.array(z.string().trim().min(1).max(80)).max(100),
        searchable: z.boolean(),
        sortOrder: z.number().int().min(0).max(9999),
        isActive: z.boolean(),
    })
    .refine((f) => f.type !== 'select' || f.options.length > 0, {
        message: 'Dropdown needs at least one option',
        path: ['options'],
    });
export type FieldInput = z.infer<typeof fieldInputSchema>;

export const templateInputSchema = z.object({
    name: z.string().trim().min(1).max(80),
    isActive: z.boolean(),
    layout: templateLayoutSchema,
    // Undefined leaves the stored guide untouched; null removes it.
    guide: templateGuideSchema.nullable().optional(),
});
export type TemplateInput = z.infer<typeof templateInputSchema>;

export const receiptCreateSchema = z.object({
    templateId: id,
    // Only used by admins without a branch of their own.
    branchId: id.optional(),
    data: z.record(z.string(), z.unknown()),
});

export const receiptQuerySchema = z.object({
    q: z.string().trim().max(100).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
});
export type ReceiptQuery = z.infer<typeof receiptQuerySchema>;

export const idsSchema = z.object({
    ids: z
        .string()
        .transform((s) => s.split(',').map(Number))
        .pipe(z.array(id).min(1).max(100)),
});

export const PAGE_SIZE = 25;
export const BULK_PRINT_LIMIT = 100;
