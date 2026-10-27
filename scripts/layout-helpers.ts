import type { LayoutElement } from '../shared/layout';

export const el = (
    id: string,
    kind: LayoutElement['kind'],
    [x, y, w, h]: [number, number, number, number],
    extra: Partial<LayoutElement> = {},
): LayoutElement => ({
    id,
    kind,
    x,
    y,
    w,
    h,
    fontSize: 10,
    bold: false,
    align: 'left',
    showLabel: kind === 'field',
    ...extra,
});

export const field = (key: string, box: [number, number, number, number]) =>
    el(key, 'field', box, { fieldKey: key });
