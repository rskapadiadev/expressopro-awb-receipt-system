// Iterations tuned to stay near the Workers free-plan CPU budget; stored per hash so it can be raised later.
const ITERATIONS = 60_000;
const encoder = new TextEncoder();

const toHex = (buf: ArrayBuffer | Uint8Array) =>
    Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string) =>
    new Uint8Array(hex.match(/../g)?.map((h) => parseInt(h, 16)) ?? []);

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
        'deriveBits',
    ]);
    const bits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            hash: 'SHA-256',
            salt,
            iterations,
        },
        key,
        256,
    );
    return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derive(password, salt, ITERATIONS);
    return `pbkdf2$${ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const [scheme, iter, salt, expected] = stored.split('$');
    if (scheme !== 'pbkdf2' || !iter || !salt || !expected) {
        return false;
    }
    const actual = toHex(await derive(password, fromHex(salt), Number(iter)));
    // Constant-time compare to avoid leaking match length via timing.
    let diff = actual.length ^ expected.length;
    for (let i = 0; i < actual.length; i++) {
        diff |= actual.charCodeAt(i) ^ (expected.charCodeAt(i) || 0);
    }
    return diff === 0;
}

export async function sha256Hex(value: string): Promise<string> {
    return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

export const randomToken = () => toHex(crypto.getRandomValues(new Uint8Array(32)));
