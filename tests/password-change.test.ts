import { describe, expect, it } from 'vitest';
import { changePasswordSchema } from '../shared/schemas';

const errorPaths = (input: Record<string, string>) => {
    const result = changePasswordSchema.safeParse(input);
    return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
};

describe('changePasswordSchema', () => {
    it('accepts a valid change', () => {
        expect(
            errorPaths({
                currentPassword: 'old-pass-1',
                newPassword: 'new-pass-1',
                confirmPassword: 'new-pass-1',
            }),
        ).toEqual([]);
    });

    it('flags a mismatched confirmation, a short password and reuse of the current one', () => {
        expect(
            errorPaths({
                currentPassword: 'old-pass-1',
                newPassword: 'new-pass-1',
                confirmPassword: 'new-pass-2',
            }),
        ).toEqual(['confirmPassword']);
        expect(
            errorPaths({
                currentPassword: 'old-pass-1',
                newPassword: 'short',
                confirmPassword: 'short',
            }),
        ).toContain('newPassword');
        expect(
            errorPaths({
                currentPassword: 'same-pass-1',
                newPassword: 'same-pass-1',
                confirmPassword: 'same-pass-1',
            }),
        ).toEqual(['newPassword']);
    });
});
