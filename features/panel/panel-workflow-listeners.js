export function createPanelWorkflowListeners({
    filterWorkflows,
    toggleEditMode,
    saveEditedWorkflow,
    cancelEditMode,
    formatCurrentWorkflow,
    copyCurrentWorkflow,
    minifyCurrentWorkflow,
    analyzeCurrentWorkflow,
    insertWorkflowPlaceholder,
    convertCurrentWorkflowToPlaceholders,
    validateCurrentWorkflow,
    showWorkflowSaveModal,
    exportAllWorkflows,
    importAllWorkflows,
    validateComfyWorkflow,
    showWorkflowValidationResult,
    showToast,
}) {
    function initWorkflowListeners(buttons, inputs) {
        document.getElementById('workflow-search').addEventListener('input', (event) => {
            filterWorkflows(event.target.value.toLowerCase());
        });
        buttons.editMode.addEventListener('click', toggleEditMode);
        buttons.saveEdit.addEventListener('click', saveEditedWorkflow);
        buttons.cancelEdit.addEventListener('click', cancelEditMode);
        buttons.formatWorkflow?.addEventListener('click', () => formatCurrentWorkflow(inputs.workflow));
        buttons.copyWorkflow?.addEventListener('click', () => copyCurrentWorkflow(inputs.workflow));
        buttons.minifyWorkflow?.addEventListener('click', () => minifyCurrentWorkflow(inputs.workflow));
        buttons.analyzeWorkflow?.addEventListener('click', () => analyzeCurrentWorkflow(inputs.workflow));

        document.querySelectorAll('.workflow-placeholder-btn').forEach(button => {
            button.addEventListener('click', () => insertWorkflowPlaceholder(inputs.workflow, button.dataset.placeholder));
        });

        buttons.toPlaceholders.addEventListener('click', () => convertCurrentWorkflowToPlaceholders(inputs.workflow));
        buttons.validateWorkflow.addEventListener('click', () => validateCurrentWorkflow(inputs.workflow));
        buttons.createWorkflow.addEventListener('click', () => {
            inputs.workflow.value = '';
            showWorkflowSaveModal('新工作流');
        });
        buttons.saveWorkflow.addEventListener('click', () => {
            if (!inputs.workflow.value.trim()) return showToast('error', '工作流内容不能为空');
            const validation = validateComfyWorkflow(inputs.workflow.value);
            showWorkflowValidationResult(validation);
            if (!validation.ok) return;
            showWorkflowSaveModal('');
        });
        buttons.exportWorkflows.addEventListener('click', exportAllWorkflows);
        buttons.importWorkflows.addEventListener('click', importAllWorkflows);
    }

    return {
        initWorkflowListeners,
    };
}
