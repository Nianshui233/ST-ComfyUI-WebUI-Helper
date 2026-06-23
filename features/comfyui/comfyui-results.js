export function getImagesFromHistory(history, promptId) {
    const outputs = history[promptId]?.outputs;
    if (!outputs) {
        return [];
    }

    const images = [];

    for (const nodeOutput of Object.values(outputs)) {
        if (nodeOutput.images?.length) {
            images.push(...nodeOutput.images);
        }
        if (nodeOutput.ui?.images?.length) {
            images.push(...nodeOutput.ui.images);
        }
        if (nodeOutput.gifs?.length) {
            images.push(...nodeOutput.gifs);
        }
    }

    return images.filter(image => image?.filename);
}

export function summarizeHistoryEntry(history, promptId) {
    const entry = history?.[promptId];
    if (!entry) return null;

    const outputs = entry.outputs || {};
    return {
        completed: entry?.status?.completed ?? entry?.completed ?? null,
        status_str: entry?.status_str ?? null,
        messages: Array.isArray(entry?.status?.messages) ? entry.status.messages.slice(-5) : [],
        outputNodes: Object.entries(outputs).map(([nodeId, nodeOutput]) => ({
            nodeId,
            keys: Object.keys(nodeOutput || {}),
            images: nodeOutput?.images?.length || 0,
            uiImages: nodeOutput?.ui?.images?.length || 0,
            gifs: nodeOutput?.gifs?.length || 0,
        })),
    };
}

export function buildComfyViewUrl(baseUrl, image) {
    return `${baseUrl}/view?${new URLSearchParams({
        filename: image.filename,
        subfolder: image.subfolder || '',
        type: image.type || 'temp',
    })}`;
}

export function pickImageUrlFromList(images, baseUrl) {
    if (!Array.isArray(images) || images.length === 0) return null;
    const valid = images.filter(image => image?.filename);
    const preferred = valid.find(image => image.type === 'output') || valid[0];
    return preferred ? buildComfyViewUrl(baseUrl, preferred) : null;
}

export function findImageUrlInHistory(history, promptId, baseUrl, { silent = false, logger = console } = {}) {
    const outputs = history[promptId]?.outputs;
    if (!outputs) {
        if (!silent) {
            logger.warn('[AI Gen] 历史记录中无 outputs:', JSON.stringify(history[promptId]).substring(0, 500));
        }
        return null;
    }

    const imageUrl = pickImageUrlFromList(getImagesFromHistory(history, promptId), baseUrl);
    if (imageUrl) return imageUrl;

    if (!silent) {
        logger.warn('[AI Gen] 未在以下输出中找到图片:', Object.keys(outputs).map(id => ({ id, keys: Object.keys(outputs[id]) })));
    }
    return null;
}
