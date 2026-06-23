import { createExportableStorageKeys } from '../settings/settings-backup.js';

export const BUTTON_ID = 'comfyui-launcher-button';
export const PANEL_ID = 'comfyui-panel';
export const POLLING_TIMEOUT_MS = 3600000;
export const POLLING_INTERVAL_MS = 2000;
export const GENERATE_COOLDOWN = 2000;

export const STORAGE_KEY_IMAGES = 'comfyui_generated_images';
export const STORAGE_KEY_WORKFLOWS = 'comfyui_saved_workflows';
export const STORAGE_KEY_MODE = 'generation_mode';
export const STORAGE_KEY_HELPER_ENABLED = 'comfyui_helper_enabled';
export const STORAGE_KEY_PROMPT_PRESETS = 'comfyui_prompt_presets';
export const STORAGE_KEY_AI_PROMPT_RULE_PRESETS = 'comfyui_ai_prompt_rule_presets';
export const STORAGE_KEY_AI_PROMPT_PROVIDER_PRESETS = 'comfyui_ai_prompt_provider_presets';
export const STORAGE_KEY_AI_PROMPT_API_KEYS = 'comfyui_ai_prompt_api_keys';
export const STORAGE_KEY_API_IMAGE_API_KEYS = 'comfyui_api_image_api_keys';
export const STORAGE_KEY_PANEL_ACTIVE_TAB = 'comfyui_panel_active_tab';
export const STORAGE_KEY_AI_PROMPT_LAST_API_KEY = 'comfyui_ai_prompt_last_api_key';
export const STORAGE_KEY_AI_PROMPT_LAST_PROVIDER_PRESET = 'comfyui_ai_prompt_last_provider_preset';
export const STORAGE_KEY_API_IMAGE_LAST_API_KEY = 'comfyui_api_image_last_api_key';
export const STORAGE_KEY_COMFYUI_LORA_PRESETS = 'comfyui_lora_presets';
export const STORAGE_KEY_LAST_COMFYUI_WORKFLOW = 'comfyui_last_submitted_workflow';
export const STORAGE_KEY_LAST_LORA_REPORT = 'comfyui_last_lora_injection_report';

export const MODES = {
    COMFYUI: 'comfyui',
    WEBUI: 'webui',
    API: 'api',
};

export const DEFAULT_AI_PROMPT_INSTRUCTION = `你是 SillyTavern RP 场景的绘图提示词提取器，只负责根据最近聊天内容生成一段适合 FLUX/SD 的英文绘图提示词。

硬规则：
1. 只描绘本轮回复或最近上下文中已经呈现的可见静态画面，不补充剧情外的新角色、道具、伤痕、服装、环境或特效。
2. 输出必须是英文自然语言句子，禁止 Markdown、项目符号、编号、表格、键值对、逗号标签串和解释。
3. 不要使用 masterpiece, best quality, ultra-detailed, 8k, HDR, perfect anatomy 等空泛质量词。
4. 不写声音、气味、触觉、心理活动、角色动机、世界观解释、镜头运动或时间流逝。
5. 若画面内必须出现文字，用 text "..." 描述载体、位置、颜色、排版关系和文字角色；除 text 引号内必要原文外，其余仍用英文。
6. 常规人物/风景控制在 70-180 英文词；复杂信息图或多宫格可到 180-280 英文词。

输出结构：
第一行必须包含景别和视角，例如 close-up eye-level / medium shot three-quarter view / wide shot high-angle。
主体按视觉重要性描述，最多 3 个主体；每个主体单独成句，写清姿态、位置、年龄观感、外貌、表情、发型、服装材质与细节、手部/道具、受光。
最后一句必须描述环境，按场所、前景、中景、背景、天气/空气状态、主光源、色温、反射、阴影组织。

风格自适应：
从聊天语境推断画风并写成可见媒介特征。现代日常偏 realistic lens rendering, natural light, candid phone-photo feel；高张力场面偏 cinematic color contrast, directional key light, rim light；动漫设定偏 clean line art, clear color blocks, simplified shadows；古典/奇幻偏 thick paint, canvas texture, visible brushstrokes；东方水墨偏 ink density, blank space, feathered edges。

只输出最终绘图提示词本身，不要输出 [IMG_GEN] 标签，不要解释。`;

