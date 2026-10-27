// Downscales an uploaded image in the browser so templates stay small enough for D1 rows.
export async function readImage(file: File, maxPx: number, type: 'image/jpeg' | 'image/png') {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas is not supported in this browser');
    }
    if (type === 'image/jpeg') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL(type, 0.75);
}
