import type { TemplateLayout } from '@shared/layout';
import { describe, expect, it } from 'vitest';
import { snapPosition, snapSize } from '../src/components/designer/elements';

const paper: TemplateLayout = {
    widthMm: 200,
    heightMm: 100,
    elements: [],
};
const cell = {
    x: 10,
    y: 10,
    w: 40,
    h: 8,
};

describe('designer snapping', () => {
    it('snaps a box next to a neighbour cell', () => {
        const moved = snapPosition(
            {
                x: 51,
                y: 10.8,
                w: 30,
                h: 8,
            },
            [cell],
            paper,
        );
        expect(moved).toEqual({
            x: 50,
            y: 10,
        });
    });

    it('leaves a box alone when no edge is close', () => {
        const box = {
            x: 80,
            y: 40,
            w: 10,
            h: 10,
        };
        expect(snapPosition(box, [cell], paper)).toEqual({
            x: 80,
            y: 40,
        });
    });

    it('stretches right and bottom edges to line up', () => {
        const size = snapSize(
            {
                x: 10,
                y: 20,
                w: 39,
                h: 5,
            },
            [cell],
            paper,
        );
        expect(size.w).toBe(40);
        expect(size.h).toBe(5);
    });
});
