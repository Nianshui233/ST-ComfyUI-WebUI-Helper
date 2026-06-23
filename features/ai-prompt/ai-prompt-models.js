import {
    fetchOpenAICompatibleModels,
    generateAiPromptWithAnthropic,
    generateAiPromptWithOpenAICompatible,
    sanitizeAiPromptOutput,
} from './ai-prompt-service.js';
import { escapeHTML } from '../../lib/core/utils.js';

export function createAiPromptModelManager({
    getAiPromptSettings,
    getAiPromptServiceDeps,
    showToast,
}) {
    async function testAiPromptOpenAICompatibleApi() {
        const settings = await getAiPromptSettings();
        if (!['openai_compatible', 'anthropic'].includes(settings.provider)) {
            showToast('info', '当前使用 SillyTavern LLM，无需测试外部 API');
            return;
        }

        const output = settings.provider === 'anthropic'
            ? await generateAiPromptWithAnthropic(
                { ...settings, responseLength: 80 },
                'Return exactly this short image prompt in English: medium shot eye-level portrait in soft natural light.',
                getAiPromptServiceDeps(),
            )
            : await generateAiPromptWithOpenAICompatible(
                { ...settings, responseLength: 80 },
                'Return exactly this short image prompt in English: medium shot eye-level portrait in soft natural light.',
                getAiPromptServiceDeps(),
            );
        showToast('success', `AI 接口可用: ${sanitizeAiPromptOutput(output).slice(0, 80) || 'OK'}`);
    }

    function populateAiPromptModelSelect(models, selectedModel = '') {
        const select = document.getElementById('comfyui-ai-prompt-api-model-select');
        if (!select) return;

        const current = String(selectedModel || document.getElementById('comfyui-ai-prompt-api-model')?.value || '').trim();
        select.innerHTML = `<option value="">${current ? `当前手动模型: ${escapeHTML(current)}` : '手动输入模型名...'}</option>`;
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            select.appendChild(option);
        });

        select.value = current && models.includes(current) ? current : '';
    }

    async function detectAiPromptModels({ silent = false } = {}) {
        const settings = await getAiPromptSettings();
        if (settings.provider === 'anthropic') {
            populateAiPromptModelSelect([], settings.apiModel);
            if (!silent) showToast('info', 'Anthropic 原生 API 请手动填写模型名');
            return [];
        }
        if (settings.provider !== 'openai_compatible') {
            if (!silent) showToast('info', '当前使用 SillyTavern LLM，无需检测外部模型');
            return [];
        }

        const models = await fetchOpenAICompatibleModels(settings, getAiPromptServiceDeps());
        populateAiPromptModelSelect(models, settings.apiModel);

        const modelInput = document.getElementById('comfyui-ai-prompt-api-model');
        if (modelInput && !modelInput.value.trim() && models[0]) {
            modelInput.value = models[0];
            modelInput.dispatchEvent(new Event('input', { bubbles: true }));
            const select = document.getElementById('comfyui-ai-prompt-api-model-select');
            if (select) select.value = models[0];
        }

        if (!silent) showToast('success', `已检测到 ${models.length} 个模型`);
        return models;
    }

    return {
        detectAiPromptModels,
        populateAiPromptModelSelect,
        testAiPromptOpenAICompatibleApi,
    };
}
