import { normalizeNumber } from '../../../lib/core/utils.js';

function createWeightInput(value, title) {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'lora-weight';
    input.min = '0';
    input.max = '2';
    input.step = '0.05';
    input.value = value;
    input.title = title;
    return input;
}

export function createComfyUISelectedLoraRenderer({
    getCurrentSelectedLoras,
    setSelectedLoraEnabled,
    updateSelectedLoraWeight,
    updateSelectedLoraTriggers,
    removeSelectedLora,
    moveSelectedLora,
    renderLoraList,
}) {
    function createOrderButton({ text, title, disabled, onClick }) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'comfy-button selected-lora-order-btn';
        button.textContent = text;
        button.title = title;
        button.disabled = disabled;
        button.addEventListener('click', onClick);
        return button;
    }

    function renderSelectedLoraRow(item, index, itemCount, updateSelectedLorasDisplay) {
        const row = document.createElement('div');
        row.className = `selected-lora-row${item.enabled === false ? ' disabled' : ''}`;

        const mainRow = document.createElement('div');
        mainRow.className = 'selected-lora-main';

        const enabled = document.createElement('input');
        enabled.type = 'checkbox';
        enabled.checked = item.enabled !== false;
        enabled.title = '启用/禁用';

        const name = document.createElement('div');
        name.className = 'selected-lora-name';
        name.textContent = item.name;

        const modelWeight = createWeightInput(item.modelWeight, '模型强度');
        const clipWeight = createWeightInput(item.clipWeight, 'CLIP强度');

        const orderControls = document.createElement('div');
        orderControls.className = 'selected-lora-order';
        orderControls.append(
            createOrderButton({
                text: '↑',
                title: '上移',
                disabled: index === 0,
                onClick: () => moveSelectedLora(item.name, -1),
            }),
            createOrderButton({
                text: '↓',
                title: '下移',
                disabled: index === itemCount - 1,
                onClick: () => moveSelectedLora(item.name, 1),
            }),
        );

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'comfy-button error selected-lora-remove';
        removeBtn.textContent = '删除';

        const triggerRow = document.createElement('div');
        triggerRow.className = 'selected-lora-triggers';

        const triggerInput = document.createElement('input');
        triggerInput.type = 'text';
        triggerInput.className = 'selected-lora-trigger-input';
        triggerInput.value = item.triggerWords || '';
        triggerInput.placeholder = '触发词，多个用逗号分隔';
        triggerInput.title = '生成时可自动追加到正向提示词';

        const triggerToggleLabel = document.createElement('label');
        triggerToggleLabel.className = 'selected-lora-trigger-toggle';

        const triggerToggle = document.createElement('input');
        triggerToggle.type = 'checkbox';
        triggerToggle.checked = item.autoAppendTriggers !== false;

        const triggerToggleText = document.createElement('span');
        triggerToggleText.textContent = '自动追加';
        triggerToggleLabel.append(triggerToggle, triggerToggleText);
        triggerRow.append(triggerInput, triggerToggleLabel);

        enabled.addEventListener('change', () => {
            setSelectedLoraEnabled(item.name, enabled.checked);
            renderLoraList();
            updateSelectedLorasDisplay();
        });

        const updateWeights = () => {
            updateSelectedLoraWeight(
                item.name,
                normalizeNumber(modelWeight.value, 1),
                normalizeNumber(clipWeight.value, normalizeNumber(modelWeight.value, 1))
            );
            renderLoraList();
        };
        modelWeight.addEventListener('input', updateWeights);
        clipWeight.addEventListener('input', updateWeights);

        const updateTriggers = () => {
            updateSelectedLoraTriggers(item.name, triggerInput.value, triggerToggle.checked);
        };
        triggerInput.addEventListener('input', updateTriggers);
        triggerToggle.addEventListener('change', updateTriggers);

        removeBtn.addEventListener('click', () => {
            removeSelectedLora(item.name);
            renderLoraList();
            updateSelectedLorasDisplay();
        });

        mainRow.append(enabled, name, modelWeight, clipWeight, orderControls, removeBtn);
        row.append(mainRow, triggerRow);
        return row;
    }

    function updateSelectedLorasDisplay() {
        const container = document.getElementById('comfyui-selected-loras-container');
        const count = document.getElementById('comfyui-selected-loras-count');
        if (!container) return;

        const items = getCurrentSelectedLoras();
        const enabledCount = items.filter(lora => lora.enabled !== false).length;
        if (count) count.textContent = `${enabledCount}/${items.length}`;

        container.innerHTML = '';
        if (items.length === 0) {
            container.innerHTML = '<div style="color: #888; font-style: italic;">暂未选择ComfyUI LoRA</div>';
            return;
        }

        items.forEach((item, index) => {
            container.appendChild(renderSelectedLoraRow(item, index, items.length, updateSelectedLorasDisplay));
        });
    }

    return {
        updateSelectedLorasDisplay,
    };
}
