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
    logger = console,
}) {
    function normalizeRawOutput(rawOutput) {
        if (rawOutput && typeof rawOutput === 'object') {
            return {
                rawText: String(rawOutput.text || ''),
                reasoning: String(rawOutput.reasoning || ''),
                attempts: rawOutput.attempts || 1,
                parsed: rawOutput.parsed,
            };
        }
        return {
            rawText: String(rawOutput || ''),
            reasoning: '',
            attempts: 1,
            parsed: null,
        };
    }

    function getProviderLabel(settings) {
        if (settings.provider === 'sillytavern') return 'SillyTavern LLM';
        if (settings.provider === 'anthropic') return `Anthropic / ${settings.apiModel || '(未选择模型)'}`;
        return `OpenAI兼容 / ${settings.apiModel || '(未选择模型)'}`;
    }

    function logAiPromptResult({ settings, messages, targetIndex, rawText, reasoning, prompt, attempts }) {
        logger.info('[AI Gen] AI 绘图提示词分析完成', {
            provider: getProviderLabel(settings),
            attempts,
            targetIndex,
            contextMessages: messages.length,
            thinkingMode: settings.thinkingMode,
            reasoning: reasoning || '该接口未返回独立推理/思考内容；下方原始输出为模型最终可见返回。',
            finalPrompt: prompt,
            rawOutput: rawText,
        });
    }

    async function generateAiPromptRawOutput(settings, quietPrompt) {
        if (settings.provider === 'openai_compatible') {
            return generateAiPromptWithOpenAICompatible(settings, quietPrompt, getAiPromptServiceDeps());
        }
        if (settings.provider === 'anthropic') {
            return generateAiPromptWithAnthropic(settings, quietPrompt, getAiPromptServiceDeps());
        }

        const text = await generateQuietPrompt({
            quietPrompt,
            skipWIAN: true,
            responseLength: settings.responseLength,
            removeReasoning: true,
            trimToSentence: false,
        });
        return { text, reasoning: '', attempts: 1 };
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
        const {
            rawText,
            reasoning,
            attempts,
        } = normalizeRawOutput(rawOutput);
        const prompt = sanitizeAiPromptOutput(rawText);

        if (!prompt) {
            throw new Error('LLM 没有返回可用的绘图提示词');
        }

        await saveAiPromptToMessage(messageNode, prompt, rawText);
        logAiPromptResult({
            settings,
            messages,
            targetIndex: index,
            rawText,
            reasoning,
            prompt,
            attempts,
        });
        return prompt;
    }

    return {
        generateAiPromptForMessage,
        generateAiPromptRawOutput,
    };
}
