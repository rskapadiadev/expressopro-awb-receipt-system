import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { paperKey, printSettingsOf } from '@shared/layout';
import {
    PRINT_MODE_LABELS,
    PRINT_MODES,
    type PrintMode,
    type PrintSettings,
    sheetGrid,
} from '@shared/print';
import type { Receipt } from '@shared/types';
import { Printer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ReceiptRenderer } from '@/components/receipt/ReceiptRenderer';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/form';
import { receiptContext } from '@/lib/paper';
import { printQuery } from '@/lib/queries';

const route = getRouteApi('/authed/print');

// Remembered per browser, because the printer attached to each computer decides the mode.
const DEVICE_KEY = 'awb.printMode';
type DeviceChoice = 'template' | PrintMode;

function readChoice(): DeviceChoice {
    try {
        const saved = localStorage.getItem(DEVICE_KEY);
        return PRINT_MODES.find((m) => m === saved) ?? 'template';
    } catch {
        return 'template';
    }
}

function saveChoice(choice: DeviceChoice) {
    try {
        localStorage.setItem(DEVICE_KEY, choice);
    } catch {
        // Storage blocked (private mode): the choice just isn't remembered.
    }
}

interface PrintJob {
    key: string;
    settings: PrintSettings;
    receipts: Receipt[];
}

// One print job can only use one page size, so receipts are grouped by what the page will be.
function buildJobs(receipts: Receipt[], choice: DeviceChoice): PrintJob[] {
    const jobs = new Map<string, PrintJob>();
    for (const r of receipts) {
        const base = printSettingsOf(r.layout);
        const settings =
            choice === 'template'
                ? base
                : {
                      ...base,
                      mode: choice,
                  };
        const key =
            settings.mode === 'sheet'
                ? `${paperKey(r.layout)} on ${settings.sheetWidthMm}×${settings.sheetHeightMm} mm sheets`
                : paperKey(r.layout);
        const job = jobs.get(key) ?? {
            key,
            settings,
            receipts: [],
        };
        job.receipts.push(r);
        jobs.set(key, job);
    }
    return [...jobs.values()];
}

const chunk = <T,>(items: T[], size: number) =>
    Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
        items.slice(i * size, (i + 1) * size),
    );

interface PrintItem {
    key: string;
    receipt: Receipt;
    copy?: string;
}

// Each receipt prints once per copy its template defines (e.g. Shipper / Consignee / Office).
const expandCopies = (receipts: Receipt[]): PrintItem[] =>
    receipts.flatMap((receipt) =>
        (receipt.layout.copies?.length ? receipt.layout.copies : [undefined]).map((copy, i) => ({
            key: `${receipt.id}-${i}`,
            receipt,
            copy,
        })),
    );

const renderItem = ({ key, receipt, copy }: PrintItem, className?: string) => (
    <ReceiptRenderer
        key={key}
        layout={receipt.layout}
        {...receiptContext(receipt, copy)}
        className={className}
    />
);

export function PrintPage() {
    const { ids } = route.useSearch();
    const idList = useMemo(() => ids.split(',').map(Number).filter(Boolean), [ids]);
    const { data = [], isLoading, error } = useQuery(printQuery(idList));
    const [choice, setChoice] = useState<DeviceChoice>(readChoice);
    const jobs = useMemo(() => buildJobs(data, choice), [data, choice]);
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const job = jobs.find((j) => j.key === activeKey) ?? jobs[0];
    const autoPrinted = useRef(false);

    useEffect(() => {
        // Auto-open the print dialog once, only when there's a single job; let barcodes render first.
        if (autoPrinted.current || jobs.length !== 1) {
            return;
        }
        autoPrinted.current = true;
        const timer = setTimeout(() => {
            window.print();
        }, 300);
        return () => {
            clearTimeout(timer);
        };
    }, [jobs]);

    if (isLoading) {
        return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
    }
    if (error || !job) {
        return <p className="p-6 text-sm text-destructive">No printable receipts found.</p>;
    }

    const layout = job.receipts[0]?.layout ?? data[0]?.layout;
    const items = expandCopies(job.receipts);
    const copiesNote = items.length > job.receipts.length ? ` (${items.length} copies)` : '';
    const { settings } = job;
    const isSheet = settings.mode === 'sheet' && layout;
    const grid = layout ? sheetGrid(layout, settings) : null;
    const page = isSheet
        ? `${settings.sheetWidthMm}mm ${settings.sheetHeightMm}mm`
        : `${layout?.widthMm ?? 0}mm ${layout?.heightMm ?? 0}mm`;

    return (
        <>
            <style>{`@page { size: ${page}; margin: 0; }`}</style>
            <div className="no-print sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur">
                <Select
                    aria-label="Print as"
                    className="h-9 w-auto"
                    value={choice}
                    onChange={(e) => {
                        const next = e.target.value as DeviceChoice;
                        setChoice(next);
                        saveChoice(next);
                        setActiveKey(null);
                    }}
                >
                    <option value="template">Use template setting</option>
                    {PRINT_MODES.map((m) => (
                        <option key={m} value={m}>
                            {PRINT_MODE_LABELS[m]}
                        </option>
                    ))}
                </Select>
                <span className="text-sm text-muted-foreground">
                    {job.receipts.length} receipt{job.receipts.length === 1 ? '' : 's'}
                    {copiesNote} · {job.key}
                    {isSheet &&
                        grid &&
                        ` · ${grid.perSheet} per sheet (${Math.ceil(items.length / grid.perSheet)} sheets)`}
                </span>
                {jobs.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1">
                        <span className="text-sm text-warning">
                            {jobs.length} page sizes, print each group:
                        </span>
                        {jobs.map((j) => (
                            <Button
                                key={j.key}
                                size="sm"
                                variant={j.key === job.key ? 'default' : 'outline'}
                                onClick={() => {
                                    setActiveKey(j.key);
                                }}
                            >
                                {j.key} ({j.receipts.length})
                            </Button>
                        ))}
                    </div>
                )}
                <Button
                    size="sm"
                    className="ml-auto"
                    onClick={() => {
                        window.print();
                    }}
                >
                    <Printer className="size-4" /> Print
                </Button>
            </div>
            <div className="bg-grid flex min-h-dvh flex-col items-center gap-6 bg-muted/60 py-8 print:block print:min-h-0 print:bg-white print:p-0">
                {isSheet && grid
                    ? chunk(items, grid.perSheet).map((sheet, i) => (
                          <div
                              key={i}
                              className="grid content-start overflow-hidden bg-white shadow print:break-after-page print:shadow-none"
                              style={{
                                  width: `${settings.sheetWidthMm}mm`,
                                  height: `${settings.sheetHeightMm}mm`,
                                  padding: `${settings.marginMm}mm`,
                                  gap: `${settings.gapMm}mm`,
                                  gridTemplateColumns: `repeat(${grid.cols}, ${layout.widthMm}mm)`,
                                  gridAutoRows: `${layout.heightMm}mm`,
                              }}
                          >
                              {sheet.map((item) => renderItem(item))}
                          </div>
                      ))
                    : items.map((item) =>
                          renderItem(item, 'shadow print:break-after-page print:shadow-none'),
                      )}
            </div>
        </>
    );
}
