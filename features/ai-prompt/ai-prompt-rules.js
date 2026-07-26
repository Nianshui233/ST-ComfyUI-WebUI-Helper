export const AI_PROMPT_OUTPUT_CAPACITY_FLOOR = 4096;

export function normalizeAiPromptOutputCapacity(value, defaults) {
    const configured = Number.parseInt(value, 10);
    const fallback = Number.parseInt(defaults?.aiPromptResponseLength, 10) || AI_PROMPT_OUTPUT_CAPACITY_FLOOR;
    return Math.max(
        AI_PROMPT_OUTPUT_CAPACITY_FLOOR,
        Number.isFinite(configured) && configured > 0 ? configured : fallback,
    );
}

export function getAiPromptMaxTokens(settings, defaults) {
    const visibleBudget = Math.max(64, Number.parseInt(settings.responseLength, 10) || 0);
    if (settings.thinkingMode === 'enabled') {
        const thinkingReserve = Math.min(32000, Math.max(1024, parseInt(settings.thinkingBudget, 10) || defaults.aiPromptThinkingBudget));
        return Math.max(visibleBudget, visibleBudget + thinkingReserve);
    }
    return visibleBudget;
}
