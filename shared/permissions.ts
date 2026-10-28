export const ROLES = ['super_admin', 'admin', 'user'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    user: 'User',
};

const MATRIX = {
    'fields.manage': ['super_admin'],
    'templates.manage': ['super_admin'],
    'templates.assign': ['super_admin'],
    'company.manage': ['super_admin'],
    'users.manage': ['super_admin', 'admin'],
    'branches.manage': ['super_admin', 'admin'],
    'receipts.viewAll': ['super_admin', 'admin'],
    'receipts.void': ['super_admin', 'admin'],
    'templates.useAll': ['super_admin', 'admin'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof MATRIX;

export function can(role: Role, permission: Permission): boolean {
    return (MATRIX[permission] as readonly Role[]).includes(role);
}

// Roles an actor may create or edit: admins manage only franchise users.
export function manageableRoles(role: Role): Role[] {
    if (role === 'super_admin') {
        return [...ROLES];
    }
    return role === 'admin' ? ['user'] : [];
}
