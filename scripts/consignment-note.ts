import type { LayoutElement, TemplateLayout } from '../shared/layout';
import { el } from './layout-helpers';

type Box = [x: number, y: number, w: number, h: number];

// A bordered table cell, vertically centred, as used throughout the paper consignment note.
const cell = (
    id: string,
    kind: LayoutElement['kind'],
    box: Box,
    extra: Partial<LayoutElement> = {},
) =>
    el(id, kind, box, {
        border: ['top', 'right', 'bottom', 'left'],
        padding: 0.8,
        valign: 'middle',
        align: 'center',
        fontSize: 7,
        showLabel: false,
        ...extra,
    });

const label = (id: string, text: string, box: Box, extra: Partial<LayoutElement> = {}) =>
    cell(id, 'text', box, {
        text,
        bold: true,
        ...extra,
    });

const value = (key: string, box: Box, extra: Partial<LayoutElement> = {}) =>
    cell(key, 'field', box, {
        fieldKey: key,
        fontSize: 8,
        bold: true,
        ...extra,
    });

const mark = (id: string, fieldKey: string, matchValue: string, box: Box) =>
    cell(id, 'mark', box, {
        fieldKey,
        matchValue,
        text: '✓',
        fontSize: 9,
        bold: true,
    });

// Recreates the client's paper C-Note: 200 × 92 mm, three copies, three per A4 sheet.
export const consignmentNote: {
    name: string;
    layout: TemplateLayout;
} = {
    name: 'Consignment Note (3 copies)',
    layout: {
        widthMm: 200,
        heightMm: 92,
        copies: ['SHIPPER COPY', 'CONSIGNEE COPY', 'OFFICE COPY'],
        print: {
            mode: 'sheet',
            sheetWidthMm: 210,
            sheetHeightMm: 297,
            marginMm: 5,
            gapMm: 3,
        },
        elements: [
            // Header row
            cell('logo', 'logo', [0, 0, 68, 14], { padding: 1.5 }),
            label('date_l', 'DATE', [68, 0, 16, 5]),
            cell('date', 'date', [68, 5, 16, 9], {
                text: 'DD-MM-YY',
                fontSize: 8,
                bold: true,
            }),
            label('track_l', 'TRACKING LINK', [84, 0, 66, 5]),
            label('track', 'Pacificexp.net', [84, 5, 66, 9], { fontSize: 8 }),
            label('cn_l', 'CONSIGNMENT NO', [150, 0, 42, 5]),
            cell('awb', 'awb', [150, 5, 42, 9], {
                fontSize: 10,
                bold: true,
            }),
            // Customer / service / receipt row
            label('cust_l', 'CUSTOMER CODE', [0, 14, 34, 12]),
            value('customer_code', [34, 14, 34, 12]),
            label('service', 'FAST TRACK SERVICE', [68, 14, 16, 12], { fontSize: 6 }),
            cell('barcode', 'barcode', [84, 14, 66, 12], { padding: 1.5 }),
            label('rno_l', 'RECEIPT NO.', [150, 14, 42, 5]),
            value('receipt_no', [150, 19, 42, 7]),
            // Sender / receiver
            label('sender_l', 'SENDER :', [0, 26, 18, 7]),
            value('sender_name', [18, 26, 66, 7]),
            label('receiver_l', 'RECEIVER :', [84, 26, 16, 7]),
            value('receiver_name', [100, 26, 92, 7]),
            label('scity_l', 'CITY:', [0, 33, 50, 7]),
            value('origin', [50, 33, 34, 7]),
            label('mob_l', 'MOB :', [84, 33, 16, 7]),
            value('receiver_phone', [100, 33, 30, 7]),
            label('rcity_l', 'CITY:', [130, 33, 30, 7]),
            value('destination', [160, 33, 32, 7]),
            // Branch / transport / payment
            label('branch_l', 'BRANCH CODE', [0, 40, 84, 6]),
            label('mot_l', 'M.O.T', [84, 40, 16, 6]),
            label('cash_l', 'CASH', [100, 40, 30, 6]),
            label('credit_l', 'CREDIT', [130, 40, 30, 6]),
            label('blank_1', '', [160, 40, 32, 6]),
            cell('branch', 'branch', [0, 46, 84, 12], {
                text: 'code',
                fontSize: 9,
                bold: true,
            }),
            label('air_l', 'AIR :', [84, 46, 11, 6], { align: 'right' }),
            mark('air', 'mot', 'AIR', [95, 46, 5, 6]),
            label('srf_l', 'SRF :', [84, 52, 11, 6], { align: 'right' }),
            mark('srf', 'mot', 'SRF', [95, 52, 5, 6]),
            value('amount', [100, 46, 30, 12]),
            mark('credit', 'payment_mode', 'Credit', [130, 46, 30, 12]),
            label('blank_2', '', [160, 46, 32, 12]),
            // Declaration / remarks / receiver sign-off
            label('decl_l', 'DECLARATION', [0, 58, 84, 5]),
            label(
                'decl',
                'This CNote is issued for an un-insured shipment, if the consignor requires insurance, this C Note must get a stamp or label - "Insured". This non-negotiable consignment note is subject to standard conditions of carriage. The carrier specifically limits its maximum liability up to one time shipping charges for documents & two times for non-documents. Subject to SURAT jurisdiction only.',
                [0, 63, 84, 21],
                {
                    fontSize: 5.5,
                    valign: 'top',
                },
            ),
            label('remarks_l', 'REMARKS:', [84, 58, 16, 9]),
            value('remarks', [100, 58, 92, 9], { align: 'left' }),
            label('recv_l', 'RECEIVER', [84, 67, 16, 5]),
            label('recv', '', [100, 67, 92, 5]),
            label('rdate_l', 'DATE :', [84, 72, 16, 12]),
            label('rdate', '', [100, 72, 92, 12]),
            // Footer and the vertical copy name down the right edge
            label('footer', 'track on:- https://expressopro.in/', [0, 84, 192, 8], { fontSize: 7 }),
            label('copy', '{copy}', [192, 0, 8, 92], {
                orientation: 'stacked',
                fontSize: 6.5,
            }),
        ],
    },
};
