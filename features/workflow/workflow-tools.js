export const WORKFLOW_RECOMMENDED_PLACEHOLDERS = [
    '%prompt%',
    '%negative_prompt%',
    '%width%',
    '%height%',
    '%seed%',
    '%steps%',
    '%cfg%',
    '%sampler%',
    '%scheduler%',
    '%model%',
];

export const WORKFLOW_SUPPORTED_PLACEHOLDERS = [
    ...WORKFLOW_RECOMMENDED_PLACEHOLDERS,
    '%unet_model%',
    '%init_image%',
    '%denoise%',
    '%denoising_strength%',
];

export function buildWorkflowAnalysis(workflow, workflowText, options = {}) {
    const nodes = workflow && typeof workflow === 'object' && !Array.isArray(workflow)
        ? Object.entries(workflow)
        : [];
    const classCounts = new Map();
    const samplerNodes = [];
    const outputNodes = [];
    const loraNodes = [];
    const modelLoaderNodes = [];

    nodes.forEach(([nodeId, node]) => {
        const classType = String(node?.class_type || 'Unknown');
        const classLower = classType.toLowerCase();
        classCounts.set(classType, (classCounts.get(classType) || 0) + 1);
        if (classLower.includes('sampler')) samplerNodes.push(nodeId);
        if (classType === 'SaveImage' || classType === 'PreviewImage') outputNodes.push(nodeId);
        if (classLower.includes('lora')) loraNodes.push(nodeId);
        if (classLower.includes('checkpoint') || classLower.includes('unetloader') || classLower.includes('diffusionmodell')) {
            modelLoaderNodes.push(nodeId);
        }
    });

    const placeholders = [...new Set(workflowText.match(/%[a-zA-Z0-9_]+%/g) || [])].sort();
    const missingRecommended = WORKFLOW_RECOMMENDED_PLACEHOLDERS.filter(placeholder => !placeholders.includes(placeholder));
    const unknownPlaceholders = placeholders.filter(placeholder => !WORKFLOW_SUPPORTED_PLACEHOLDERS.includes(placeholder));
    const topClasses = [...classCounts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 8)
        .map(([classType, count]) => `${classType} x${count}`);

    const selectedLoras = Array.isArray(options.selectedLoras) ? options.selectedLoras : [];
    const enabledLoras = selectedLoras.filter(lora => lora.enabled !== false);
    const loraTriggerPrompt = String(options.loraTriggerPrompt || '');
    const warnings = [];

    if (missingRecommended.length > 0) {
        warnings.push(`缺少常用占位符: ${missingRecommended.join(', ')}`);
    }
    if (unknownPlaceholders.length > 0) {
        warnings.push(`发现未知占位符: ${unknownPlaceholders.join(', ')}`);
    }
    if (enabledLoras.length > 0 && modelLoaderNodes.length === 0) {
        warnings.push('当前已启用 LoRA，但工作流里未明显识别到模型加载节点，智能注入可能失败');
    }
    if (enabledLoras.length > 0 && !loraTriggerPrompt) {
        warnings.push('当前已启用 LoRA，但没有配置自动追加触发词；部分LoRA可能视觉上不明显');
    }
    if (outputNodes.length === 0) {
        warnings.push('缺少 SaveImage/PreviewImage 输出节点');
    }
    if (samplerNodes.length === 0) {
        warnings.push('未识别到采样器节点');
    }
    if (workflowText.includes('%init_image%') && !workflowText.includes('%denoise%') && !workflowText.includes('%denoising_strength%')) {
        warnings.push('使用了 %init_image%，但没有重绘强度占位符');
    }

    return {
        title: '工作流分析',
        lines: [
            `节点: ${nodes.length}`,
            `采样器节点: ${samplerNodes.length ? samplerNodes.join(', ') : '未找到'}`,
            `输出节点: ${outputNodes.length ? outputNodes.join(', ') : '未找到'}`,
            `模型加载节点: ${modelLoaderNodes.length ? modelLoaderNodes.join(', ') : '未明显识别'}`,
            `工作流内 LoRA 节点: ${loraNodes.length ? loraNodes.join(', ') : '无'}`,
            `当前已选 LoRA: ${enabledLoras.length}/${selectedLoras.length} 启用`,
            `LoRA触发词: ${loraTriggerPrompt || '未配置'}`,
            `已出现占位符: ${placeholders.length ? placeholders.join(', ') : '无'}`,
            `主要节点类型: ${topClasses.length ? topClasses.join('；') : '无'}`,
        ],
        warnings,
    };
}

