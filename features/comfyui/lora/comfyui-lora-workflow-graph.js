import {
    findInputKey,
    inputAcceptsComfyType,
} from './comfyui-lora-loader-discovery.js';

export function getNodeOutputIndex(objectInfo, node) {
    const output = objectInfo?.[node?.class_type]?.output || [];
    return {
        model: output.indexOf('MODEL'),
        clip: output.indexOf('CLIP'),
    };
}

export function isWorkflowLink(value) {
    return Array.isArray(value) && value.length >= 2 && value[0] != null && Number.isFinite(Number(value[1]));
}

export function cloneWorkflowLink(link) {
    return [String(link[0]), Number(link[1])];
}

export function getInputLink(workflow, nodeId, inputKey) {
    if (!inputKey) return null;
    const link = workflow?.[nodeId]?.inputs?.[inputKey];
    return isWorkflowLink(link) ? cloneWorkflowLink(link) : null;
}

export function findSamplerNodes(workflow) {
    return Object.entries(workflow || {})
        .filter(([, node]) => String(node?.class_type || '').toLowerCase().includes('sampler'))
        .map(([nodeId, node]) => ({ nodeId, node }));
}

export function findWorkflowInputKeyByType(workflow, objectInfo, nodeId, preferredKeys, acceptedType) {
    const node = workflow?.[nodeId];
    const required = objectInfo?.[node?.class_type]?.input?.required || {};

    for (const key of preferredKeys) {
        if (node?.inputs?.[key] != null && (!acceptedType || inputAcceptsComfyType(required[key], acceptedType))) return key;
    }

    const typedKey = Object.keys(required).find(key => (
        node?.inputs?.[key] != null &&
        inputAcceptsComfyType(required[key], acceptedType)
    ));
    if (typedKey) return typedKey;

    return Object.keys(node?.inputs || {}).find(key => (
        preferredKeys.some(preferred => key.toLowerCase().includes(preferred.toLowerCase()))
    )) || null;
}

export function findClipTextEncodeNodeIds(workflow, nodeId, visited = new Set()) {
    if (!nodeId || visited.has(String(nodeId))) return [];
    const currentId = String(nodeId);
    visited.add(currentId);
    const node = workflow[currentId];
    if (!node) return [];

    const classType = String(node.class_type || '').toLowerCase();
    if (classType.includes('cliptextencode')) return [currentId];

    const results = [];
    Object.values(node.inputs || {}).forEach(value => {
        if (isWorkflowLink(value)) {
            results.push(...findClipTextEncodeNodeIds(workflow, value[0], visited));
        }
    });

    return [...new Set(results)];
}

function findClipInputKeyForNode(workflow, objectInfo, nodeId) {
    const node = workflow?.[nodeId];
    const required = objectInfo?.[node?.class_type]?.input?.required || {};

    const typedKey = Object.keys(required).find(key => inputAcceptsComfyType(required[key], 'CLIP'));
    if (typedKey && getInputLink(workflow, nodeId, typedKey)) return typedKey;

    const nameKey = Object.keys(node?.inputs || {}).find(key => key.toLowerCase().includes('clip'));
    return nameKey || null;
}

export function getClipProviderForEncodeNode(workflow, objectInfo, nodeId) {
    const clipKey = findClipInputKeyForNode(workflow, objectInfo, nodeId);
    if (!clipKey) return null;
    const link = getInputLink(workflow, nodeId, clipKey);
    return link ? { key: clipKey, provider: { id: link[0], index: link[1] } } : null;
}

function isInjectedLoraNode(node) {
    return String(node?._meta?.title || '').startsWith('Injected LoRA:');
}

function getInjectedNodePassthroughInput(workflow, objectInfo, nodeId, outputIndex) {
    const node = workflow?.[nodeId];
    if (!isInjectedLoraNode(node)) return null;

    const outputIndexes = getNodeOutputIndex(objectInfo, node);
    const required = objectInfo?.[node?.class_type]?.input?.required || {};
    let inputKey = null;

    if (Number(outputIndex) === outputIndexes.model) {
        inputKey = findInputKey(required, ['model'], 'MODEL') ||
            Object.keys(node.inputs || {}).find(key => key.toLowerCase().includes('model'));
    } else if (Number(outputIndex) === outputIndexes.clip) {
        inputKey = findInputKey(required, ['clip'], 'CLIP') ||
            Object.keys(node.inputs || {}).find(key => key.toLowerCase().includes('clip'));
    }

    return inputKey ? getInputLink(workflow, nodeId, inputKey) : null;
}

function resolveInjectedWorkflowLink(workflow, objectInfo, link) {
    let resolved = cloneWorkflowLink(link);
    const visited = new Set();

    while (isWorkflowLink(resolved)) {
        const nodeId = String(resolved[0]);
        if (visited.has(nodeId) || !isInjectedLoraNode(workflow?.[nodeId])) break;
        visited.add(nodeId);

        const upstream = getInjectedNodePassthroughInput(workflow, objectInfo, nodeId, resolved[1]);
        if (!upstream) break;
        resolved = upstream;
    }

    return resolved;
}

export function cleanupInjectedLoraNodes(workflow, objectInfo, report) {
    const injectedIds = Object.entries(workflow || {})
        .filter(([, node]) => isInjectedLoraNode(node))
        .map(([nodeId]) => String(nodeId));

    if (injectedIds.length === 0) return;

    for (const node of Object.values(workflow || {})) {
        if (!node?.inputs) continue;
        for (const [inputKey, value] of Object.entries(node.inputs)) {
            if (!isWorkflowLink(value) || !injectedIds.includes(String(value[0]))) continue;
            const resolved = resolveInjectedWorkflowLink(workflow, objectInfo, value);
            if (isWorkflowLink(resolved) && !injectedIds.includes(String(resolved[0]))) {
                node.inputs[inputKey] = resolved;
            }
        }
    }

    injectedIds.forEach(nodeId => {
        delete workflow[nodeId];
    });
    report.cleanedInjectedNodeIds.push(...injectedIds);
    report.warnings.push(`已清理 ${injectedIds.length} 个旧的插件注入LoRA节点，避免重复叠加`);
}

export function getMaxWorkflowNodeId(workflow) {
    return Math.max(
        0,
        ...Object.keys(workflow || {})
            .map(Number)
            .filter(Number.isFinite)
    );
}

export function findFallbackModelSource(workflow, objectInfo) {
    for (const [nodeId, node] of Object.entries(workflow || {})) {
        const outputIndexes = getNodeOutputIndex(objectInfo, node);
        if (outputIndexes.model < 0) continue;
        return {
            nodeId,
            modelProvider: { id: nodeId, index: outputIndexes.model },
            clipProvider: outputIndexes.clip >= 0 ? { id: nodeId, index: outputIndexes.clip } : null,
        };
    }

    return null;
}
