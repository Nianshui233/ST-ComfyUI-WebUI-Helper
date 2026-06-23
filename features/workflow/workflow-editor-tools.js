import { STORAGE_KEY_LAST_LORA_REPORT } from '../core/runtime-config.js';

export function createWorkflowEditorTools({
    getValue,
    buildWorkflowAnalysis,
    convertWorkflowToPlaceholders,
    validateComfyWorkflow,
    showWorkflowValidationResult,
    getCurrentComfyUISelectedLoras,
    getComfyUILoraTriggerPrompt,
    showToast,
}) {
    function formatCurrentWorkflow(workflowInput) {
        if (!workflowInput.value.trim()) {
            showToast('error', '工作流内容为空');
            return;
        }

        try {
            workflowInput.value = JSON.stringify(JSON.parse(workflowInput.value), null, 2);
            workflowInput.dispatchEvent(new Event('input', { bubbles: true }));
            showWorkflowValidationResult(validateComfyWorkflow(workflowInput.value));
            showToast('success', '工作流 JSON 已格式化');
        } catch (error) {
            showToast('error', `格式化失败: ${error.message}`);
        }
    }

    async function copyCurrentWorkflow(workflowInput) {
        if (!workflowInput.value.trim()) {
            showToast('error', '工作流内容为空');
            return;
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(workflowInput.value);
            } else {
                workflowInput.select();
                document.execCommand('copy');
            }
            showToast('success', '工作流 JSON 已复制');
        } catch (error) {
            showToast('error', `复制失败: ${error.message}`);
        }
    }

    function minifyCurrentWorkflow(workflowInput) {
        if (!workflowInput.value.trim()) {
            showToast('error', '工作流内容为空');
            return;
        }

        try {
            const before = workflowInput.value.length;
            workflowInput.value = JSON.stringify(JSON.parse(workflowInput.value));
            workflowInput.dispatchEvent(new Event('input', { bubbles: true }));
            const after = workflowInput.value.length;
            const saved = before > 0 ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;
            showWorkflowValidationResult(validateComfyWorkflow(workflowInput.value));
            showToast('success', `工作流 JSON 已压缩，减少约 ${saved}%`);
        } catch (error) {
            showToast('error', `压缩失败: ${error.message}`);
        }
    }

    function renderWorkflowAnalysis({ title, lines = [], warnings = [] }) {
        const container = document.getElementById('workflow-analysis-result');
        if (!container) return;

        container.innerHTML = '';
        container.style.display = 'block';

        const heading = document.createElement('div');
        heading.className = 'workflow-analysis-title';
        heading.textContent = title || '工作流分析';
        container.appendChild(heading);

        const list = document.createElement('div');
        list.className = 'workflow-analysis-lines';
        lines.forEach(line => {
            const item = document.createElement('div');
            item.textContent = line;
            list.appendChild(item);
        });
        container.appendChild(list);

        if (warnings.length > 0) {
            const warningList = document.createElement('div');
            warningList.className = 'workflow-analysis-warnings';
            warnings.forEach(warning => {
                const item = document.createElement('div');
                item.textContent = `提示: ${warning}`;
                warningList.appendChild(item);
            });
            container.appendChild(warningList);
        }
    }

    async function analyzeCurrentWorkflow(workflowInput) {
        if (!workflowInput.value.trim()) {
            showToast('error', '工作流内容为空');
            return;
        }

        try {
            const workflowText = workflowInput.value;
            const workflow = JSON.parse(workflowText);
            const selectedLoras = getCurrentComfyUISelectedLoras();
            const enabledLoras = selectedLoras.filter(lora => lora.enabled !== false);
            const analysis = buildWorkflowAnalysis(workflow, workflowText, {
                selectedLoras,
                loraTriggerPrompt: getComfyUILoraTriggerPrompt(enabledLoras),
            });
            const lastReport = await getValue(STORAGE_KEY_LAST_LORA_REPORT, null);
            if (lastReport?.loraCount) {
                analysis.lines.push(`上次LoRA注入: ${lastReport.ok ? '通过' : '失败'} / ${lastReport.strategy} / ${lastReport.effectiveInjectionMode || lastReport.injectionMode || 'unknown'} / ${lastReport.insertedNodeIds?.length || 0} 节点 / ${lastReport.chainCount || 0} 链`);
                if (lastReport.loaderTypes?.length) {
                    analysis.lines.push(`上次LoRA节点: ${lastReport.loaderTypes.join(', ')}`);
                }
                analysis.warnings.push(...(lastReport.warnings || []));
                analysis.warnings.push(...(lastReport.errors || []).map(error => `上次注入错误: ${error}`));
            }
            renderWorkflowAnalysis(analysis);
            showWorkflowValidationResult(validateComfyWorkflow(workflowText));
        } catch (error) {
            renderWorkflowAnalysis({
                title: '工作流分析失败',
                lines: [`JSON解析失败: ${error.message}`],
                warnings: [],
            });
            showToast('error', `分析失败: ${error.message}`);
        }
    }

    function insertWorkflowPlaceholder(workflowInput, placeholder) {
        if (!placeholder) return;

        const start = workflowInput.selectionStart ?? workflowInput.value.length;
        const end = workflowInput.selectionEnd ?? workflowInput.value.length;
        workflowInput.value = `${workflowInput.value.slice(0, start)}${placeholder}${workflowInput.value.slice(end)}`;
        workflowInput.focus();
        workflowInput.setSelectionRange(start + placeholder.length, start + placeholder.length);
        workflowInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function convertCurrentWorkflowToPlaceholders(workflowInput) {
        if (!workflowInput.value.trim()) return showToast('error', '工作流内容为空');
        try {
            workflowInput.value = convertWorkflowToPlaceholders(workflowInput.value);
            showWorkflowValidationResult(validateComfyWorkflow(workflowInput.value));
            showToast('success', '工作流已转换为占位符格式 (请务必自行检查)');
        } catch (error) {
            showToast('error', `转换失败: ${error.message}`);
        }
    }

    function validateCurrentWorkflow(workflowInput) {
        if (!workflowInput.value.trim()) return showToast('error', '工作流内容为空');
        showWorkflowValidationResult(validateComfyWorkflow(workflowInput.value));
    }

    return {
        analyzeCurrentWorkflow,
        convertCurrentWorkflowToPlaceholders,
        copyCurrentWorkflow,
        formatCurrentWorkflow,
        insertWorkflowPlaceholder,
        minifyCurrentWorkflow,
        validateCurrentWorkflow,
    };
}
