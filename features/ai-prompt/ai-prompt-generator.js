import {
    buildAiPromptQuietPrompt,
    generateAiPromptWithAnthropic,
    generateAiPromptWithOpenAICompatible,
    sanitizeAiPromptOutput,
} from './ai-prompt-service.js';

export function createAiPromptGenerator({
    getAiPromptSettings,
    getAiPromptServiceDeps,
    generateQuietPrompt,
    buildAiPromptContext,
    getChatMessageByNode,
    isAiPromptEligibleMessage,
    saveAiPromptToMessage,
}) {
    async function generateAiPromptRawOutput(settings, quietPrompt) {
        if (settings.provider === 'openai_compatible') {
            return generateAiPromptWithOpenAICompatible(settings, quietPrompt, getAiPromptServiceDeps());
        }
        if (settings.provider === 'anthropic') {
            return generateAiPromptWithAnthropic(settings, quietPrompt, getAiPromptServiceDeps());
        }

        return generateQuietPrompt({
            quietPrompt,
            skipWIAN: true,
            responseLength: settings.responseLength,
            removeReasoning: true,
            trimToSentence: false,
        });
    }

    async function generateAiPromptForMessage(messageNode) {
        const settings = await getAiPromptSettings();
        if (!settings.enabled) {
            throw new Error('AI 绘图提示词功能未启用');
        }
        if (!isAiPromptEligibleMessage(messageNode)) {
            throw new Error('当前消息不适合生成绘图提示词');
        }

        const { index } = getChatMessageByNode(messageNode);
        const messages = await buildAiPromptContext(index, settings.contextMessages);
        const quietPrompt = buildAiPromptQuietPrompt({
            instruction: settings.instruction,
            messages,
            targetIndex: index,
        });

        const rawOutput = await generateAiPromptRawOutput(settings, quietPrompt);
        const prompt = sanitizeAiPromptOutput(rawOutput);

        if (!prompt) {
            throw new Error('LLM 没有返回可用的绘图提示词');
        }

        await saveAiPromptToMessage(messageNode, prompt, rawOutput);
        return prompt;
    }

    return {
        generateAiPromptForMessage,
        generateAiPromptRawOutput,
    };
}