export const DEFAULT_SETTINGS = {
    helperEnabled: true,
    mode: MODES.COMFYUI,
    url: 'http://127.0.0.1:8188',
    webuiUrl: 'http://127.0.0.1:7860',
    apiImageProvider: 'openai_images',
    apiImageUrl: 'https://api.openai.com/v1',
    apiImageEndpoint: '',
    apiImageApiKey: '',
    apiImageModel: 'gpt-image-1',
    apiImageQuality: 'auto',
    apiImageOutputFormat: 'png',
    apiImageSizeMode: 'auto',
    apiImageBatchSize: 1,
    apiImageTimeout: 300000,
    apiImageSoftTimeoutMs: 60000,
    apiImageUseSavedKeys: true,
    apiImageRetryOnFailure: true,
    apiImageMaxKeyAttempts: 0,
    apiImageNegativePrompt: '',
    apiImageCustomHeaders: '',
    apiImageCustomBody: `{
  "model": %model_json%,
  "prompt": %prompt_json%,
  "negative_prompt": %negative_prompt_json%,
  "width": %width%,
  "height": %height%,
  "n": %batch_size%,
  "response_format": "b64_json"
}`,
    apiImageResponsePath: '',
    workflow: '',
    startTag: '开始生成',
    endTag: '结束生成',
    genWidth: 512,
    genHeight: 768,
    displayWidth: 400,
    displayHeight: 0,
    autoGenerate: false,
    model: '',
    unetModel: '',
    webuiModel: '',
    selectedLoras: [],
    sampler: 'euler',
    scheduler: 'normal',
    steps: 20,
    cfg: 7.0,
    positivePrompt: '',
    negativePrompt: '',
    webuiSampler: 'Euler a',
    webuiScheduler: 'Automatic',
    denoisingStrength: 0.7,
    enableHires: false,
    hiresUpscaler: 'Latent',
    hiresSteps: 0,
    hiresUpscale: 2.0,
    hiresDenoising: 0.5,
    seed: -1,
    seedLocked: false,
    img2imgEnable: false,
    img2imgDenoising: 0.75,
    enableComparison: true,
    hideButtons: false,
    loraAutoAppendTriggers: true,
    loraStrictInjection: true,
    loraSaveDebugWorkflow: true,
    loraInjectionMode: 'model_only',
    aiPromptEnabled: true,
    aiPromptShowButtons: true,
    aiPromptAuto: false,
    aiPromptAutoGenerateImage: false,
    aiPromptContextMessages: 6,
    aiPromptResponseLength: 350,
    aiPromptInstruction: DEFAULT_AI_PROMPT_INSTRUCTION,
    aiPromptProvider: 'sillytavern',
    aiPromptApiUrl: '',
    aiPromptApiKey: '',
    aiPromptApiModel: '',
    aiPromptAutoDetectModels: true,
    aiPromptApiTemperature: 0.4,
    aiPromptApiTimeout: 60000,
    aiPromptThinkingMode: 'default',
    aiPromptThinkingStrategy: 'auto',
    aiPromptThinkingEffort: 'medium',
    aiPromptThinkingBudget: 2048,
    storyboardEnabled: false,
};

export const EXPORTABLE_STORAGE_KEYS = createExportableStorageKeys({
    mode: STORAGE_KEY_MODE,
    helperEnabled: STORAGE_KEY_HELPER_ENABLED,
    workflows: STORAGE_KEY_WORKFLOWS,
    promptPresets: STORAGE_KEY_PROMPT_PRESETS,
    aiPromptRulePresets: STORAGE_KEY_AI_PROMPT_RULE_PRESETS,
    aiPromptProviderPresets: STORAGE_KEY_AI_PROMPT_PROVIDER_PRESETS,
    comfyLoraPresets: STORAGE_KEY_COMFYUI_LORA_PRESETS,
});
