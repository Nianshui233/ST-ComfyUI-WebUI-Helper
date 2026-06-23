import {
    chooseLoraLoader,
    getComfyUILoraLoaders,
} from './comfyui-lora-loader-discovery.js';
import {
    appendLoraChain,
    buildModelClipLinkKey,
    createLoraInjectionReport,
    setLoraReportLoaderMode,
    validateLoraInjection,
} from './comfyui-lora-injection-chain.js';
import {
    cleanupInjectedLoraNodes,
    findClipTextEncodeNodeIds,
    findFallbackModelSource,
    findSamplerNodes,
    findWorkflowInputKeyByType,
    getClipProviderForEncodeNode,
    getInputLink,
    getMaxWorkflowNodeId,
    isWorkflowLink,
} from './comfyui-lora-workflow-graph.js';

export {
    getComfyUILoraFolder,
    getComfyUILoraTriggerPrompt,
    normalizeComfyUILoraItem,
    normalizeComfyUILoraItems,
    parseTriggerWords,
} from './comfyui-lora-data.js';
export {
    findComfyUILoraLoader,
    findInputKey,
    findNumericInputKey,
    getComfyUILoraLoaders,
    inputAcceptsComfyType,
} from './comfyui-lora-loader-discovery.js';
export {
    normalizeLoraInjectionMode,
} from './comfyui-lora-injection-chain.js';

function getArrayCount(value) {
    return Array.isArray(value) ? value.length : 0;
}

function formatLoraReportSummary(report) {
    return [
        `strategy=${report.strategy || 'pending'}`,
        `mode=${report.effectiveInjectionMode || report.injectionMode || 'unknown'}`,
        `nodes=${getArrayCount(report.insertedNodeIds)}`,
        `samplers=${getArrayCount(report.samplerTargets)}`,
        `clips=${getArrayCount(report.clipTargets)}`,
        `warnings=${getArrayCount(report.warnings)}`,
        `errors=${getArrayCount(report.errors)}`,
    ].join(', ');
}

