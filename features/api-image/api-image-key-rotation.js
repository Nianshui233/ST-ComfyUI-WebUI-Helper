import { STORAGE_KEY_API_IMAGE_API_KEYS } from '../core/runtime-config.js';

function sameProviderOrUnknown(itemProvider, provider) {
    return !itemProvider || !provider || itemProvider === provider;
}

function buildKeyId(name, key) {
    return `${name || 'current'}:${String(key || '').slice(0, 8)}:${String(key || '').slice(-6)}`;
}

export async function buildApiImageKeyCandidates({
    getValue,
    settings,
}) {
    const candidates = [];
    const seen = new Set();
    const addCandidate = (candidate) => {
        const key = String(candidate.key || '').trim();
        if (!key) return;
        const id = buildKeyId(candidate.name, key);
        if (seen.has(id)) return;
        seen.add(id);
        candidates.push({
            key,
            name: candidate.name || '当前输入',
            source: candidate.source || 'current',
            provider: candidate.provider || settings.provider,
            url: candidate.url || '',
            model: candidate.model || '',
        });
    };

    addCandidate({
        key: settings.apiKey,
        name: '当前输入',
        source: 'current',
        provider: settings.provider,
    });

    if (settings.useSavedKeys) {
        const stored = await getValue(STORAGE_KEY_API_IMAGE_API_KEYS, {});
        Object.entries(stored || {})
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([name, item]) => {
                if (!sameProviderOrUnknown(item?.provider, settings.provider)) return;
                addCandidate({
                    key: item?.key,
                    name,
                    source: 'saved',
                    provider: item?.provider,
                    url: item?.url,
                    model: item?.model,
                });
            });
    }

    if (candidates.length === 0) {
        candidates.push({
            key: '',
            name: '无 Key',
            source: 'empty',
            provider: settings.provider,
        });
    }

    const maxAttempts = Number.parseInt(settings.maxKeyAttempts, 10) || 0;
    return maxAttempts > 0 ? candidates.slice(0, maxAttempts) : candidates;
}

export function applyApiImageKeyCandidate(settings, candidate) {
    return {
        ...settings,
        apiKey: candidate.key || settings.apiKey,
        url: settings.url || candidate.url || '',
        model: settings.model || candidate.model || '',
        activeKeyName: candidate.name || '当前输入',
        activeKeySource: candidate.source || 'current',
    };
}
