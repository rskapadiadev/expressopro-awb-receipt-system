import type { Template } from '@shared/types';
import { Checkbox, Label } from './ui/form';

export interface TemplateAssignment {
    templateIds: number[];
    defaultTemplateId: number | null;
}

interface TemplatePickerProps extends TemplateAssignment {
    templates: Pick<Template, 'id' | 'name'>[];
    onChange: (next: TemplateAssignment) => void;
}

// Checkbox list with a default radio; keeps the default pointing at an assigned template.
export function TemplatePicker({
    templates,
    templateIds,
    defaultTemplateId,
    onChange,
}: TemplatePickerProps) {
    const toggle = (id: number, on: boolean) => {
        const next = on ? [...templateIds, id] : templateIds.filter((t) => t !== id);
        onChange({
            templateIds: next,
            defaultTemplateId: next.includes(defaultTemplateId ?? 0)
                ? defaultTemplateId
                : (next[0] ?? null),
        });
    };

    return (
        <fieldset className="space-y-2 rounded-lg border p-3">
            <legend className="px-1 text-sm font-medium">Templates (★ = default)</legend>
            {templates.length === 0 && (
                <p className="text-sm text-muted-foreground">No templates yet.</p>
            )}
            {templates.map((t) => {
                const assigned = templateIds.includes(t.id);
                return (
                    <div key={t.id} className="flex items-center justify-between gap-2 text-sm">
                        <Label className="flex items-center gap-2 font-normal">
                            <Checkbox
                                checked={assigned}
                                onChange={(e) => {
                                    toggle(t.id, e.target.checked);
                                }}
                            />
                            {t.name}
                        </Label>
                        {assigned && (
                            <Label className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                                <input
                                    type="radio"
                                    name="defaultTemplateId"
                                    className="accent-primary"
                                    checked={defaultTemplateId === t.id}
                                    onChange={() => {
                                        onChange({
                                            templateIds,
                                            defaultTemplateId: t.id,
                                        });
                                    }}
                                />
                                Default
                            </Label>
                        )}
                    </div>
                );
            })}
        </fieldset>
    );
}
