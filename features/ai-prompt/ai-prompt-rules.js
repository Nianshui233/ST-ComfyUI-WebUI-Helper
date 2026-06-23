export function looksLikeDanbooruRule(text) {
    const source = String(text || '').toLowerCase();
    return (
        source.includes('danbooru') ||
        source.includes('1girl') ||
        source.includes('1boy') ||
        source.includes('rating') ||
        source.includes('tag')
    ) && (
        source.includes('img_gen') ||
        source.includes('break') ||
        source.includes('general / sensitive / questionable / explicit') ||
        source.includes('masterpiece, best quality')
    );
}

export function getAiPromptMaxTokens(settings, defaults) {
    const base = Math.max(64, Math.ceil(settings.responseLength * 1.4));
    const visibleBudget = looksLikeDanbooruRule(settings.instruction)
        ? Math.max(base, 4096)
        : base;
    if (settings.thinkingMode === 'enabled') {
        const thinkingReserve = Math.min(32000, Math.max(1024, parseInt(settings.thinkingBudget, 10) || defaults.aiPromptThinkingBudget));
        return Math.max(visibleBudget, visibleBudget + thinkingReserve);
    }
    return visibleBudget;
}
