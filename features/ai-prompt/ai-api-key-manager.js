import {
    STORAGE_KEY_AI_PROMPT_API_KEYS,
    STORAGE_KEY_AI_PROMPT_LAST_API_KEY,
} from '../core/runtime-config.js';

function maskApiKeyForDisplay(key) {
    const text = String(key || '').trim();
    if (!text) return '空 Key';
    if (text.length <= 8) return `****${text.slice(-2)}`;
    return `${text.slice(0, 3)}...${text.slice(-4)}`;
}

export function createAiPromptApiKeyManager({
    inputs,
    getValue,
    setValue,
    saveSettings,
    scheduleModelDetection,
    showToast,
}) {
    const select = document.getElementById('comfyui-ai-prompt-api-key-select');
    const loadBtn = document.getElementById('comfyui-ai-prompt-api-key-load');
    const saveBtn = document.getElementById('comfyui-ai-prompt-api-key-save');
    const deleteBtn = document.getElementById('comfyui-ai-prompt-api-key-delete');
    const modal = document.getElementById('ai-prompt-api-key-save-modal');
    const nameInput = document.getElementById('ai-prompt-api-key-name-input');
    const warning = document.getElementById('ai-prompt-api-key-overwrite-warning');
    const confirmBtn = document.getElementById('ai-prompt-api-key-save-confirm');
    const cancelBtn = document.getElementById('ai-prompt-api-key-save-cancel');

    if (!select || !loadBtn || !saveBtn || !deleteBtn || !modal || !nameInput || !warning || !confirmBtn || !cancelBtn) {
        return { loadPresets: async () => {} };
    }

    async function loadPresets(preferredValue = select.value) {
        const keys = await getValue(STORAGE_KEY_AI_PROMPT_API_KEYS, {});
        select.innerHTML = '<option value="">选择已保存的 Key...</option>';
        const names = Object.keys(keys).sort();
        names.forEach(name => {
            const item = keys[name] || {};
            const option = document.createElement('option');
            option.value = name;
            option.textContent = `${name} (${maskApiKeyForDisplay(item.key)})`;
            select.appendChild(option);
        });
        const remembered = preferredValue || await getValue(STORAGE_KEY_AI_PROMPT_LAST_API_KEY, '');
        select.value = names.includes(remembered) ? remembered : '';
        await setValue(STORAGE_KEY_AI_PROMPT_LAST_API_KEY, select.value);
    }

    async function saveKey(name) {
        const key = String(inputs.aiPromptApiKey?.value || '').trim();
        if (!key) {
            showToast('warning', '请先填写要保存的 API Key');
            return;
        }

        const keys = await getValue(STORAGE_KEY_AI_PROMPT_API_KEYS, {});
        keys[name] = {
            key,
            timestamp: Date.now(),
        };
        await setValue(STORAGE_KEY_AI_PROMPT_API_KEYS, keys);
        await loadPresets(name);
        await setValue(STORAGE_KEY_AI_PROMPT_LAST_API_KEY, name);
        showToast('success', `API Key "${name}" 已保存`);
    }

    async function loadSelected() {
        if (!select.value) {
            showToast('warning', '请先选择一个 API Key');
            return;
        }

        await setValue(STORAGE_KEY_AI_PROMPT_LAST_API_KEY, select.value);
        const keys = await getValue(STORAGE_KEY_AI_PROMPT_API_KEYS, {});
        const item = keys[select.value];
        if (!item) {
            showToast('error', '选中的 API Key 不存在');
            await loadPresets();
            return;
        }

        if (inputs.aiPromptApiKey) {
            inputs.aiPromptApiKey.value = String(item.key || '');
            inputs.aiPromptApiKey.dispatchEvent(new Event('input', { bubbles: true }));
        }

        await saveSettings(inputs);
        scheduleModelDetection?.();
        showToast('success', `已套用 API Key "${select.value}"`);
    }

    async function deleteSelected() {
        if (!select.value) {
            showToast('warning', '请先选择一个 API Key');
            return;
        }

        const name = select.value;
        if (!confirm(`确定要删除 API Key "${name}" 吗？此操作不可撤销。`)) return;

        const keys = await getValue(STORAGE_KEY_AI_PROMPT_API_KEYS, {});
        delete keys[name];
        await setValue(STORAGE_KEY_AI_PROMPT_API_KEYS, keys);
        await setValue(STORAGE_KEY_AI_PROMPT_LAST_API_KEY, '');
        await loadPresets();
        showToast('success', `API Key "${name}" 已删除`);
    }

    async function showSaveModal() {
        const key = String(inputs.aiPromptApiKey?.value || '').trim();
        if (!key) {
            showToast('warning', '请先填写要保存的 API Key');
            return;
        }

        nameInput.value = select.value || '';
        const keys = await getValue(STORAGE_KEY_AI_PROMPT_API_KEYS, {});
        warning.style.display = nameInput.value.trim() && keys[nameInput.value.trim()] ? 'block' : 'none';
        modal.style.display = 'block';
        setTimeout(() => {
            nameInput.focus();
            nameInput.select();
        }, 100);
    }

    select.addEventListener('change', () => {
        setValue(STORAGE_KEY_AI_PROMPT_LAST_API_KEY, select.value || '');
    });

    loadBtn.addEventListener('click', loadSelected);
    saveBtn.addEventListener('click', showSaveModal);
    deleteBtn.addEventListener('click', deleteSelected);

    nameInput.addEventListener('input', async () => {
        const keys = await getValue(STORAGE_KEY_AI_PROMPT_API_KEYS, {});
        warning.style.display = nameInput.value.trim() && keys[nameInput.value.trim()] ? 'block' : 'none';
    });

    confirmBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        if (!name) {
            showToast('error', '请输入 API Key 名称');
            return;
        }
        await saveKey(name);
        modal.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => modal.style.display = 'none');

    loadPresets();
    return { loadPresets };
}
