import { STORAGE_KEY_WORKFLOWS } from '../core/runtime-config.js';

export function createWorkflowStorageActions({
    getValue,
    setValue,
    blobUrlTracker,
    validateComfyWorkflow,
    showWorkflowValidationResult,
    updateWorkflowList,
    showToast,
}) {
    async function exportAllWorkflows() {
        const workflows = await getValue(STORAGE_KEY_WORKFLOWS, {});
        if (Object.keys(workflows).length === 0) {
            return showToast('warning', '没有工作流可导出');
        }
        const exportData = JSON.stringify(workflows, null, 2);
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = blobUrlTracker.create(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comfyui_workflows_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        blobUrlTracker.revoke(url);
        showToast('success', '已导出工作流');
    }

    async function importAllWorkflows() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = event => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (readerEvent) => {
                try {
                    const importedData = JSON.parse(readerEvent.target.result);
                    if (typeof importedData !== 'object' || importedData === null) {
                        throw new Error('无效的文件格式');
                    }
                    const looksLikeSingleWorkflow = Object.values(importedData).some(value => value?.class_type);
                    if (looksLikeSingleWorkflow) {
                        const workflowText = JSON.stringify(importedData, null, 2);
                        const validation = validateComfyWorkflow(workflowText);
                        showWorkflowValidationResult(validation);
                        if (!validation.ok) return;
                        document.getElementById('comfyui-workflow').value = workflowText;
                        await setValue('comfyui_workflow', workflowText);
                        showToast('success', '工作流已导入到当前编辑区');
                        return;
                    }
                    const workflowEntries = Object.entries(importedData).filter(([, value]) => typeof value === 'string');
                    for (const [name, workflowText] of workflowEntries) {
                        const validation = validateComfyWorkflow(workflowText);
                        if (!validation.ok) {
                            throw new Error(`工作流 "${name}" 校验失败: ${validation.errors.join('；')}`);
                        }
                    }
                    const existingWorkflows = await getValue(STORAGE_KEY_WORKFLOWS, {});
                    const newWorkflows = { ...existingWorkflows, ...importedData };
                    await setValue(STORAGE_KEY_WORKFLOWS, newWorkflows);
                    updateWorkflowList();
                    showToast('success', '工作流导入成功');
                } catch (error) {
                    showToast('error', `导入失败: ${error.message}`);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function showWorkflowSaveModal(defaultName = '') {
        const modal = document.getElementById('workflow-save-modal');
        const nameInput = document.getElementById('workflow-name-input');
        const warning = document.getElementById('overwrite-warning');
        const confirmBtn = document.getElementById('workflow-save-confirm');
        const cancelBtn = document.getElementById('workflow-save-cancel');

        if (modal._abortController) modal._abortController.abort();
        modal._abortController = new AbortController();
        const { signal } = modal._abortController;

        confirmBtn.addEventListener('click', async () => {
            const workflowName = nameInput.value.trim();
            if (!workflowName) return showToast('error', '请输入工作流名称');
            const workflowText = document.getElementById('comfyui-workflow').value;
            if (!workflowText.trim()) return showToast('error', '工作流内容不能为空');
            const validation = validateComfyWorkflow(workflowText);
            showWorkflowValidationResult(validation);
            if (!validation.ok) return;

            const workflows = await getValue(STORAGE_KEY_WORKFLOWS, {});
            workflows[workflowName] = workflowText;
            await setValue(STORAGE_KEY_WORKFLOWS, workflows);

            modal.style.display = 'none';
            showToast('success', `工作流 "${workflowName}" 已保存`);
            updateWorkflowList();
        }, { signal });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        }, { signal });

        nameInput.addEventListener('input', async () => {
            const presets = await getValue(STORAGE_KEY_WORKFLOWS, {});
            warning.style.display = (nameInput.value.trim() && presets[nameInput.value.trim()]) ? 'block' : 'none';
        }, { signal });

        nameInput.value = defaultName;
        nameInput.dispatchEvent(new Event('input'));
        modal.style.display = 'block';
        setTimeout(() => nameInput.focus(), 100);
    }

    return {
        exportAllWorkflows,
        importAllWorkflows,
        showWorkflowSaveModal,
    };
}
