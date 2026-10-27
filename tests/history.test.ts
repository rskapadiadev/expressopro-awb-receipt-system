import { describe, expect, it } from 'vitest';
import { type History, historyReducer, initHistory } from '../src/lib/history';

const set = (state: History<number>, value: number, mergeKey?: string, now = 0) =>
    historyReducer(state, {
        type: 'set',
        next: () => value,
        mergeKey,
        now,
    });
const undo = (state: History<number>) => historyReducer(state, { type: 'undo' });
const redo = (state: History<number>) => historyReducer(state, { type: 'redo' });

describe('historyReducer', () => {
    it('undoes and redoes in order', () => {
        let h = set(set(initHistory(0), 1), 2);
        h = undo(h);
        expect(h.present).toBe(1);
        h = undo(h);
        expect(h.present).toBe(0);
        h = redo(redo(h));
        expect(h.present).toBe(2);
    });

    it('does nothing when there is nothing to undo or redo', () => {
        const h = initHistory(5);
        expect(undo(h)).toBe(h);
        expect(redo(h)).toBe(h);
    });

    it('clears redo after a new edit', () => {
        const h = set(undo(set(initHistory(0), 1)), 9);
        expect(h.future).toEqual([]);
        expect(redo(h).present).toBe(9);
    });

    it('merges rapid edits with the same key into one undo step', () => {
        let h = set(initHistory(0), 1, 'x', 0);
        h = set(h, 2, 'x', 300);
        h = set(h, 3, 'x', 600);
        expect(undo(h).present).toBe(0);
    });

    it('does not merge edits that are far apart or have different keys', () => {
        let h = set(initHistory(0), 1, 'x', 0);
        h = set(h, 2, 'x', 5000);
        h = set(h, 3, 'y', 5100);
        expect(undo(h).present).toBe(2);
        expect(undo(undo(h)).present).toBe(1);
    });
});
