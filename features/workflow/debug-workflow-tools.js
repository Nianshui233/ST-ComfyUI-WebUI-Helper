import { STORAGE_KEY_LAST_COMFYUI_WORKFLOW } from '../core/runtime-config.js';

export function createDebugWorkflowTools({
    getValue,
    downloadJsonFile,
    showToast,
}) {
    async function copyTextToClipboard(text, successMessage) {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
        }

        showToast('success', successMessage);
    }

    async function getLastSubmittedComfyUIWorkflowPayload() {
        const payload = await getValue(STORAGE_KEY_LAST_COMFYUI_WORKFLOW, null);
        if (!payload?.workflow) {
            throw new Error('还没有保存过最终工作流，请先生成一次图片');
        }
        return payload;
    }

    async function copyLastSubmittedComfyUIWorkflow() {
        try {
            const payload = await getLastSubmittedComfyUIWorkflowPayload();
            await copyTextToClipboard(JSON.stringify(payload.workflow, null, 2), '最终工作流 JSON 已复制');
        } catch (error) {
            showToast('error', `复制最终工作流失败: ${error.message}`);
        }
    }

    async function exportLastSubmittedComfyUIWorkflow() {
        try {
            const payload = await getLastSubmittedComfyUIWorkflowPayload();
            downloadJsonFile(payload, `comfyui_final_workflow_${new Date().toISOString().slice(0, 10)}.json`);
            showToast('success', '最终工作流调试包已导出');
        } catch (error) {
            showToast('error', `导出最终工作流失败: ${error.message}`);
        }
    }

    return {
        copyLastSubmittedComfyUIWorkflow,
        copyTextToClipboard,
        exportLastSubmittedComfyUIWorkflow,
        getLastSubmittedComfyUIWorkflowPayload,
    };
}
