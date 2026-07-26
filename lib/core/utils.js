import { BlobURLTracker } from '../browser/blob-url-tracker.js';

export function createStorageAccessors(getValue, setValue) {
    return {
        async getStoredValues(entries) {
            const values = await Promise.all(
                entries.map(([key, defaultValue]) => getValue(key, defaultValue))
            );

            return Object.fromEntries(
                entries.map(([key], index) => [key, values[index]])
            );
        },

        async setStoredValues(entries) {
            await Promise.all(
                entries
                    .filter(([, value]) => value !== undefined)
                    .map(([key, value]) => setValue(key, value))
            );
        },
    };
}

export function createClientId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `ai-gen-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('Blob 转 DataURL 失败'));
        reader.readAsDataURL(blob);
    });
}

export function downloadJsonFile(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = BlobURLTracker.create(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    BlobURLTracker.revoke(url);
}

export function safeJsonParse(text, fallback, label = 'JSON') {
    try {
        return JSON.parse(text);
    } catch (error) {
        console.warn(`[AI Gen] ${label} 解析失败:`, error);
        return fallback;
    }
}

export function normalizeNumber(value, fallback = 1) {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : fallback;
}

export function formatDecimal(value, fallback = 1) {
    return Number.parseFloat(normalizeNumber(value, fallback).toFixed(3));
}

export function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function decodeHTML(str) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = String(str || '');
    return textarea.value;
}

const HTML_TEXT_BLOCK_TAGS = new Set([
    'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DD', 'DETAILS', 'DIV', 'DL', 'DT',
    'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4',
    'H5', 'H6', 'HEADER', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE', 'SECTION', 'SUMMARY',
    'TABLE', 'TBODY', 'TFOOT', 'THEAD', 'TR', 'UL',
]);
const HTML_TEXT_IGNORED_TAGS = new Set(['NOSCRIPT', 'SCRIPT', 'STYLE', 'TEMPLATE']);

export function getStructuredTextFromDomNode(node) {
    if (!node) return '';
    if (node.nodeType === 3 || node.nodeType === 4) {
        return String(node.nodeValue ?? node.textContent ?? '');
    }
    if (![1, 9, 11].includes(node.nodeType)) return '';

    const tagName = String(node.tagName || '').toUpperCase();
    if (HTML_TEXT_IGNORED_TAGS.has(tagName)) return '';
    if (tagName === 'BR' || tagName === 'HR') return '\n';

    const content = Array.from(node.childNodes || [])
        .map(child => getStructuredTextFromDomNode(child))
        .join('');
    if (tagName === 'TD' || tagName === 'TH') return `${content}\t`;
    return HTML_TEXT_BLOCK_TAGS.has(tagName) ? `\n${content}\n` : content;
}

export function stripHtmlToText(value) {
    const div = document.createElement('div');
    div.innerHTML = String(value || '');
    return getStructuredTextFromDomNode(div).trim();
}

export function makeCancelledError() {
    const error = new Error('生成已取消');
    error.cancelled = true;
    return error;
}

export function simpleHash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = (h * 0x01000193) | 0;
    }
    return 'comfy-id-' + (h >>> 0).toString(36);
}

export function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
