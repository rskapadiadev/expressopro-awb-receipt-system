import { SEARCH_WINDOW_DAYS } from '../../shared/schemas';
import { shiftDays } from './time';

// Branch code + digits, e.g. SURT8978 or SURT8978467: answered from the unique AWB index.
const AWB_PREFIX = /^[A-Z0-9]{4}\d+$/;

export type SearchPlan =
    | {
          mode: 'none';
          from?: string;
      }
    | {
          mode: 'awb';
          prefix: string;
          from?: string;
      }
    | {
          mode: 'text';
          like: string;
          from: string;
          windowed: boolean;
      };

// Decides how a receipt search runs so it never reads every receipt in the database.
export function searchPlan(
    q: string | undefined,
    from: string | undefined,
    today: string,
): SearchPlan {
    const term = q?.trim();
    if (!term) {
        return {
            mode: 'none',
            from,
        };
    }
    const compact = term.replace(/\s+/g, '').toUpperCase();
    if (AWB_PREFIX.test(compact)) {
        return {
            mode: 'awb',
            prefix: compact,
            from,
        };
    }
    return {
        mode: 'text',
        like: `%${term}%`,
        from: from ?? shiftDays(today, -SEARCH_WINDOW_DAYS),
        windowed: !from,
    };
}
