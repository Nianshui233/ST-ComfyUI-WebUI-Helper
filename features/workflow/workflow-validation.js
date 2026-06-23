export function validateComfyWorkflow(workflowString) {
    const errors = [];
    const warnings = [];
    let workflow;

    try {
        workflow = JSON.parse(workflowString);
    } catch (error) {
        return {
            ok: false,
            errors: [`JSON 解析失败: ${error.message}`],
            warnings,
            workflow: null,
        };
    }

    if (!workflow || typeof workflow !== 'object' || Array.isArray(workflow)) {
        errors.push('工作流必须是 ComfyUI API Format 的 JSON 对象');
    }

    const nodes = workflow && typeof workflow === 'object' ? Object.entries(workflow) : [];
    if (nodes.length === 0) {
        errors.push('工作流没有节点');
    }

    const outputNodes = nodes.filter(([, node]) => node?.class_type === 'SaveImage' || node?.class_type === 'PreviewImage');
    if (outputNodes.length === 0) {
        errors.push('缺少输出节点：需要 SaveImage 或 PreviewImage');
    }

    const samplerNodes = nodes.filter(([, node]) => String(node?.class_type || '').toLowerCase().includes('sampler'));
    if (samplerNodes.length === 0) {
        warnings.push('未找到采样器节点，请确认这是否为有效生图工作流');
    }

    for (const [nodeId, node] of samplerNodes) {
        const inputs = node?.inputs || {};
        for (const inputName of ['model', 'positive', 'negative']) {
            if (!Array.isArray(inputs[inputName])) {
                errors.push(`采样器节点 ${nodeId} 缺少 ${inputName} 输入`);
            }
        }
        if (node.class_type === 'KSampler' && !Array.isArray(inputs.latent_image)) {
            errors.push(`KSampler 节点 ${nodeId} 缺少 latent_image 输入；通常需要连接 EmptyLatentImage`);
        }
    }

    for (const [nodeId, node] of nodes) {
        if (!node?.class_type) {
            errors.push(`节点 ${nodeId} 缺少 class_type`);
        }
        if (!node?.inputs || typeof node.inputs !== 'object') {
            warnings.push(`节点 ${nodeId} 没有 inputs`);
        }
    }

    const text = workflowString;
    const recommendedPlaceholders = ['%prompt%', '%negative_prompt%', '%width%', '%height%', '%seed%', '%steps%', '%cfg%', '%sampler%', '%scheduler%', '%model%'];
    const missing = recommendedPlaceholders.filter(placeholder => !text.includes(placeholder));
    if (missing.length > 0) {
        warnings.push(`缺少常用占位符: ${missing.join(', ')}`);
    }

    if (text.includes('%init_image%') && !text.includes('%denoise%') && !text.includes('%denoising_strength%')) {
        warnings.push('工作流使用了 %init_image%，但未使用 %denoise% 或 %denoising_strength%；图生图重绘强度可能不会生效');
    }

    return {
        ok: errors.length === 0,
        errors,
        warnings,
        workflow,
    };
}

export function showWorkflowValidationResult(result, showToast) {
    if (result.ok) {
        const message = result.warnings.length
            ? `工作流校验通过；警告：${result.warnings.join('；')}`
            : '工作流校验通过';
        showToast(result.warnings.length ? 'warning' : 'success', message);
    } else {
        showToast('error', `工作流校验失败：${result.errors.join('；')}`);
    }
}
