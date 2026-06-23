import { createApiImageKeyManager } from './api-image-key-manager.js';
import { getApiImageProviderDefaults } from './api-image-providers.js';

const NOVELAI_DEFAULT_PARAMS = `{
  "steps": 28,
  "scale": 6,
  "sampler": "k_euler",
  "noise_schedule": "native",
  "ucPreset": 2,
  "qualityToggle": true,
  "sm": true,
  "sm_dyn": false,
  "cfg_rescale": 0,
  "uncond_scale": 1
}`;

export function createApiImagePanelController({
    inputs,
    buttons,
    getValue,
    setValue,
    saveSettings,
    testApiImageGeneration,
    showToast,
    logger = console,
}) {
    function applyProviderDefaults({ force = false } = {}) {
        const provider = inputs.apiImageProvider?.value || 'openai_images';
        const defaults = getApiImageProviderDefaults(provider);
        if (inputs.apiImageUrl && (force || !inputs.apiImageUrl.value.trim())) {
            inputs.apiImageUrl.value = defaults.url || '';
        }
        if (inputs.apiImageModel && (force || !inputs.apiImageModel.value.trim())) {
            inputs.apiImageModel.value = defaults.model || '';
        }
        const customBodyText = inputs.apiImageCustomBody?.value || '';
        const hasTemplatePlaceholders = /%[a-z_]+%/i.test(customBodyText);
        if (provider === 'novelai' && inputs.apiImageCustomBody && (force || !customBodyText.trim() || hasTemplatePlaceholders)) {
            inputs.apiImageCustomBody.value = NOVELAI_DEFAULT_PARAMS;
        }
        updateCustomSectionVisibility();
    }

    function updateCustomSectionVisibility() {
        const provider = inputs.apiImageProvider?.value || '';
        const showCustom = provider === 'custom_json';
        const showNovelAiAdvanced = provider === 'novelai';
        document.querySelectorAll('.api-custom-json-section').forEach(section => {
            section.style.display = (showCustom || showNovelAiAdvanced) ? '' : 'none';
        });
        const title = document.getElementById('comfyui-api-image-custom-title');
        const responsePathLabel = document.getElementById('comfyui-api-image-response-path-label');
        const customBodyLabel = document.getElementById('comfyui-api-image-custom-body-label');
        const customHint = document.getElementById('comfyui-api-image-custom-hint');
        if (title) title.textContent = showNovelAiAdvanced ? 'NovelAI 高级参数' : '自定义 JSON API';
        if (responsePathLabel) responsePathLabel.textContent = showNovelAiAdvanced ? '响应图片字段路径（NovelAI 不需要）' : '响应图片字段路径';
        if (customBodyLabel) customBodyLabel.textContent = showNovelAiAdvanced ? 'NovelAI parameters 覆盖 JSON' : '请求体模板 JSON';
        if (customHint) {
            customHint.innerHTML = showNovelAiAdvanced
                ? '这里填写的 JSON 会合并进 NovelAI <code>parameters</code>，可覆盖 <code>steps</code>、<code>scale</code>、<code>sampler</code>、<code>noise_schedule</code>、<code>ucPreset</code>、<code>qualityToggle</code>、<code>sm</code>、<code>sm_dyn</code>、<code>seed</code> 等字段；提示词仍来自聊天消息下方的绘画提示词块。'
                : '可用占位符：<code>%prompt_json%</code>、<code>%negative_prompt_json%</code>、<code>%model_json%</code>、<code>%width%</code>、<code>%height%</code>、<code>%batch_size%</code>、<code>%quality_json%</code>、<code>%output_format_json%</code>。';
        }
        if (inputs.apiImageEndpoint) {
            inputs.apiImageEndpoint.placeholder = showNovelAiAdvanced
                ? '留空使用 /ai/generate-image'
                : showCustom
                ? '例如 /v1/images/generations 或完整 URL'
                : '留空使用服务商默认路径';
        }
    }

    async function testApi() {
        if (!buttons.apiImageTest) return;
        const originalText = buttons.apiImageTest.textContent;
        buttons.apiImageTest.disabled = true;
        buttons.apiImageTest.textContent = '测试中...';
        try {
            await saveSettings(inputs);
            const imageUrl = await testApiImageGeneration();
            if (!imageUrl) throw new Error('API 生图测试没有返回图片');
            showToast('success', 'API 生图接口可用，已成功解析图片');
        } catch (error) {
            logger.error('[AI Gen] API 生图测试失败:', error);
            showToast('error', error.message || String(error));
        } finally {
            buttons.apiImageTest.disabled = false;
            buttons.apiImageTest.textContent = originalText;
        }
    }

    function init() {
        updateCustomSectionVisibility();
        inputs.apiImageProvider?.addEventListener('change', () => {
            applyProviderDefaults({ force: true });
            inputs.apiImageUrl?.dispatchEvent(new Event('input', { bubbles: true }));
            inputs.apiImageModel?.dispatchEvent(new Event('input', { bubbles: true }));
        });
        buttons.apiImageTest?.addEventListener('click', testApi);

        createApiImageKeyManager({
            inputs,
            getValue,
            setValue,
            saveSettings,
            showToast,
        }).loadPresets();
    }

    return {
        applyProviderDefaults,
        init,
        updateCustomSectionVisibility,
    };
}
