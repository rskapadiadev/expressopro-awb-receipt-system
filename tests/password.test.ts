import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../shared/password';

describe('password hashing', () => {
    it('verifies the right password and rejects the wrong one', async () => {
        const hash = await hashPassword('correct horse');
        expect(hash.startsWith('pbkdf2$')).toBe(true);
        expect(await verifyPassword('correct horse', hash)).toBe(true);
        expect(await verifyPassword('wrong', hash)).toBe(false);
    });

    it('salts every hash', async () => {
        expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
    });
});
