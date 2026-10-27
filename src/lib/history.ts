const LIMIT = 100;
const MERGE_MS = 1000;

export interface History<T> {
    past: T[];
    present: T;
    future: T[];
    mergeKey: string | null;
    changedAt: number;
}

export type HistoryAction<T> =
    | {
          type: 'set';
          next: (prev: T) => T;
          mergeKey?: string;
          now: number;
      }
    | {
          type: 'undo' | 'redo';
      };

export const initHistory = <T>(present: T): History<T> => ({
    past: [],
    present,
    future: [],
    mergeKey: null,
    changedAt: 0,
});

export function historyReducer<T>(state: History<T>, action: HistoryAction<T>): History<T> {
    if (action.type === 'set') {
        const next = action.next(state.present);
        if (next === state.present) {
            return state;
        }
        // Rapid edits with the same key (typing a number, holding an arrow) undo as one step.
        const merge =
            action.mergeKey !== undefined &&
            action.mergeKey === state.mergeKey &&
            action.now - state.changedAt < MERGE_MS;
        return {
            past: merge ? state.past : [...state.past, state.present].slice(-LIMIT),
            present: next,
            future: [],
            mergeKey: action.mergeKey ?? null,
            changedAt: action.now,
        };
    }
    const stepped = {
        mergeKey: null,
        changedAt: 0,
    };
    if (action.type === 'undo') {
        const prev = state.past.at(-1);
        return prev === undefined
            ? state
            : {
                  ...stepped,
                  past: state.past.slice(0, -1),
                  present: prev,
                  future: [state.present, ...state.future],
              };
    }
    const [next, ...rest] = state.future;
    return next === undefined
        ? state
        : {
              ...stepped,
              past: [...state.past, state.present],
              present: next,
              future: rest,
          };
}
