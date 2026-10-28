import {
    DEFAULT_STYLE,
    type ElementKind,
    type LayoutElement,
    type Orientation,
    type Side,
} from '@shared/layout';
import type { CSSProperties } from 'react';

const JUSTIFY = {
    top: 'flex-start',
    middle: 'center',
    bottom: 'flex-end',
} as const;
// Vertical text runs top-to-bottom, so "align" has to place the whole column across the cell.
const ACROSS = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
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

export const colorOf = (el: LayoutElement) => el.color ?? DEFAULT_STYLE.color;

const borderOf = (el: LayoutElement) =>
    `${el.borderWidth ?? DEFAULT_STYLE.borderWidth}mm ${el.borderStyle ?? DEFAULT_STYLE.borderStyle} ${el.borderColor ?? DEFAULT_STYLE.borderColor}`;

// Outer cell: borders, fill, padding and vertical alignment.
export const boxStyle = (el: LayoutElement): CSSProperties => {
    const border = borderOf(el);
    const side = (s: Side) => (el.border?.includes(s) ? border : undefined);
    return {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: JUSTIFY[el.valign ?? 'top'],
        padding: el.padding ? `${el.padding}mm` : undefined,
        color: colorOf(el),
        backgroundColor: el.background,
        borderTop: side('top'),
        borderRight: side('right'),
        borderBottom: side('bottom'),
        borderLeft: side('left'),
    };
};

const isVertical = (el: LayoutElement) => (el.orientation ?? 'horizontal') !== 'horizontal';

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
              fontStyle: el.italic ? 'italic' : undefined,
              textDecoration: el.underline ? 'underline' : undefined,
              textAlign: el.align,
              lineHeight: 1.2,
              alignSelf: isVertical(el) ? ACROSS[el.align] : undefined,
              ...WRITING[el.orientation ?? 'horizontal'],
          };
