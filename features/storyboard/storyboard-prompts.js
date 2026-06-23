export function buildStoryboardQuietPrompt({
    instruction = '',
    messages,
    targetIndex,
    maxPanels = 4,
}) {
    const transcript = messages
        .map(item => `#${item.index} ${item.role} (${item.name}): ${item.text}`)
        .join('\n\n');
    const target = messages.find(item => item.index === targetIndex);

    const promptRules = String(instruction || '').trim();

    return `你是 SillyTavern RP 场景的连环画分镜规划器。请只根据最近聊天内容，把当前剧情拆成 1-${maxPanels} 个适合单张图片生成的连续静态关键帧。

硬规则：
1. 只输出一个 JSON 对象，不要 Markdown，不要解释，不要代码块。
2. panels 数量必须为 1-${maxPanels}，按剧情时间顺序排列。
3. 每格必须是可生成的单张静态画面，动作有递进但不得写镜头运动、时间流逝、心理活动或画外解释。
4. 保持同一场景内角色外观、服装、地点、光照、画风连续；不要新增剧情外角色、道具、伤痕、服装或特效。
5. panels[].prompt 必须是英文最终绘图提示词，并遵守下方“当前绘图分析规则”的风格与格式。
6. “当前绘图分析规则”只约束 panels[].prompt 的内容格式，不得改变本次必须返回 JSON 的外层格式。
7. 如果规则要求 [IMG_GEN]，panels[].prompt 只写 [IMG_GEN] 块内部内容，不要包含 [IMG_GEN] 或 [/IMG_GEN] 标签。
8. JSON 字符串必须正确转义引号；prompt 内需要换行时使用 \\n 转义，不要在字符串中写未转义的裸换行。

当前绘图分析规则：
${promptRules || '使用清晰、具体、适合生图的英文自然语言提示词。'}

JSON 结构：
{
  "title": "简短中文标题",
  "continuity": {
    "characters": "角色外观、服装、身份锚点，用中文简述",
    "scene": "地点、时间、光照、画风锚点，用中文简述",
    "style": "画面媒介与风格锚点，用中文简述"
  },
  "panels": [
    {
      "index": 1,
      "beat": "这一格捕捉的剧情瞬间，中文短句",
      "prompt": "English image prompt for this single static frame.",
      "negative_prompt": "",
      "continuity_note": "这一格需要保持的一致性提示，中文短句"
    }
  ]
}

最近聊天：
${transcript || '(empty)'}

目标消息：#${targetIndex}${target ? ` ${target.role} (${target.name})` : ''}

只返回 JSON。`;
}
