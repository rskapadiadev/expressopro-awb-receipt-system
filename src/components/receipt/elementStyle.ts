import type { ElementKind, LayoutElement, Orientation } from '@shared/layout';
import type { CSSProperties } from 'react';

const BORDER = '0.25mm solid #000';
const JUSTIFY = {
    top: 'flex-start',
    middle: 'center',
    bottom: 'flex-end',
} as const;
const WRITING: Record<Orientation, CSSProperties> = {
    horizontal: {},
    down: { writingMode: 'vertical-rl' },
    up: {
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
    },
    stacked: {
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
    },
};
// Graphic elements fill their whole box instead of sitting on a text line.
const FILL_KINDS: ElementKind[] = ['barcode', 'logo', 'image', 'line', 'box'];

// Outer cell: borders, padding and vertical alignment.
export const boxStyle = (el: LayoutElement): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: JUSTIFY[el.valign ?? 'top'],
    padding: el.padding ? `${el.padding}mm` : undefined,
    borderTop: el.border?.includes('top') ? BORDER : undefined,
    borderRight: el.border?.includes('right') ? BORDER : undefined,
    borderBottom: el.border?.includes('bottom') ? BORDER : undefined,
    borderLeft: el.border?.includes('left') ? BORDER : undefined,
});

// Inner content: typography and text direction (kept separate so rotation doesn't flip borders).
export const contentStyle = (el: LayoutElement): CSSProperties =>
    FILL_KINDS.includes(el.kind)
        ? {
              flex: 1,
              minHeight: 0,
          }
        : {
              fontSize: `${el.fontSize}pt`,
              fontWeight: el.bold ? 700 : 400,
              textAlign: el.align,
              lineHeight: 1.2,
              ...WRITING[el.orientation ?? 'horizontal'],
          };
