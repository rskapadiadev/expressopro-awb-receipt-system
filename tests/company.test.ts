import { describe, expect, it } from 'vitest';
import { consignmentNote } from '../scripts/consignment-note';
import { companySchema, isCompanyProp } from '../shared/company';
import { can } from '../shared/permissions';

const profile = {
    name: ' ExpressoPro ',
    trackingLink: 'expressopro.in',
    phone: '',
    email: '',
    address: '',
    gstin: '24abcde1234f1z5',
};

describe('company profile', () => {
    it('trims, upper-cases the GSTIN and allows a blank email', () => {
        const parsed = companySchema.parse(profile);
        expect(parsed.name).toBe('ExpressoPro');
        expect(parsed.gstin).toBe('24ABCDE1234F1Z5');
    });

    it('requires a name and a valid email when given', () => {
        expect(
            companySchema.safeParse({
                ...profile,
                name: '',
            }).success,
        ).toBe(false);
        expect(
            companySchema.safeParse({
                ...profile,
                email: 'not-an-email',
            }).success,
        ).toBe(false);
    });

    it('is editable only by the Super Admin', () => {
        expect(can('super_admin', 'company.manage')).toBe(true);
        expect(can('admin', 'company.manage')).toBe(false);
        expect(can('user', 'company.manage')).toBe(false);
    });

    it('recognises element display values', () => {
        expect(isCompanyProp('trackingLink')).toBe(true);
        expect(isCompanyProp('toString')).toBe(false);
        expect(isCompanyProp(undefined)).toBe(false);
    });
});

describe('seeded consignment note', () => {
    it('takes the tracking link from the company profile', () => {
        const track = consignmentNote.layout.elements.find((el) => el.id === 'track');
        const footer = consignmentNote.layout.elements.find((el) => el.id === 'footer');
        expect(track?.kind).toBe('company');
        expect(track?.text).toBe('trackingLink');
        expect(footer?.text).toContain('{tracking_link}');
    });
});
