import {
    formatDecimal,
    safeJsonParse,
} from '../../lib/core/utils.js';
import { extractImageDataUrlsFromZip } from './api-image-zip.js';

const DEFAULT_ENDPOINTS = {
    openai_images: '/images/generations',
    openai_compatible_images: '/images/generations',
    gemini: '/models/%model%:generateContent',
    stability_core: '/v2beta/stable-image/generate/core',
    novelai: '/ai/generate-image',
    custom_json: '',
};

const PROVIDER_DEFAULTS = {
    openai_images: {
        url: 'https://api.openai.com/v1',
        model: 'gpt-image-1',
    },
    openai_compatible_images: {
        url: 'https://api.openai.com/v1',
        model: 'gpt-image-1',
    },
    gemini: {
        url: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-2.5-flash-image-preview',
    },
    stability_core: {
        url: 'https://api.stability.ai',
        model: 'stability-core',
    },
    novelai: {
        url: 'https://image.novelai.net',
        model: 'nai-diffusion-3',
    },
    custom_json: {
        url: '',
        model: '',
    },
};

export function getApiImageProviderDefaults(provider) {
    return PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.custom_json;
}

function normalizeBaseUrl(url) {
    return String(url || '').trim().replace(/\/+$/, '');
}

function joinUrl(baseUrl, endpoint) {
    const base = normalizeBaseUrl(baseUrl);
    const path = String(endpoint || '').trim();
    if (!base) return path;
    if (!path) return base;
    if (/^https?:\/\//i.test(path)) return path;
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function normalizeSize({ sizeMode, width, height, provider }) {
    if (sizeMode === 'square') return { width: 1024, height: 1024, openaiSize: '1024x1024', aspectRatio: '1:1' };
    if (sizeMode === 'portrait') return { width: 1024, height: 1536, openaiSize: '1024x1536', aspectRatio: '2:3' };
    if (sizeMode === 'landscape') return { width: 1536, height: 1024, openaiSize: '1536x1024', aspectRatio: '3:2' };
    if (sizeMode === 'panel') {
        const w = Number.parseInt(width, 10) || 1024;
        const h = Number.parseInt(height, 10) || 1024;
        return {
            width: w,
            height: h,
            openaiSize: `${w}x${h}`,
            aspectRatio: `${w}:${h}`,
        };
    }
    return {
        width: Number.parseInt(width, 10) || 1024,
        height: Number.parseInt(height, 10) || 1024,
        openaiSize: provider === 'openai_images' || provider === 'openai_compatible_images' ? 'auto' : undefined,
        aspectRatio: undefined,
    };
}

function parseHeaders(headersText) {
    if (!String(headersText || '').trim()) return {};
    const parsed = safeJsonParse(headersText, null, 'API 生图额外请求头');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('API 生图额外请求头必须是 JSON 对象');
    }
    return parsed;
}

function replaceTemplatePlaceholders(template, values) {
    return String(template || '')
        .replaceAll('%prompt_json%', JSON.stringify(values.prompt))
        .replaceAll('%negative_prompt_json%', JSON.stringify(values.negativePrompt))
        .replaceAll('%model_json%', JSON.stringify(values.model))
        .replaceAll('%width%', String(values.width))
        .replaceAll('%height%', String(values.height))
        .replaceAll('%batch_size%', String(values.batchSize))
        .replaceAll('%quality_json%', JSON.stringify(values.quality))
        .replaceAll('%output_format_json%', JSON.stringify(values.outputFormat));
}

function getPathValue(value, path) {
    if (!path) return undefined;
    return String(path)
        .split('.')
        .filter(Boolean)
        .reduce((current, key) => {
            if (current == null) return undefined;
            const index = Number.parseInt(key, 10);
            if (Array.isArray(current) && String(index) === key) return current[index];
            return current[key];
        }, value);
}

function inferMimeFromFormat(format) {
    if (format === 'jpg') return 'image/jpeg';
    if (format === 'jpeg') return 'image/jpeg';
    if (format === 'webp') return 'image/webp';
    return 'image/png';
}

function looksLikeBase64(text) {
    const value = String(text || '').trim();
    return value.length > 64 && /^[a-z0-9+/=\s]+$/i.test(value);
}

function normalizeImageValue(value, mimeType = 'image/png') {
    if (!value) return null;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^data:image\//i.test(trimmed)) return trimmed;
        if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('blob:')) return trimmed;
        if (looksLikeBase64(trimmed)) return `data:${mimeType};base64,${trimmed.replace(/\s+/g, '')}`;
    }
    if (value && typeof value === 'object') {
        return normalizeImageValue(
            value.b64_json || value.base64 || value.image || value.data || value.url,
            value.mime_type || value.mimeType || mimeType,
        );
    }
    return null;
}

