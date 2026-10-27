const IST = '+05:30';

// Date filters are entered in India time; convert to UTC epoch ms for created_at comparisons.
export const istDayStart = (isoDate: string) => Date.parse(`${isoDate}T00:00:00${IST}`);
export const istDayEnd = (isoDate: string) => istDayStart(isoDate) + 86_400_000;

export function istToday(now = Date.now()) {
    return new Date(now + 5.5 * 3_600_000).toISOString().slice(0, 10);
}
