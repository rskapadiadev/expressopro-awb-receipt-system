import type { FieldDefinition, ReceiptData } from './fields';
import type { LayoutSnapshot, TemplateGuide, TemplateLayout } from './layout';
import type { Role } from './permissions';

export interface Me {
    id: number;
    name: string;
    username: string;
    role: Role;
    branchId: number | null;
}

export interface Branch {
    id: number;
    code: string;
    name: string;
    city: string;
    phone: string;
    address: string;
    isActive: boolean;
    templateIds: number[];
    defaultTemplateId: number | null;
}

export interface UserRow extends Me {
    isActive: boolean;
    createdAt: number;
}

export interface Template {
    id: number;
    name: string;
    isActive: boolean;
    version: number;
    layout: TemplateLayout;
    // Designer-only tracing image; returned only to template managers.
    guide?: TemplateGuide | null;
}

export interface ReceiptListItem {
    id: number;
    awbNumber: string;
    templateName: string;
    paper: string;
    status: 'active' | 'void';
    createdBy: string;
    createdAt: number;
    branchCode: string | null;
    summary: string;
}

export interface Receipt {
    id: number;
    awbNumber: string;
    status: 'active' | 'void';
    createdBy: string;
    createdAt: number;
    layout: LayoutSnapshot;
    data: ReceiptData;
}

export interface Page<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

export interface DashboardStats {
    today: number;
    month: number;
    total: number;
    daily: DailyCount[];
    recent: ReceiptListItem[];
}

export interface DailyCount {
    date: string;
    count: number;
}

export interface TemplateWithFields {
    template: Template;
    fields: FieldDefinition[];
}
