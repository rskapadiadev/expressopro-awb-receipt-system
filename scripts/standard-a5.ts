import type { TemplateLayout } from '../shared/layout';
import { el, field } from './layout-helpers';

export const standardA5: {
    name: string;
    layout: TemplateLayout;
} = {
    name: 'Standard A5',
    layout: {
        widthMm: 148,
        heightMm: 210,
        elements: [
            el('logo', 'logo', [6, 5, 60, 16]),
            el('barcode', 'barcode', [82, 5, 60, 16]),
            el('awb', 'awb', [82, 21, 60, 6], {
                align: 'center',
                bold: true,
                fontSize: 11,
            }),
            el('rule', 'line', [6, 30, 136, 0.4]),
            field('sender_name', [6, 34, 66, 10]),
            field('receiver_name', [76, 34, 66, 10]),
            field('sender_phone', [6, 46, 66, 10]),
            field('receiver_phone', [76, 46, 66, 10]),
            field('sender_address', [6, 58, 66, 20]),
            field('receiver_address', [76, 58, 66, 20]),
            field('origin', [6, 80, 66, 10]),
            field('destination', [76, 80, 66, 10]),
            field('pieces', [6, 94, 42, 10]),
            field('weight_kg', [52, 94, 42, 10]),
            field('payment_mode', [98, 94, 44, 10]),
            field('description', [6, 108, 136, 22]),
            el('frame', 'box', [6, 140, 136, 30]),
            el('sign', 'text', [10, 162, 60, 6], {
                text: 'Receiver signature',
                fontSize: 8,
            }),
        ],
    },
};
