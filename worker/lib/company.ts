import { eq } from 'drizzle-orm';
import type { CompanyProfile } from '../../shared/company';
import type { Db } from '../db';
import { company } from '../db/schema';

export const PROFILE_ID = 1;

const columns = {
    name: company.name,
    trackingLink: company.trackingLink,
    phone: company.phone,
    email: company.email,
    address: company.address,
    gstin: company.gstin,
};

export async function getCompany(db: Db): Promise<CompanyProfile> {
    const [row] = await db.select(columns).from(company).where(eq(company.id, PROFILE_ID));
    return (
        row ?? {
            name: '',
            trackingLink: '',
            phone: '',
            email: '',
            address: '',
            gstin: '',
        }
    );
}
