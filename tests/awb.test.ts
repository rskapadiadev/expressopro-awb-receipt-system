import { describe, expect, it } from 'vitest';
import { randomAwb } from '../shared/awb';
import { branchInputSchema, userCreateSchema } from '../shared/schemas';

describe('randomAwb', () => {
    it('is the branch code followed by 7 digits', () => {
        for (let i = 0; i < 200; i++) {
            expect(randomAwb('SURT')).toMatch(/^SURT\d{7}$/);
        }
    });

    it('produces varied numbers', () => {
        const seen = new Set(Array.from({ length: 1000 }, () => randomAwb('SURT')));
        expect(seen.size).toBeGreaterThan(990);
    });
});

describe('branch rules', () => {
    it('normalises the code to 4 upper-case characters', () => {
        const base = {
            name: 'Surat',
            city: '',
            phone: '',
            address: '',
            receiptStart: 1,
            isActive: true,
            templateIds: [],
            defaultTemplateId: null,
        };
        expect(
            branchInputSchema.parse({
                ...base,
                code: 'surt',
            }).code,
        ).toBe('SURT');
        expect(
            branchInputSchema.safeParse({
                ...base,
                code: 'SUR',
            }).success,
        ).toBe(false);
        expect(
            branchInputSchema.safeParse({
                ...base,
                code: 'SURT',
                receiptStart: 0,
            }).success,
        ).toBe(false);
    });

    it('requires a branch for franchise users only', () => {
        const user = {
            name: 'Store',
            username: 'store1',
            password: 'Store@123',
            isActive: true,
            branchId: null,
        };
        expect(
            userCreateSchema.safeParse({
                ...user,
                role: 'user',
            }).success,
        ).toBe(false);
        expect(
            userCreateSchema.safeParse({
                ...user,
                role: 'admin',
            }).success,
        ).toBe(true);
    });
});
