import { COMPANY_LABELS, COMPANY_PROPS, COMPANY_TOKENS } from './company';

// Static text can include any field or automatic value as {name}, e.g. "Weight: {weight_kg} kg".
const TOKEN = /\{([a-z0-9_]+)\}/g;

export const placeholder = (token: string) => `{${token}}`;

// Automatic values; anything else in braces is treated as a field key.
export const AUTO_TOKENS: Record<string, string> = {
    copy: 'Copy name',
    awb_number: 'AWB number',
    receipt_no: 'Receipt number',
    booking_date: 'Booking date',
    branch_code: 'Branch code',
    branch_name: 'Branch name',
    ...Object.fromEntries(COMPANY_PROPS.map((p) => [COMPANY_TOKENS[p], COMPANY_LABELS[p]])),
};

export const isAutoToken = (token: string) => Object.hasOwn(AUTO_TOKENS, token);

// Replaces each {token} using `valueOf`; unknown tokens are left as typed so mistakes stay visible.
export const fillTokens = (text: string, valueOf: (token: string) => string | undefined) =>
    text.replace(TOKEN, (match, token: string) => valueOf(token) ?? match);

// Field keys a piece of static text refers to, so the booking form collects them.
export const fieldTokensIn = (text: string) =>
    [...text.matchAll(TOKEN)].flatMap(([, token]) => (token && !isAutoToken(token) ? [token] : []));
