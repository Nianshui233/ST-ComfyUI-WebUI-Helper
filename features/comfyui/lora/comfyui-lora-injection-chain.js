import { getInputLink } from './comfyui-lora-workflow-graph.js';

export const DEFAULT_LORA_INJECTION_MODE = 'auto';

export function normalizeLoraInjectionMode(mode, fallback = DEFAULT_LORA_INJECTION_MODE) {
    const normalized = String(mode || '').trim().toLowerCase();
    return ['model_only', 'model_clip', 'auto'].includes(normalized)
        ? normalized
        : fallback;
}

export function createLoraInjectionReport(selectedLoras, options = {}) {
    const requestedMode = options.injectionMode || options.defaultInjectionMode || DEFAULT_LORA_INJECTION_MODE;
    return {
        ok: true,
        strategy: 'none',
        requestedInjectionMode: requestedMode,
        injectionMode: normalizeLoraInjectionMode(requestedMode, options.defaultInjectionMode),
        loraCount: selectedLoras?.length || 0,
        insertedNodeIds: [],
        cleanedInjectedNodeIds: [],
        loaderTypes: [],
        effectiveInjectionMode: null,
        chainCount: 0,
        samplerTargets: [],
        clipTargets: [],
        warnings: [],
        errors: [],
    };
}

export function setLoraReportLoaderMode(report, loraLoader) {
    if (!loraLoader) return;
    report.effectiveInjectionMode = loraLoader.inputs.clip ? 'model_clip' : 'model_only';
}

function buildLoraNodeInputs(loraLoader, lora, modelProvider, clipProvider) {
    const inputs = {
        [loraLoader.inputs.loraName]: lora.name,
        [loraLoader.inputs.model]: [modelProvider.id, modelProvider.index],
    };

    if (loraLoader.inputs.clip && clipProvider) {
        inputs[loraLoader.inputs.clip] = [clipProvider.id, clipProvider.index];
    }

    if (loraLoader.inputs.modelStrength) {
        inputs[loraLoader.inputs.modelStrength] = lora.modelWeight;
    }

    if (loraLoader.inputs.clipStrength && loraLoader.inputs.clipStrength !== loraLoader.inputs.modelStrength) {
        inputs[loraLoader.inputs.clipStrength] = lora.clipWeight;
    }

    return inputs;
}

export function appendLoraChain(workflow, selectedLoras, loraLoader, modelProvider, clipProvider, maxIdRef, report) {
    let lastModelProvider = modelProvider;
    let lastClipProvider = clipProvider;

    for (const lora of selectedLoras) {
        const newLoraNodeId = (++maxIdRef.value).toString();
        workflow[newLoraNodeId] = {
            inputs: buildLoraNodeInputs(loraLoader, lora, lastModelProvider, lastClipProvider),
            class_type: loraLoader.type,
            _meta: {
                title: `Injected LoRA: ${lora.name}`,
            },
        };

        report.insertedNodeIds.push(newLoraNodeId);
        lastModelProvider = { id: newLoraNodeId, index: loraLoader.outputs.model };
        if (loraLoader.inputs.clip && loraLoader.outputs.clip >= 0) {
            lastClipProvider = { id: newLoraNodeId, index: loraLoader.outputs.clip };
        }
    }

    report.chainCount += 1;
    report.loaderTypes.push(loraLoader.type);
    return { modelProvider: lastModelProvider, clipProvider: lastClipProvider };
}

export function buildModelClipLinkKey(modelProvider, clipProvider) {
    return `${modelProvider?.id}:${modelProvider?.index}|${clipProvider?.id ?? 'none'}:${clipProvider?.index ?? -1}`;
}

export function validateLoraInjection(workflow, report) {
    if (report.loraCount === 0) return report;

    const samplerMisses = report.samplerTargets.filter(target => {
        const modelLink = getInputLink(workflow, target.samplerId, target.inputKey || 'model');
        return !modelLink || String(modelLink[0]) !== String(target.finalModelProvider.id);
    });

    if (samplerMisses.length > 0) {
        report.errors.push(`采样器未接到LoRA链: ${samplerMisses.map(item => item.samplerId).join(', ')}`);
    }

    const clipMisses = report.clipTargets.filter(target => {
        const clipLink = getInputLink(workflow, target.nodeId, target.inputKey || 'clip');
        return !clipLink || String(clipLink[0]) !== String(target.finalClipProvider.id);
    });

    if (clipMisses.length > 0) {
        report.warnings.push(`部分CLIPTextEncode未接到LoRA CLIP输出: ${clipMisses.map(item => item.nodeId).join(', ')}`);
    }

    report.ok = report.errors.length === 0;
    report.loaderTypes = [...new Set(report.loaderTypes)];
    report.warnings = [...new Set(report.warnings)];
    report.errors = [...new Set(report.errors)];
    return report;
}
