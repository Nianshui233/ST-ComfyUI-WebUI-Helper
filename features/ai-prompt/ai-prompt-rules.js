export function getAiPromptMaxTokens(settings, defaults) {
    const visibleBudget = Math.max(64, Math.ceil(settings.responseLength * 1.4));
    if (settings.thinkingMode === 'enabled') {
        const thinkingReserve = Math.min(32000, Math.max(1024, parseInt(settings.thinkingBudget, 10) || defaults.aiPromptThinkingBudget));
        return Math.max(visibleBudget, visibleBudget + thinkingReserve);
    }
    return visibleBudget;
}
