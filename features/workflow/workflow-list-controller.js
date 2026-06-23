import { STORAGE_KEY_WORKFLOWS } from '../core/runtime-config.js';

export function createWorkflowListController({
    getValue,
    setValue,
    showToast,
}) {
    let currentEditingWorkflow = null;
    let isEditMode = false;

    function toggleEditMode() {
        isEditMode = !isEditMode;
        const toolbar = document.getElementById('edit-mode-toolbar');
        const editModeBtn = document.getElementById('workflow-edit-mode');

        if (isEditMode) {
            toolbar.classList.add('active');
            editModeBtn.textContent = '退出编辑';
            editModeBtn.classList.add('error');
            showToast('info', '已进入编辑模式，点击工作流名称可直接编辑');
        } else {
            toolbar.classList.remove('active');
            editModeBtn.textContent = '编辑模式';
            editModeBtn.classList.remove('error');
            document.querySelectorAll('.workflow-item.editing').forEach(item => {
                item.classList.remove('editing');
            });
        }
    }

    async function saveEditedWorkflow() {
        if (!currentEditingWorkflow) return;

        const editInput = currentEditingWorkflow.querySelector('.workflow-edit-input');
        const newName = editInput.value.trim();
        const oldName = currentEditingWorkflow.dataset.workflowName;

        if (!newName) {
            showToast('error', '工作流名称不能为空');
            return;
        }

        currentEditingWorkflow.classList.remove('editing');
        currentEditingWorkflow = null;

        if (newName === oldName) return;

        const workflows = await getValue(STORAGE_KEY_WORKFLOWS, {});
        if (workflows[newName] && !confirm(`工作流"${newName}"已存在，是否覆盖？`)) {
            return;
        }

        workflows[newName] = workflows[oldName];
        delete workflows[oldName];
        await setValue(STORAGE_KEY_WORKFLOWS, workflows);

        showToast('success', `工作流已重命名为"${newName}"`);
        updateWorkflowList();
    }

    function cancelEditMode() {
        if (currentEditingWorkflow) {
            currentEditingWorkflow.classList.remove('editing');
            currentEditingWorkflow = null;
        }
        if (isEditMode) {
            toggleEditMode();
        }
    }

    function filterWorkflows(searchTerm) {
        document.querySelectorAll('.workflow-item').forEach(item => {
            const title = item.querySelector('.workflow-item-title').textContent.toLowerCase();
            item.style.display = title.includes(searchTerm) ? 'flex' : 'none';
        });
    }

    async function updateWorkflowList() {
        const listContainer = document.getElementById('workflow-list');
        if (!listContainer) return;

        const workflows = await getValue(STORAGE_KEY_WORKFLOWS, {});
        const currentWorkflowJSON = await getValue('comfyui_workflow', '');

        listContainer.innerHTML = '';

        if (Object.keys(workflows).length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-workflows-message';
            emptyMsg.textContent = '暂无保存的工作流，请创建或导入。';
            listContainer.appendChild(emptyMsg);
            return;
        }

        const sortedNames = Object.keys(workflows).sort();

        for (const name of sortedNames) {
            const workflowData = workflows[name];
            const isActive = workflowData === currentWorkflowJSON;
            const item = createWorkflowItem({ name, workflowData, isActive });
            listContainer.appendChild(item);
        }
    }

    function createWorkflowItem({ name, workflowData, isActive }) {
        const item = document.createElement('div');
        item.className = `workflow-item${isActive ? ' active' : ''}`;
        item.dataset.workflowName = name;

        const title = document.createElement('div');
        title.className = 'workflow-item-title';
        title.textContent = name;

        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'workflow-edit-input';
        editInput.value = name;

        const actions = document.createElement('div');
        actions.className = 'workflow-item-actions';
        actions.append(
            createActionButton('加载', 'workflow-load-btn', () => loadWorkflow(name, workflowData, item)),
            createActionButton('克隆', 'workflow-clone-btn', () => cloneWorkflow(name, workflowData)),
            createActionButton('重命名', 'workflow-rename-btn', () => renameWorkflow(name)),
            createActionButton('删除', 'error workflow-delete-btn', () => deleteWorkflow(name)),
        );

        item.append(title, editInput, actions);

        title.addEventListener('click', () => {
            if (isEditMode) {
                item.classList.toggle('editing');
                currentEditingWorkflow = item.classList.contains('editing') ? item : null;
                if (currentEditingWorkflow) {
                    editInput.focus();
                    editInput.select();
                }
            } else {
                loadWorkflow(name, workflowData, item);
            }
        });

        editInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') saveEditedWorkflow();
            else if (e.key === 'Escape') {
                item.classList.remove('editing');
                currentEditingWorkflow = null;
            }
        });

        return item;
    }

    function createActionButton(text, className, onClick) {
        const btn = document.createElement('button');
        btn.className = `comfy-button ${className}`;
        btn.textContent = text;
        btn.addEventListener('click', onClick);
        return btn;
    }

    async function cloneWorkflow(name, workflowData) {
        const workflows = await getValue(STORAGE_KEY_WORKFLOWS, {});
        let cloneName = `${name} - 副本`;
        let counter = 2;
        while (workflows[cloneName]) {
            cloneName = `${name} - 副本 ${counter++}`;
        }
        workflows[cloneName] = workflowData;
        await setValue(STORAGE_KEY_WORKFLOWS, workflows);
        showToast('success', `工作流已克隆为 "${cloneName}"`);
        updateWorkflowList();
    }

    async function renameWorkflow(oldName) {
        const newName = prompt(`请输入"${oldName}"的新名称:`, oldName);
        if (!newName || !newName.trim() || newName === oldName) return;

        const trimmedNewName = newName.trim();
        const workflows = await getValue(STORAGE_KEY_WORKFLOWS, {});
        if (workflows[trimmedNewName] && !confirm(`工作流"${trimmedNewName}"已存在，是否覆盖？`)) return;

        workflows[trimmedNewName] = workflows[oldName];
        delete workflows[oldName];
        await setValue(STORAGE_KEY_WORKFLOWS, workflows);
        showToast('success', `工作流已重命名为 "${trimmedNewName}"`);
        updateWorkflowList();
    }

    async function deleteWorkflow(name) {
        if (confirm(`确定要删除工作流 "${name}" 吗？此操作不可撤销。`)) {
            const workflows = await getValue(STORAGE_KEY_WORKFLOWS, {});
            delete workflows[name];
            await setValue(STORAGE_KEY_WORKFLOWS, workflows);
            showToast('success', `工作流 "${name}" 已删除`);
            updateWorkflowList();
        }
    }

    async function loadWorkflow(name, workflowData, workflowItem) {
        document.getElementById('comfyui-workflow').value = workflowData;
        await setValue('comfyui_workflow', workflowData);

        document.querySelectorAll('.workflow-item.active').forEach(item => item.classList.remove('active'));
        workflowItem?.classList.add('active');

        showToast('success', `已加载工作流 "${name}"`);
    }

    return {
        cancelEditMode,
        filterWorkflows,
        saveEditedWorkflow,
        toggleEditMode,
        updateWorkflowList,
    };
}
