import { describe, expect, it } from 'vitest';
import { can, manageableRoles } from '../shared/permissions';

describe('permissions', () => {
    it('only super admin designs templates and fields', () => {
        expect(can('super_admin', 'templates.manage')).toBe(true);
        expect(can('admin', 'templates.manage')).toBe(false);
        expect(can('user', 'fields.manage')).toBe(false);
    });

    it('users see only their own receipts', () => {
        expect(can('admin', 'receipts.viewAll')).toBe(true);
        expect(can('user', 'receipts.viewAll')).toBe(false);
    });

    it('admins can only manage franchise users', () => {
        expect(manageableRoles('super_admin')).toEqual(['super_admin', 'admin', 'user']);
        expect(manageableRoles('admin')).toEqual(['user']);
        expect(manageableRoles('user')).toEqual([]);
    });
});
