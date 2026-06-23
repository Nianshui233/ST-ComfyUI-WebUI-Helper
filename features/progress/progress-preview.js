export async function captureComfyUIPreview(payload, blobToDataUrl) {
    const buffer = payload instanceof ArrayBuffer
        ? payload
        : await payload.arrayBuffer();
    if (buffer.byteLength <= 8) return '';

    const blob = new Blob([buffer.slice(8)]);
    return blobToDataUrl(blob);
}

export async function waitForPreviewDataUrl(getPreview, timeoutMs = 1200) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const preview = getPreview();
        if (preview) return preview;
        await new Promise(resolve => setTimeout(resolve, 80));
    }
    return getPreview();
}
