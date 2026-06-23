import { formatDecimal, normalizeNumber } from '../../../lib/core/utils.js';

export function getComfyUILoraFolder(name) {
    const normalized = String(name || '').replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);
    return parts.length > 1 ? parts[0] : '根目录';
}

export function normalizeComfyUILoraItem(item) {
    if (!item || typeof item !== 'object') return null;
    const name = String(item.name || '').trim();
    if (!name) return null;
    const triggerWords = Array.isArray(item.triggerWords)
        ? item.triggerWords.join(', ')
        : String(item.triggerWords || item.triggers || '').trim();

    const fallbackWeight = normalizeNumber(item.weight, 1);
    return {
        name,
        modelWeight: formatDecimal(item.modelWeight, fallbackWeight),
        clipWeight: formatDecimal(item.clipWeight, fallbackWeight),
        triggerWords,
        autoAppendTriggers: item.autoAppendTriggers !== false,
        enabled: item.enabled !== false,
    };
}

export function normalizeComfyUILoraItems(items) {
    if (!Array.isArray(items)) return [];
    const seen = new Set();
    const normalized = [];

    items.forEach(item => {
        const lora = normalizeComfyUILoraItem(item);
        if (!lora || seen.has(lora.name)) return;
        seen.add(lora.name);
        normalized.push(lora);
    });

    return normalized;
}

export function parseTriggerWords(triggerWords) {
    return String(triggerWords || '')
        .split(/[,，\n]/)
        .map(word => word.trim())
        .filter(Boolean);
}

export function getComfyUILoraTriggerPrompt(loras) {
    const words = [];
    const seen = new Set();
    loras
        .filter(lora => lora.enabled !== false && lora.autoAppendTriggers !== false)
        .flatMap(lora => parseTriggerWords(lora.triggerWords))
        .forEach(word => {
            const key = word.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            words.push(word);
        });

    return words.join(', ');
}
