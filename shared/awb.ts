import { AWB_RANDOM_DIGITS } from './schemas';

const RANGE = 10 ** AWB_RANDOM_DIGITS;
// Largest multiple of RANGE below 2^32, so every number is equally likely (no modulo bias).
const LIMIT = Math.floor(2 ** 32 / RANGE) * RANGE;

// Branch code + 7 random digits, e.g. SURT0482917.
export function randomAwb(branchCode: string): string {
    const buf = new Uint32Array(1);
    let n: number;
    do {
        crypto.getRandomValues(buf);
        n = buf[0] ?? 0;
    } while (n >= LIMIT);
    return `${branchCode}${String(n % RANGE).padStart(AWB_RANDOM_DIGITS, '0')}`;
}
