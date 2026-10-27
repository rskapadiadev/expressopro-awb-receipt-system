import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

export function Barcode({ value }: { value: string }) {
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
        });
        // Stretch the generated bars to fill whatever box the template gives them.
        svg.setAttribute(
            'viewBox',
            `0 0 ${svg.getAttribute('width') ?? '0'} ${svg.getAttribute('height') ?? '0'}`,
        );
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
    }, [value]);

    return <svg ref={ref} preserveAspectRatio="none" className="block h-full w-full" />;
}
