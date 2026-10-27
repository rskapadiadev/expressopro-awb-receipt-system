import { randomAwb } from '../../shared/awb';
import { fail, isUniqueViolation } from './http';

const MAX_ATTEMPTS = 5;

// Random numbers can collide; the UNIQUE index catches it and we simply draw again.
export async function withUniqueAwb<T>(branchCode: string, insert: (awb: string) => Promise<T>) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
            return await insert(randomAwb(branchCode));
        } catch (err) {
            if (!isUniqueViolation(err, 'receipts.awb_number')) {
                throw err;
            }
        }
    }
    return fail(503, 'Could not allocate an AWB number, please try again');
}