export function convertWorkflowToPlaceholders(workflowString) {
    try {
        const workflow = JSON.parse(workflowString);
        let modified = false;

        const nodeConnections = analyzeNodeConnections(workflow);
        console.log('[AI Gen] 节点连接分析结果:', nodeConnections);

        for (const nodeId in workflow) {
            const nodeData = workflow[nodeId];
            if (nodeData && typeof nodeData === 'object') {
                if (processNodeForPlaceholders(nodeData, nodeId, nodeConnections, workflow)) {
                    modified = true;
                }
            }
        }

        if (!modified) {
            throw new Error('未找到可替换的值，工作流可能已是占位符格式');
        }

        return JSON.stringify(workflow, null, 2);
    } catch (error) {
        throw new Error(`解析工作流失败: ${error.message}`);
    }
}

function processNodeForPlaceholders(obj, nodeId, connections, workflow) {
    let hasModified = false;
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            if (processNodeForPlaceholders(value, nodeId, connections, workflow)) {
                hasModified = true;
            }
        } else if (typeof value === 'string' || typeof value === 'number') {
            const replacement = getPlaceholder(key, value, nodeId, connections, workflow);
            if (replacement !== null && replacement !== value) {
                obj[key] = replacement;
                hasModified = true;
                console.log(`[AI Gen] 替换: 节点 ${nodeId}, 键 ${key}: "${value}" -> "${replacement}"`);
            }
        }
    }
    return hasModified;
}

function analyzeNodeConnections(workflow) {
    const connections = {
        positivePromptNodes: new Set(),
        negativePromptNodes: new Set(),
        samplerNodes: new Set(),
    };

    for (const [nodeId, nodeData] of Object.entries(workflow)) {
        if (nodeData.class_type?.toLowerCase().includes('sampler')) {
            connections.samplerNodes.add(nodeId);
        }
    }

    for (const samplerId of connections.samplerNodes) {
        const inputs = workflow[samplerId]?.inputs;
        if (inputs?.positive?.[0]) connections.positivePromptNodes.add(inputs.positive[0].toString());
        if (inputs?.negative?.[0]) connections.negativePromptNodes.add(inputs.negative[0].toString());
    }
    return connections;
}

function getPlaceholder(key, value, nodeId, connections, workflow) {
    const keyLower = key.toLowerCase();
    const currentNode = workflow[nodeId];

    if ((keyLower.includes('ckpt_name') || keyLower.includes('model_name')) && typeof value === 'string' && value) return '%model%';
    if ((keyLower.includes('unet_name')) && typeof value === 'string' && value) return '%unet_model%';

    const classType = String(currentNode?.class_type || '').toLowerCase();
    if (keyLower === 'text' && typeof value === 'string' && classType.includes('cliptextencode')) {
        if (connections.positivePromptNodes.has(nodeId)) return '%prompt%';
        if (connections.negativePromptNodes.has(nodeId)) return '%negative_prompt%';

        const title = currentNode._meta?.title?.toLowerCase() || '';
        if (title.includes('负') || title.includes('negative')) return '%negative_prompt%';
        if (title.includes('正') || title.includes('positive')) return '%prompt%';

        const negativeKeywords = ['worst', 'bad', 'ugly', 'low quality', 'nsfw'];
        if (negativeKeywords.some(kw => value.toLowerCase().includes(kw))) {
            return '%negative_prompt%';
        }
        return '%prompt%';
    }

    if (keyLower === 'width' && typeof value === 'number' && value > 0) return '%width%';
    if (keyLower === 'height' && typeof value === 'number' && value > 0) return '%height%';
    if (keyLower === 'seed' && typeof value === 'number') return '%seed%';
    if (keyLower === 'steps' && typeof value === 'number' && value > 0) return '%steps%';
    if (keyLower === 'cfg' && typeof value === 'number' && value > 0) return '%cfg%';

    if ((keyLower === 'sampler_name' || keyLower === 'sampler') && typeof value === 'string' && value) return '%sampler%';
    if (keyLower === 'scheduler' && typeof value === 'string' && value) return '%scheduler%';

    return null;
}
