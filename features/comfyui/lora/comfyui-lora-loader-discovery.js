export function inputAcceptsComfyType(inputDef, type) {
    if (!Array.isArray(inputDef)) return false;
    if (inputDef[0] === type) return true;
    if (Array.isArray(inputDef[0]) && inputDef[0].includes(type)) return true;
    return false;
}

export function findInputKey(required, preferredKeys, acceptedType = null) {
    for (const key of preferredKeys) {
        if (required[key] && (!acceptedType || inputAcceptsComfyType(required[key], acceptedType))) return key;
    }

    return Object.keys(required).find(key => {
        const lower = key.toLowerCase();
        const matchesName = preferredKeys.some(preferred => lower.includes(preferred.toLowerCase()));
        return matchesName && (!acceptedType || inputAcceptsComfyType(required[key], acceptedType));
    }) || null;
}

export function findNumericInputKey(required, preferredKeys) {
    for (const key of preferredKeys) {
        if (required[key]) return key;
    }

    return Object.keys(required).find(key => {
        const lower = key.toLowerCase();
        return preferredKeys.some(preferred => lower.includes(preferred.toLowerCase()));
    }) || null;
}

export function getComfyUILoraLoaders(objectInfo) {
    const preferredNodeTypes = [
        'LoraLoader',
        'LoraLoaderModelOnly',
        'LoRALoader',
        'Lora Loader',
        'LoRA_Loader_Z',
        'LoraLoaderBypass',
        'LoraLoaderBypassModelOnly',
    ];
    const nodeEntries = Object.entries(objectInfo || {}).sort(([a], [b]) => {
        const ai = preferredNodeTypes.indexOf(a);
        const bi = preferredNodeTypes.indexOf(b);
        if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        return a.localeCompare(b);
    });

    const candidates = [];

    for (const [nodeType, nodeInfo] of nodeEntries) {
        const required = nodeInfo?.input?.required || {};
        const output = nodeInfo?.output || [];
        const nodeName = nodeType.toLowerCase();
        const loraNameInput = findInputKey(required, ['lora_name', 'loraname', 'lora']);
        const modelInput = findInputKey(required, ['model'], 'MODEL');
        const clipInput = findInputKey(required, ['clip'], 'CLIP');
        const modelOutputIndex = output.indexOf('MODEL');
        const clipOutputIndex = output.indexOf('CLIP');

        if (!loraNameInput || !modelInput || modelOutputIndex < 0) continue;
        if (!nodeName.includes('lora') && !String(loraNameInput).toLowerCase().includes('lora')) continue;

        candidates.push({
            type: nodeType,
            nodeInfo,
            inputs: {
                loraName: loraNameInput,
                model: modelInput,
                clip: clipInput,
                modelStrength: findNumericInputKey(required, ['strength_model', 'model_strength', 'strength']),
                clipStrength: findNumericInputKey(required, ['strength_clip', 'clip_strength', 'strength']),
            },
            outputs: {
                model: modelOutputIndex,
                clip: clipOutputIndex,
            },
        });
    }

    return candidates;
}

export function findComfyUILoraLoader(objectInfo, options = {}) {
    const candidates = getComfyUILoraLoaders(objectInfo);
    if (options.preferModelOnly) {
        return candidates.find(loader => !loader.inputs.clip) || candidates[0] || null;
    }

    return candidates.find(loader => loader.inputs.clip && loader.outputs.clip >= 0) || candidates[0] || null;
}

export function chooseLoraLoader(availableLoraLoaders, { clipProvider, mode }) {
    const wantsModelOnly = mode === 'model_only';
    const wantsModelClip = mode === 'model_clip';
    const modelOnlyLoader = availableLoraLoaders.find(loader => !loader.inputs.clip);
    const modelClipLoader = availableLoraLoaders.find(loader => loader.inputs.clip && loader.outputs.clip >= 0);

    if (wantsModelOnly) return modelOnlyLoader || availableLoraLoaders[0] || null;
    if (wantsModelClip && clipProvider) return modelClipLoader || modelOnlyLoader || availableLoraLoaders[0] || null;
    if (wantsModelClip) return modelOnlyLoader || availableLoraLoaders[0] || null;

    return modelOnlyLoader || (clipProvider ? modelClipLoader : null) || availableLoraLoaders[0] || null;
}
