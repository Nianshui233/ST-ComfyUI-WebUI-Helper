import {
    buildAiPromptQuietPrompt,
    generateAiPromptWithAnthropic,
    generateAiPromptWithOpenAICompatible,
    sanitizeAiPromptOutput,
} from './ai-prompt-service.js';

const AI_PROMPT_RETRY_DELAYS = [450, 1200];

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
    function reportProgress(progress, phase, detail, startedAt, failed = false) {
        progress?.({
            detail,
            elapsedMs: Date.now() - startedAt,
            phase: failed ? 'error' : phase,
        });
    }

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

    function isTransientNetworkError(error) {
        const message = String(error?.message || error || '');
        return /failed to fetch|networkerror|network error|网络错误|fetch failed/i.test(message);
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function runWithTransientRetry(operation, label, { progress, startedAt } = {}) {
        let lastError;
        for (let attempt = 0; attempt <= AI_PROMPT_RETRY_DELAYS.length; attempt++) {
            try {
                return await operation(attempt + 1);
            } catch (error) {
                lastError = error;
                if (!isTransientNetworkError(error)) {
                    throw error;
                }
                if (attempt >= AI_PROMPT_RETRY_DELAYS.length) {
                    throw new Error(`${label} 网络请求失败，已重试 ${AI_PROMPT_RETRY_DELAYS.length} 次仍未成功：${error.message || error}`);
                }
                const delay = AI_PROMPT_RETRY_DELAYS[attempt];
                logger.warn(`[AI Gen] ${label} 遇到瞬时网络错误，${delay}ms 后重试 (${attempt + 1}/${AI_PROMPT_RETRY_DELAYS.length})`, error);
                reportProgress(progress, 'request', `网络请求失败，${delay}ms 后自动重试 (${attempt + 1}/${AI_PROMPT_RETRY_DELAYS.length})`, startedAt);
                await wait(delay);
            }
        }
        throw lastError;
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

    async function generateAiPromptForMessage(messageNode, { progress } = {}) {
        const startedAt = Date.now();
        reportProgress(progress, 'settings', '读取 AI/LLM 设置', startedAt);
        const settings = await getAiPromptSettings();
        if (!settings.enabled) {
            reportProgress(progress, 'settings', 'AI 绘图提示词功能未启用', startedAt, true);
            throw new Error('AI 绘图提示词功能未启用');
        }
        if (!isAiPromptEligibleMessage(messageNode)) {
            reportProgress(progress, 'context', '当前消息不适合生成绘图提示词', startedAt, true);
            throw new Error('当前消息不适合生成绘图提示词');
        }

        reportProgress(progress, 'context', '正在整理当前聊天上下文', startedAt);
        const { index } = getChatMessageByNode(messageNode);
        const messages = await buildAiPromptContext(index, settings.contextMessages);
        const quietPrompt = buildAiPromptQuietPrompt({
            instruction: settings.instruction,
            messages,
            targetIndex: index,
        });

        reportProgress(progress, 'request', `${getProviderLabel(settings)} 正在生成绘图提示词`, startedAt);
        const rawOutput = await runWithTransientRetry(
            () => generateAiPromptRawOutput(settings, quietPrompt),
            'AI 绘图提示词生成',
            { progress, startedAt },
        );
        reportProgress(progress, 'parse', '正在解析 LLM 输出', startedAt);
        const {
            rawText,
            reasoning,
            attempts,
        } = normalizeRawOutput(rawOutput);
        const prompt = sanitizeAiPromptOutput(rawText);

        if (!prompt) {
            reportProgress(progress, 'parse', 'LLM 没有返回可用的绘图提示词', startedAt, true);
            throw new Error('LLM 没有返回可用的绘图提示词');
        }

        reportProgress(progress, 'save', '正在写回当前聊天消息', startedAt);
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
        progress?.({
            detail: '绘图提示词已生成',
            elapsedMs: Date.now() - startedAt,
            phase: 'done',
        });
        return prompt;
    }

    return {
        generateAiPromptForMessage,
        generateAiPromptRawOutput,
    };
}
