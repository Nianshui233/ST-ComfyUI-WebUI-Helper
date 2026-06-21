const STORAGE_PREFIX = 'st-comfyui-webui-helper:';

export function GM_addStyle(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    return style;
}

export async function GM_getValue(key, defaultValue = undefined) {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return defaultValue;
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

export async function GM_setValue(key, value) {
    if (value === undefined || value === null) {
        localStorage.removeItem(STORAGE_PREFIX + key);
        return;
    }
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

function isDirectConnectionEnabled() {
    try {
        return localStorage.getItem(STORAGE_PREFIX + 'comfyui_direct_connection') === 'true';
    } catch {
        return false;
    }
}

export function proxiedUrl(url) {
    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return url;
        }
        if (parsed.origin === window.location.origin) {
            return url;
        }
        // 直连模式：跳过 SillyTavern /proxy，直接请求后端（需后端开启 CORS）。
        // 这样生图时的轮询/请求不再经过 ST 后端，避免刷屏与 socket 监听器告警。
        if (isDirectConnectionEnabled()) {
            return url;
        }
        return `/proxy/${encodeURIComponent(parsed.href)}`;
    } catch {
        return url;
    }
}

export function GM_xmlhttpRequest(options) {
    const method = options.method || 'GET';
    const headers = options.headers || {};
    const fetchOptions = { method, headers };
    if (options.data !== undefined) {
        fetchOptions.body = options.data;
    }

    const controller = new AbortController();
    fetchOptions.signal = controller.signal;
    let timeoutId = null;
    if (options.timeout) {
        timeoutId = setTimeout(() => controller.abort(), options.timeout);
    }

    const requestUrl = proxiedUrl(options.url);
    console.debug('[AI Gen] HTTP request', method, options.url, requestUrl);

    fetch(requestUrl, fetchOptions)
        .then(async response => {
            if (timeoutId) clearTimeout(timeoutId);
            let responseText = '';
            let responseData = null;
            if (options.responseType === 'blob') {
                responseData = await response.blob();
            } else if (options.responseType === 'arraybuffer') {
                responseData = await response.arrayBuffer();
            } else {
                responseText = await response.text();
                responseData = responseText;
            }
            const responseHeaders = Array.from(response.headers.entries()).map(([k, v]) => `${k}: ${v}`).join('\r\n');
            const payload = {
                status: response.status,
                statusText: response.statusText,
                response: responseData,
                responseText,
                responseHeaders,
                finalUrl: response.url,
            };
            options.onload?.(payload);
        })
        .catch(error => {
            if (timeoutId) clearTimeout(timeoutId);
            console.error('[AI Gen] HTTP request failed', method, options.url, requestUrl, error);
            if (error?.name === 'AbortError') {
                options.ontimeout?.({ error, details: 'Request timed out' });
            } else {
                options.onerror?.({ error, details: error?.message || String(error) });
            }
        });
}
