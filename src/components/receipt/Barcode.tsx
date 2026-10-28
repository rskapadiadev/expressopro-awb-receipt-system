import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

interface BarcodeProps {
    value: string;
    color: string;
}

export function Barcode({ value, color }: BarcodeProps) {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const svg = ref.current;
        if (!svg || !value) {
            return;
        }
        JsBarcode(svg, value, {
            format: 'CODE128',
            displayValue: false,
            margin: 0,
            height: 60,
            lineColor: color,
            background: 'transparent',
        });
        // Stretch the generated bars to fill whatever box the template gives them.
        // JsBarcode writes sizes like "268px"; viewBox only accepts plain numbers.
        const size = (attr: string) => parseFloat(svg.getAttribute(attr) ?? '0');
        svg.setAttribute('viewBox', `0 0 ${size('width')} ${size('height')}`);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
    }, [value, color]);

    return <svg ref={ref} preserveAspectRatio="none" className="block h-full w-full" />;
}