export function intelligentLoraInjection(workflow, selectedLoras, objectInfo, options = {}) {
    const report = createLoraInjectionReport(selectedLoras, options);
    if (!selectedLoras || selectedLoras.length === 0) return report;

    if (!objectInfo) {
        report.ok = false;
        report.errors.push('缺失 ComfyUI 节点元数据，请先连接ComfyUI加载 /object_info');
        return report;
    }

    cleanupInjectedLoraNodes(workflow, objectInfo, report);

    const availableLoraLoaders = getComfyUILoraLoaders(objectInfo);
    if (availableLoraLoaders.length === 0) {
        report.ok = false;
        report.errors.push('ComfyUI未提供可用的LoRA加载节点，无法注入LoRA');
        return report;
    }

    const maxIdRef = { value: getMaxWorkflowNodeId(workflow) };
    const samplerNodes = findSamplerNodes(workflow);
    const chainByProvider = new Map();

    for (const { nodeId: samplerId } of samplerNodes) {
        const modelInputKey = findWorkflowInputKeyByType(workflow, objectInfo, samplerId, ['model'], 'MODEL');
        const positiveInputKey = findWorkflowInputKeyByType(workflow, objectInfo, samplerId, ['positive'], 'CONDITIONING');
        const negativeInputKey = findWorkflowInputKeyByType(workflow, objectInfo, samplerId, ['negative'], 'CONDITIONING');
        const samplerModelLink = getInputLink(workflow, samplerId, modelInputKey);
        if (!samplerModelLink) {
            report.warnings.push(`采样器 ${samplerId} 缺少 model 输入，已跳过`);
            continue;
        }

        const modelProvider = { id: samplerModelLink[0], index: samplerModelLink[1] };
        const clipEncodeIds = [
            ...findClipTextEncodeNodeIds(workflow, getInputLink(workflow, samplerId, positiveInputKey)?.[0]),
            ...findClipTextEncodeNodeIds(workflow, getInputLink(workflow, samplerId, negativeInputKey)?.[0]),
        ];
        const uniqueClipEncodeIds = [...new Set(clipEncodeIds)];
        const clipProviderInfo = uniqueClipEncodeIds
            .map(clipNodeId => getClipProviderForEncodeNode(workflow, objectInfo, clipNodeId))
            .find(Boolean);
        const clipProvider = clipProviderInfo?.provider || null;

        const loraLoader = chooseLoraLoader(availableLoraLoaders, {
            clipProvider,
            mode: report.injectionMode,
        });

        if (!loraLoader) {
            report.warnings.push(`采样器 ${samplerId} 没有可用LoRA加载节点，已跳过`);
            continue;
        }
        setLoraReportLoaderMode(report, loraLoader);

        if (report.injectionMode === 'model_only' && loraLoader.inputs.clip) {
            report.warnings.push(`未找到可用的 MODEL-only LoRA节点，已使用 ${loraLoader.type} 同时增强MODEL和CLIP路径`);
        }

        if (report.injectionMode === 'model_clip' && !loraLoader.inputs.clip) {
            report.warnings.push(`未找到可用的 MODEL+CLIP LoRA节点，已使用 ${loraLoader.type} 仅增强MODEL路径`);
        }

        if (!clipProvider && loraLoader.inputs.clip) {
            report.warnings.push(`采样器 ${samplerId} 没有可用CLIP链路，但 ${loraLoader.type} 需要CLIP输入，已跳过`);
            continue;
        }

        if (report.injectionMode === 'model_clip' && (!loraLoader.inputs.clip || loraLoader.outputs.clip < 0)) {
            report.warnings.push(`LoRA节点 ${loraLoader.type} 不输出CLIP，只能增强MODEL路径`);
        }

        const activeClipProvider = loraLoader.inputs.clip ? clipProvider : null;
        const providerKey = `${loraLoader.type}|${buildModelClipLinkKey(modelProvider, activeClipProvider)}`;
        let chain = chainByProvider.get(providerKey);
        if (!chain) {
            chain = appendLoraChain(workflow, selectedLoras, loraLoader, modelProvider, activeClipProvider, maxIdRef, report);
            chainByProvider.set(providerKey, chain);
        }

        workflow[samplerId].inputs[modelInputKey] = [chain.modelProvider.id, chain.modelProvider.index];
        report.samplerTargets.push({
            samplerId,
            inputKey: modelInputKey,
            originalModelProvider: modelProvider,
            finalModelProvider: chain.modelProvider,
        });

        if (loraLoader.inputs.clip && chain.clipProvider) {
            uniqueClipEncodeIds.forEach(clipNodeId => {
                const clipInput = getClipProviderForEncodeNode(workflow, objectInfo, clipNodeId);
                if (!clipInput || !workflow[clipNodeId]?.inputs) return;
                workflow[clipNodeId].inputs[clipInput.key] = [chain.clipProvider.id, chain.clipProvider.index];
                report.clipTargets.push({
                    nodeId: clipNodeId,
                    inputKey: clipInput.key,
                    finalClipProvider: chain.clipProvider,
                });
            });
        } else if (report.injectionMode === 'model_clip' && uniqueClipEncodeIds.length > 0) {
            report.warnings.push(`注入方式为 ${report.injectionMode}，保持 ${uniqueClipEncodeIds.length} 个CLIPTextEncode节点的原始CLIP连接`);
        }
    }

    if (report.samplerTargets.length > 0) {
        report.strategy = 'sampler-trace';
        console.info(`[AI Gen] LoRA链路追踪注入完成: ${formatLoraReportSummary(report)}`);
        return validateLoraInjection(workflow, report);
    }

    const fallback = findFallbackModelSource(workflow, objectInfo);
    if (!fallback) {
        report.ok = false;
        report.errors.push('工作流中未找到可用 MODEL 输出，无法注入LoRA');
        return report;
    }

    const fallbackLoader = chooseLoraLoader(availableLoraLoaders, {
        clipProvider: fallback.clipProvider,
        mode: report.injectionMode,
    });

    if (!fallbackLoader) {
        report.ok = false;
        report.errors.push('ComfyUI未提供可用的LoRA加载节点，无法注入LoRA');
        return report;
    }

    if (!fallback.clipProvider && fallbackLoader.inputs.clip) {
        report.ok = false;
        report.errors.push(`只能找到需要CLIP输入的LoRA节点 ${fallbackLoader.type}，但工作流未提供可用CLIP源`);
        return report;
    }
    setLoraReportLoaderMode(report, fallbackLoader);

    if (report.injectionMode === 'model_only' && fallbackLoader.inputs.clip) {
        report.warnings.push(`未找到可用的 MODEL-only LoRA节点，已使用 ${fallbackLoader.type} 同时增强MODEL和CLIP路径`);
    }

    if (report.injectionMode === 'model_clip' && !fallbackLoader.inputs.clip) {
        report.warnings.push(`未找到可用的 MODEL+CLIP LoRA节点，已使用 ${fallbackLoader.type} 仅增强MODEL路径`);
    }

    const chain = appendLoraChain(
        workflow,
        selectedLoras,
        fallbackLoader,
        fallback.modelProvider,
        fallbackLoader.inputs.clip ? fallback.clipProvider : null,
        maxIdRef,
        report
    );

    for (const [, node] of Object.entries(workflow)) {
        if (!node?.inputs) continue;
        for (const [inputKey, value] of Object.entries(node.inputs)) {
            if (!isWorkflowLink(value)) continue;
            if (String(value[0]) === String(fallback.modelProvider.id) && Number(value[1]) === fallback.modelProvider.index) {
                node.inputs[inputKey] = [chain.modelProvider.id, chain.modelProvider.index];
            }
            if (fallbackLoader.inputs.clip && fallback.clipProvider && chain.clipProvider && String(value[0]) === String(fallback.clipProvider.id) && Number(value[1]) === fallback.clipProvider.index) {
                node.inputs[inputKey] = [chain.clipProvider.id, chain.clipProvider.index];
            }
        }
    }

    report.strategy = 'fallback-global-source';
    report.warnings.push('未找到采样器链路，已使用全局源头回退注入');
    console.info(`[AI Gen] LoRA回退注入完成: ${formatLoraReportSummary(report)}`);
    return validateLoraInjection(workflow, report);
}
