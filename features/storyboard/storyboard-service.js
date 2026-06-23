import {
    generateAiPromptWithAnthropic,
    generateAiPromptWithOpenAICompatible,
} from '../ai-prompt/ai-prompt-service.js';
import { buildStoryboardQuietPrompt } from './storyboard-prompts.js';
import { parseStoryboardOutput } from './storyboard-parser.js';

function normalizeRawOutput(rawOutput) {
    if (rawOutput && typeof rawOutput === 'object') {
        return {
            rawText: String(rawOutput.text || ''),
            reasoning: String(rawOutput.reasoning || ''),
            attempts: rawOutput.attempts || 1,
        };
    }
    return {
        rawText: String(rawOutput || ''),
        reasoning: '',
        attempts: 1,
    };
}

function summarizePanels(storyboard) {
    return storyboard.panels
        .map(panel => `#${panel.index} ${panel.beat}`)
        .join('\n');
}

export function createStoryboardService({
    buildAiPromptContext,
    generateQuietPrompt,
    getAiPromptServiceDeps,
    getAiPromptSettings,
    getChatMessageByNode,
    isAiPromptEligibleMessage,
    saveStoryboardToMessage,
    logger = console,
}) {
    function getStoryboardResponseLength(settings, maxPanels) {
        const configured = Number.parseInt(settings.responseLength, 10) || 0;
        return Math.max(configured, 900 + maxPanels * 650);
    }

    async function generateRawStoryboard(settings, quietPrompt, { maxPanels }) {
        const requestSettings = {
            ...settings,
            responseLength: getStoryboardResponseLength(settings, maxPanels),
        };
        if (settings.provider === 'openai_compatible') {
            return generateAiPromptWithOpenAICompatible(requestSettings, quietPrompt, getAiPromptServiceDeps());
        }
        if (settings.provider === 'anthropic') {
            return generateAiPromptWithAnthropic(requestSettings, quietPrompt, getAiPromptServiceDeps());
        }

        const text = await generateQuietPrompt({
            quietPrompt,
            skipWIAN: true,
            responseLength: Math.max(1200, requestSettings.responseLength * 2),
            removeReasoning: true,
            trimToSentence: false,
        });
        return { text, reasoning: '', attempts: 1 };
    }

    async function generateStoryboardForMessage(messageNode, { maxPanels = 4 } = {}) {
        const settings = await getAiPromptSettings();
        if (!settings.enabled) {
            throw new Error('AI 绘图提示词功能未启用');
        }
        if (!isAiPromptEligibleMessage(messageNode)) {
            throw new Error('当前消息不适合生成连环画分镜');
        }

        const { index } = getChatMessageByNode(messageNode);
        const messages = await buildAiPromptContext(index, settings.contextMessages);
        const quietPrompt = buildStoryboardQuietPrompt({
            instruction: settings.instruction,
            messages,
            targetIndex: index,
            maxPanels,
        });

        const rawOutput = await generateRawStoryboard(settings, quietPrompt, { maxPanels });
        const { rawText, reasoning, attempts } = normalizeRawOutput(rawOutput);
        const storyboard = parseStoryboardOutput(rawText, { maxPanels });
        await saveStoryboardToMessage(messageNode, storyboard);

        logger.info('[AI Gen] 连环画分镜分析完成', {
            provider: settings.provider,
            model: settings.apiModel || 'SillyTavern',
            attempts,
            targetIndex: index,
            panels: storyboard.panels.length,
            panelBeats: summarizePanels(storyboard),
            continuity: storyboard.continuity,
            reasoning: reasoning || '该接口未返回独立推理/思考内容；下方原始输出为模型最终可见返回。',
            rawOutput: rawText,
        });

        return storyboard;
    }

    return {
        generateStoryboardForMessage,
    };
}
