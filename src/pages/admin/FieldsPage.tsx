import { useQuery } from '@tanstack/react-query';
import { FIELD_REGISTRY, type FieldDefinition, nextSortOrder } from '@shared/fields';
import { templatesUsing } from '@shared/layout';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { type Editing, EditorDialog } from '@/components/EditorDialog';
import { FieldForm } from '@/components/fields/FieldForm';
import { Button } from '@/components/ui/button';
import { Badge, Card, PageHeader } from '@/components/ui/card';
import { DataTable } from '@/components/ui/table';
import { editColumn } from '@/lib/columns';
import { fieldsQuery, templatesQuery } from '@/lib/queries';

export function FieldsPage() {
    const { data: fields = [], isPending } = useQuery(fieldsQuery);
    const { data: templates } = useQuery(templatesQuery(true));
    const usedBy = (key: string) => templatesUsing(templates?.items ?? [], key);
    const [editing, setEditing] = useState<Editing<FieldDefinition>>(null);

    return (
        <>
            <PageHeader
                title="Field library"
                description="The fields templates can use. Keys are permanent once created."
                actions={
                    <Button
                        onClick={() => {
                            setEditing('new');
                        }}
                    >
                        <Plus className="size-4" /> New field
                    </Button>
                }
            />
            <Card className="overflow-hidden">
                <DataTable
                    loading={isPending}
                    rows={fields}
                    rowKey={(f) => f.id}
                    columns={[
                        {
                            header: 'Label',
                            cell: (f) => (
                                <div className="leading-tight">
                                    <div className="font-medium">{f.label}</div>
                                    <div className="font-mono text-xs text-muted-foreground">
                                        {f.key}
                                    </div>
                                </div>
                            ),
                        },
                        {
                            header: 'Type',
                            cell: (f) => FIELD_REGISTRY[f.type].label,
                        },
                        {
                            header: 'Used in',
                            className: 'hidden md:table-cell',
                            cell: (f) => {
                                const names = usedBy(f.key);
                                return names.length ? (
                                    <span title={names.join(', ')}>
                                        <Badge tone="blue">
                                            {names.length} template{names.length > 1 && 's'}
                                        </Badge>
                                    </span>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Not used</span>
                                );
                            },
                        },
                        {
                            header: 'Flags',
                            className: 'hidden sm:table-cell',
                            cell: (f) => (
                                <div className="flex flex-wrap gap-1">
                                    {f.required && <Badge tone="blue">Required</Badge>}
                                    {f.searchable && <Badge>Searchable</Badge>}
                                    {!f.isActive && <Badge tone="red">Inactive</Badge>}
                                </div>
                            ),
                        },
                        editColumn(setEditing),
                    ]}
                />
            </Card>
            <EditorDialog
                editing={editing}
                noun="field"
                onClose={() => {
                    setEditing(null);
                }}
            >
                {(item) => (
                    <FieldForm
                        field={item}
                        nextOrder={nextSortOrder(fields)}
                        usedBy={item ? usedBy(item.key) : []}
                        onDone={() => {
                            setEditing(null);
                        }}
                    />
                )}
            </EditorDialog>
        </>
    );
}