function collectImagesDeep(value, images = []) {
    const normalized = normalizeImageValue(value);
    if (normalized) {
        images.push(normalized);
        return images;
    }
    if (Array.isArray(value)) {
        value.forEach(item => collectImagesDeep(item, images));
        return images;
    }
    if (value && typeof value === 'object') {
        Object.values(value).forEach(item => collectImagesDeep(item, images));
    }
    return images;
}

function parseJsonResponse(responseText, label) {
    const result = safeJsonParse(responseText, null, label);
    if (!result || typeof result !== 'object') {
        throw new Error(`${label} 返回了无效 JSON`);
    }
    return result;
}

function getNovelAiSize(size) {
    const width = Number.parseInt(size.width, 10) || 1024;
    const height = Number.parseInt(size.height, 10) || 1024;
    if (size.openaiSize === 'auto' || !width || !height) {
        return { width: 1024, height: 1024 };
    }
    return { width, height };
}

function getNovelAiOverrides(settings) {
    const text = String(settings.customBody || '').trim();
    if (!text) return {};
    const parsed = safeJsonParse(text, null, 'NovelAI 高级参数 JSON');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('NovelAI 高级参数必须是 JSON 对象');
    }
    return parsed;
}

function getOpenAIRequest(settings, prompt, size) {
    const endpoint = settings.endpoint || DEFAULT_ENDPOINTS[settings.provider];
    const body = {
        model: settings.model,
        prompt,
        n: settings.batchSize,
    };
    if (size.openaiSize) body.size = size.openaiSize;
    if (settings.quality && settings.quality !== 'auto') body.quality = settings.quality;
    if (settings.outputFormat) body.output_format = settings.outputFormat;

    return {
        method: 'POST',
        url: joinUrl(settings.url, endpoint),
        headers: {
            'Content-Type': 'application/json',
            ...settings.extraHeaders,
        },
        data: JSON.stringify(body),
    };
}

function parseOpenAIResponse(responseText, settings) {
    const result = parseJsonResponse(responseText, 'OpenAI Images');
    const data = Array.isArray(result.data) ? result.data : [];
    const mimeType = inferMimeFromFormat(settings.outputFormat);
    const images = data
        .map(item => normalizeImageValue(item.b64_json || item.url || item, mimeType))
        .filter(Boolean);
    if (images.length === 0) {
        throw new Error('OpenAI Images 没有返回可用图片');
    }
    return images;
}

function getGeminiRequest(settings, prompt) {
    const endpoint = settings.endpoint || DEFAULT_ENDPOINTS.gemini.replace('%model%', encodeURIComponent(settings.model));
    const url = joinUrl(settings.url, endpoint);
    const body = {
        contents: [{
            role: 'user',
            parts: [{ text: prompt }],
        }],
        generationConfig: {
            responseModalities: ['IMAGE'],
        },
    };

    return {
        method: 'POST',
        url: settings.apiKey ? `${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(settings.apiKey)}` : url,
        headers: {
            'Content-Type': 'application/json',
            ...settings.extraHeaders,
        },
        data: JSON.stringify(body),
        skipAuthHeader: true,
    };
}

function parseGeminiResponse(responseText) {
    const result = parseJsonResponse(responseText, 'Gemini Image');
    const parts = result.candidates?.flatMap(candidate => candidate.content?.parts || []) || [];
    const images = parts
        .map(part => normalizeImageValue(part.inlineData?.data || part.inline_data?.data, part.inlineData?.mimeType || part.inline_data?.mime_type || 'image/png'))
        .filter(Boolean);
    if (images.length === 0) {
        throw new Error('Gemini 没有返回可用图片');
    }
    return images;
}

function getStabilityRequest(settings, prompt, negativePrompt, size) {
    const endpoint = settings.endpoint || DEFAULT_ENDPOINTS.stability_core;
    const body = new FormData();
    body.append('prompt', prompt);
    body.append('output_format', settings.outputFormat || 'png');
    if (negativePrompt) body.append('negative_prompt', negativePrompt);
    if (size.aspectRatio) body.append('aspect_ratio', size.aspectRatio);

    return {
        method: 'POST',
        url: joinUrl(settings.url, endpoint),
        headers: {
            Accept: 'application/json',
            ...settings.extraHeaders,
        },
        data: body,
    };
}

