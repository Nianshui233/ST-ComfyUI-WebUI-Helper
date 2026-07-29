export function getImagesFromHistory(history, promptId) {
    return getMediaFromHistory(history, promptId);
}

function inferMediaType(item, source = '') {
    const name = String(item?.filename || item?.name || '').toLowerCase();
    if (source === 'videos' || /\.(mp4|webm|mov|mkv|avi)$/i.test(name)) return 'video';
    return 'image';
}

export function getMediaFromHistory(history, promptId) {
    const outputs = history[promptId]?.outputs;
    if (!outputs) {
        return [];
    }

    const media = [];

    for (const nodeOutput of Object.values(outputs)) {
        for (const source of ['images', 'gifs', 'videos']) {
            if (nodeOutput[source]?.length) {
                media.push(...nodeOutput[source].map(item => ({ ...item, mediaType: inferMediaType(item, source) })));
            }
            if (nodeOutput.ui?.[source]?.length) {
                media.push(...nodeOutput.ui[source].map(item => ({ ...item, mediaType: inferMediaType(item, source) })));
            }
        }
    }

    return media.filter(item => item?.filename);
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
            videos: nodeOutput?.videos?.length || 0,
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
    return pickMediaFromList(images, baseUrl)?.mediaUrl || null;
}

export function pickMediaFromList(items, baseUrl) {
    if (!Array.isArray(items) || items.length === 0) return null;
    const valid = items.filter(item => item?.filename);
    const preferred = valid.find(item => item.type === 'output') || valid[0];
    if (!preferred) return null;
    return {
        mediaUrl: buildComfyViewUrl(baseUrl, preferred),
        mediaType: preferred.mediaType || inferMediaType(preferred),
        fileName: preferred.filename,
    };
}

export function findImageUrlInHistory(history, promptId, baseUrl, { silent = false, logger = console } = {}) {
    return findMediaInHistory(history, promptId, baseUrl, { silent, logger })?.mediaUrl || null;
}

export function findMediaInHistory(history, promptId, baseUrl, { silent = false, logger = console } = {}) {
    const outputs = history[promptId]?.outputs;
    if (!outputs) {
        if (!silent) {
            logger.warn('[AI Gen] 历史记录中无 outputs:', JSON.stringify(history[promptId]).substring(0, 500));
        }
        return null;
    }

    const media = pickMediaFromList(getMediaFromHistory(history, promptId), baseUrl);
    if (media) return media;

    if (!silent) {
        logger.warn('[AI Gen] 未在以下输出中找到图片:', Object.keys(outputs).map(id => ({ id, keys: Object.keys(outputs[id]) })));
    }
    return null;
}
