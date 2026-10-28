import { FIELD_REGISTRY, type FieldDefinition } from '@shared/fields';
import type { RenderContext } from '@/components/receipt/ReceiptRenderer';
import { fieldMap } from './paper';

// Placeholder values so templates can be previewed before any receipt exists.
export const sampleContext = (fields: FieldDefinition[]): RenderContext => ({
    fields: fieldMap(fields),
    data: Object.fromEntries(
        fields.map((f) => [
            f.key,
            f.type === 'select' ? (f.options[0] ?? '') : FIELD_REGISTRY[f.type].sample,
        ]),
    ),
    awbNumber: 'SURT0482917',
    receiptNo: 61,
    createdAt: Date.now(),
    branch: {
        code: 'SURT',
        name: 'Surat',
    },
    preview: true,
});
