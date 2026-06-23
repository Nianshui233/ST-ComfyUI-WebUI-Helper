import { createWorkflowEditorTools } from './workflow-editor-tools.js';
import { createWorkflowListController } from './workflow-list-controller.js';
import { createWorkflowStorageActions } from './workflow-storage-actions.js';

export function createWorkflowManager({
    getValue,
    setValue,
    blobUrlTracker,
    buildWorkflowAnalysis,
    convertWorkflowToPlaceholders,
    validateComfyWorkflow,
    showWorkflowValidationResult,
    getCurrentComfyUISelectedLoras,
    getComfyUILoraTriggerPrompt,
    showToast,
}) {
    const editorTools = createWorkflowEditorTools({
        getValue,
        buildWorkflowAnalysis,
        convertWorkflowToPlaceholders,
        validateComfyWorkflow,
        showWorkflowValidationResult,
        getCurrentComfyUISelectedLoras,
        getComfyUILoraTriggerPrompt,
        showToast,
    });
    const {
        analyzeCurrentWorkflow,
        convertCurrentWorkflowToPlaceholders,
        copyCurrentWorkflow,
        formatCurrentWorkflow,
        insertWorkflowPlaceholder,
        minifyCurrentWorkflow,
        validateCurrentWorkflow,
    } = editorTools;
    const workflowList = createWorkflowListController({
        getValue,
        setValue,
        showToast,
    });
    const {
        cancelEditMode,
        filterWorkflows,
        saveEditedWorkflow,
        toggleEditMode,
        updateWorkflowList,
    } = workflowList;
    const storageActions = createWorkflowStorageActions({
        getValue,
        setValue,
        blobUrlTracker,
        validateComfyWorkflow,
        showWorkflowValidationResult,
        updateWorkflowList,
        showToast,
    });
    const {
        exportAllWorkflows,
        importAllWorkflows,
        showWorkflowSaveModal,
    } = storageActions;

    return {
        analyzeCurrentWorkflow,
        cancelEditMode,
        convertCurrentWorkflowToPlaceholders,
        copyCurrentWorkflow,
        exportAllWorkflows,
        filterWorkflows,
        formatCurrentWorkflow,
        importAllWorkflows,
        insertWorkflowPlaceholder,
        minifyCurrentWorkflow,
        saveEditedWorkflow,
        showWorkflowSaveModal,
        toggleEditMode,
        updateWorkflowList,
        validateCurrentWorkflow,
    };
}
