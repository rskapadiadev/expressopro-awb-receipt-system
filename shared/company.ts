import { z } from 'zod';

export const companySchema = z.object({
    name: z.string().trim().min(1, 'Enter the company name').max(100),
    trackingLink: z.string().trim().max(200),
    phone: z.string().trim().max(40),
    email: z.union([z.literal(''), z.email('Enter a valid email')]),
    address: z.string().trim().max(300),
    gstin: z.string().trim().toUpperCase().max(20),
});
export type CompanyProfile = z.infer<typeof companySchema>;
export type CompanyProp = keyof CompanyProfile;

export const COMPANY_LABELS: Record<CompanyProp, string> = {
    name: 'Company name',
    trackingLink: 'Tracking link',
    phone: 'Company phone',
    email: 'Company email',
    address: 'Company address',
    gstin: 'GSTIN',
};
export const COMPANY_PROPS = Object.keys(COMPANY_LABELS) as CompanyProp[];

// Placeholder names for static text, e.g. "track on:- {tracking_link}".
export const COMPANY_TOKENS: Record<CompanyProp, string> = {
    name: 'company_name',
    trackingLink: 'tracking_link',
    phone: 'company_phone',
    email: 'company_email',
    address: 'company_address',
    gstin: 'gstin',
};

export const isCompanyProp = (value: string | undefined): value is CompanyProp =>
    value !== undefined && Object.hasOwn(COMPANY_LABELS, value);
