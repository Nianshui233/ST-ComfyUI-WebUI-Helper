import { looksLikeDanbooruRule } from './ai-prompt-rules.js';

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
    const isDanbooruRule = looksLikeDanbooruRule(instruction);
    const finalInstruction = isDanbooruRule
        ? '请严格按上方规则输出最终 Danbooru 标签块。不要输出解释、推理、剧情说明或自然语言绘图描述。'
        : '请输出最终英文绘图提示词。';

    return `${instruction}

下面是最近的 SillyTavern RP 聊天内容。请只根据这些内容选择最适合生成单张图的静态画面。

最近聊天：
${transcript || '(empty)'}

目标消息：#${targetIndex}${target ? ` ${target.role} (${target.name})` : ''}

${finalInstruction}`;
}
