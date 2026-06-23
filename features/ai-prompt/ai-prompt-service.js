export {
    generateAiPromptWithAnthropic,
} from './ai-prompt-anthropic.js';
export {
    fetchOpenAICompatibleModels,
    generateAiPromptWithOpenAICompatible,
} from './ai-prompt-openai-compatible.js';
export {
    sanitizeAiPromptOutput,
} from './ai-prompt-output.js';

export function buildAiPromptQuietPrompt({ instruction, messages, targetIndex }) {
    const transcript = messages
        .map(item => `#${item.index} ${item.role} (${item.name}): ${item.text}`)
        .join('\n\n');
    const target = messages.find(item => item.index === targetIndex);
    const finalInstruction = '请严格遵守上方绘图分析规则，只返回最终绘图提示词内容；如果规则要求 [IMG_GEN]，只返回完整 [IMG_GEN] 块。不要解释、不要输出推理、不要总结剧情。';

    return `${instruction}

下面是最近的 SillyTavern RP 聊天内容。请只根据这些内容选择最适合生成单张图的静态画面。

最近聊天：
${transcript || '(empty)'}

目标消息：#${targetIndex}${target ? ` ${target.role} (${target.name})` : ''}

${finalInstruction}`;
}