function getNovelAiRequest(settings, prompt, negativePrompt, size) {
    const endpoint = settings.endpoint || DEFAULT_ENDPOINTS.novelai;
    const novelAiSize = getNovelAiSize(size);
    const overrides = getNovelAiOverrides(settings);
    const seed = Number.parseInt(overrides.seed, 10) || Math.floor(Math.random() * (4294967295 - 8)) + 1;
    const batchSize = Math.max(1, Math.min(8, Number.parseInt(settings.batchSize, 10) || 1));
    const parameters = {
        width: novelAiSize.width,
        height: novelAiSize.height,
        n_samples: batchSize,
        steps: 28,
        scale: 6,
        sampler: 'k_euler',
        noise_schedule: 'native',
        seed,
        negative_prompt: negativePrompt || '',
        qualityToggle: true,
        ucPreset: 2,
        sm: true,
        sm_dyn: false,
        dynamic_thresholding: false,
        uncond_scale: 1,
        cfg_rescale: 0,
        params_version: 1,
        ...overrides,
    };
    if (negativePrompt && !overrides.negative_prompt) {
        parameters.negative_prompt = negativePrompt;
    }

    const body = {
        input: prompt,
        model: settings.model || PROVIDER_DEFAULTS.novelai.model,
        action: overrides.action || 'generate',
        parameters,
    };

    delete body.parameters.action;

    return {
        method: 'POST',
        url: joinUrl(settings.url, endpoint),
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/x-zip-compressed, binary/octet-stream',
            Origin: 'https://novelai.net',
            Referer: 'https://novelai.net',
            ...settings.extraHeaders,
        },
        data: JSON.stringify(body),
        responseType: 'arraybuffer',
    };
}

function parseStabilityResponse(responseText, settings) {
    const result = parseJsonResponse(responseText, 'Stability AI');
    const mimeType = inferMimeFromFormat(settings.outputFormat);
    const images = [
        normalizeImageValue(result.image, mimeType),
        normalizeImageValue(result.data?.[0]?.b64_json, mimeType),
        ...collectImagesDeep(result.artifacts || []),
    ].filter(Boolean);
    if (images.length === 0) {
        throw new Error('Stability AI 没有返回可用图片');
    }
    return images;
}

async function parseNovelAiResponse(response, settings) {
    const images = await extractImageDataUrlsFromZip(response.response);
    if (images.length === 0) {
        throw new Error('NovelAI 没有返回可用图片');
    }
    return images.slice(0, Math.max(1, formatDecimal(settings.batchSize, 1)));
}

function getCustomJsonRequest(settings, prompt, negativePrompt, size) {
    const endpoint = settings.endpoint || DEFAULT_ENDPOINTS.custom_json;
    if (!endpoint && !settings.url) {
        throw new Error('自定义 JSON API 需要填写 Base URL 或 Endpoint');
    }
    const bodyText = replaceTemplatePlaceholders(settings.customBody, {
        prompt,
        negativePrompt,
        model: settings.model,
        width: size.width,
        height: size.height,
        batchSize: settings.batchSize,
        quality: settings.quality,
        outputFormat: settings.outputFormat,
    });
    const body = safeJsonParse(bodyText, null, 'API 生图自定义请求体');
    if (!body || typeof body !== 'object') {
        throw new Error('API 生图自定义请求体不是有效 JSON');
    }

    return {
        method: 'POST',
        url: joinUrl(settings.url, endpoint),
        headers: {
            'Content-Type': 'application/json',
            ...settings.extraHeaders,
        },
        data: JSON.stringify(body),
    };
}

function parseCustomJsonResponse(responseText, settings) {
    const result = parseJsonResponse(responseText, '自定义 API 生图');
    const explicit = normalizeImageValue(getPathValue(result, settings.responsePath), inferMimeFromFormat(settings.outputFormat));
    const images = explicit ? [explicit] : collectImagesDeep(result);
    if (images.length === 0) {
        throw new Error('自定义 API 没有解析到可用图片，请填写响应图片字段路径');
    }
    return images;
}

