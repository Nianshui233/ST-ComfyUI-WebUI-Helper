export function createObjectInfoCache({ makeRequest, safeJsonParse }) {
    let cache = { url: '', data: null, timestamp: 0 };

    return async function getCachedObjectInfo(url, ttl = 30000) {
        const now = Date.now();
        if (cache.data && cache.url === url && now - cache.timestamp < ttl) {
            return cache.data;
        }

        const response = await makeRequest({ method: 'GET', url: `${url}/object_info` });
        const parsed = safeJsonParse(response.responseText, null, 'object_info');
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('ComfyUI /object_info returned invalid data');
        }

        cache = { url, data: parsed, timestamp: now };
        return cache.data;
    };
}