export function normalizeApiImageSettings(rawSettings) {
    const provider = rawSettings.comfyui_api_image_provider || rawSettings.provider || 'openai_images';
    const defaults = getApiImageProviderDefaults(provider);
    const storedUrl = rawSettings.comfyui_api_image_url || rawSettings.url || '';
    const storedModel = rawSettings.comfyui_api_image_model || rawSettings.model || '';
    const batchSize = Math.max(1, Number.parseInt(rawSettings.comfyui_api_image_batch_size ?? rawSettings.batchSize, 10) || 1);
    return {
        provider,
        url: normalizeBaseUrl(storedUrl === PROVIDER_DEFAULTS.openai_images.url && provider !== 'openai_images' && provider !== 'openai_compatible_images' ? defaults.url : (storedUrl || defaults.url)),
        endpoint: String(rawSettings.comfyui_api_image_endpoint || rawSettings.endpoint || '').trim(),
        apiKey: String(rawSettings.comfyui_api_image_api_key || rawSettings.apiKey || '').trim(),
        model: String(storedModel === PROVIDER_DEFAULTS.openai_images.model && provider !== 'openai_images' && provider !== 'openai_compatible_images' ? defaults.model : (storedModel || defaults.model || '')).trim(),
        quality: String(rawSettings.comfyui_api_image_quality || rawSettings.quality || 'auto').trim(),
        outputFormat: String(rawSettings.comfyui_api_image_output_format || rawSettings.outputFormat || 'png').trim(),
        sizeMode: String(rawSettings.comfyui_api_image_size_mode || rawSettings.sizeMode || 'auto').trim(),
        batchSize,
        timeout: Math.max(1, Number.parseInt(rawSettings.comfyui_api_image_timeout ?? rawSettings.timeout, 10) || 300000),
        softTimeoutMs: Math.max(0, Number.parseInt(rawSettings.comfyui_api_image_soft_timeout_ms ?? rawSettings.softTimeoutMs, 10) || 0),
        useSavedKeys: rawSettings.comfyui_api_image_use_saved_keys ?? rawSettings.useSavedKeys ?? true,
        retryOnFailure: rawSettings.comfyui_api_image_retry_on_failure ?? rawSettings.retryOnFailure ?? true,
        maxKeyAttempts: Math.max(0, Number.parseInt(rawSettings.comfyui_api_image_max_key_attempts ?? rawSettings.maxKeyAttempts, 10) || 0),
        negativePrompt: String(rawSettings.comfyui_api_image_negative_prompt || rawSettings.negativePrompt || '').trim(),
        customHeaders: String(rawSettings.comfyui_api_image_custom_headers || rawSettings.customHeaders || '').trim(),
        customBody: String(rawSettings.comfyui_api_image_custom_body || rawSettings.customBody || '').trim(),
        responsePath: String(rawSettings.comfyui_api_image_response_path || rawSettings.responsePath || '').trim(),
    };
}

export function buildApiImageRequest(settings, prompt, { width, height }) {
    const size = normalizeSize({
        sizeMode: settings.sizeMode,
        width,
        height,
        provider: settings.provider,
    });
    settings.extraHeaders = parseHeaders(settings.customHeaders);

    if (!settings.url && settings.provider !== 'custom_json') {
        throw new Error('API 生图 Base URL 未配置');
    }
    if (!settings.model && settings.provider !== 'custom_json') {
        throw new Error('API 生图模型未配置');
    }

    const promptText = String(prompt || '').trim();
    const negativePrompt = settings.negativePrompt;
    let request;

    if (settings.provider === 'gemini') {
        request = getGeminiRequest(settings, promptText);
    } else if (settings.provider === 'stability_core') {
        request = getStabilityRequest(settings, promptText, negativePrompt, size);
    } else if (settings.provider === 'novelai') {
        request = getNovelAiRequest(settings, promptText, negativePrompt, size);
    } else if (settings.provider === 'custom_json') {
        request = getCustomJsonRequest(settings, promptText, negativePrompt, size);
    } else {
        request = getOpenAIRequest(settings, promptText, size);
    }

    if (settings.apiKey && !request.skipAuthHeader) {
        request.headers.Authorization = `Bearer ${settings.apiKey}`;
    }
    request.timeout = settings.timeout;

    return {
        ...request,
        size,
        requestSummary: {
            provider: settings.provider,
            model: settings.model,
            size: size.openaiSize || `${size.width}x${size.height}`,
            quality: settings.quality,
            batchSize: settings.batchSize,
            timeout: settings.timeout,
            promptLength: promptText.length,
            negativePromptLength: negativePrompt.length,
        },
    };
}

export function parseApiImageResponse(responseText, settings) {
    const provider = settings.provider;
    let images;
    if (provider === 'gemini') images = parseGeminiResponse(responseText, settings);
    else if (provider === 'stability_core') images = parseStabilityResponse(responseText, settings);
    else if (provider === 'custom_json') images = parseCustomJsonResponse(responseText, settings);
    else images = parseOpenAIResponse(responseText, settings);

    return images.slice(0, Math.max(1, formatDecimal(settings.batchSize, 1)));
}

export async function parseApiImageResponsePayload(response, settings) {
    if (settings.provider === 'novelai') {
        return parseNovelAiResponse(response, settings);
    }
    return parseApiImageResponse(response.responseText, settings);
}
