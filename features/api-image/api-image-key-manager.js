import { STORAGE_KEY_API_IMAGE_API_KEYS } from '../core/runtime-config.js';

function maskApiKeyForDisplay(key) {
    const text = String(key || '').trim();
    if (!text) return '空 Key';
    if (text.length <= 8) return `****${text.slice(-2)}`;
    return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

export function createApiImageKeyManager({
    inputs,
    getValue,
    setValue,
    saveSettings,
    showToast,
}) {
    const select = inputs.apiImageApiKeySelect;
    const loadBtn = document.getElementById('comfyui-api-image-api-key-load');
    const saveBtn = document.getElementById('comfyui-api-image-api-key-save');
    const deleteBtn = document.getElementById('comfyui-api-image-api-key-delete');

    if (!select || !loadBtn || !saveBtn || !deleteBtn) {
        return { loadPresets: async () => {} };
    }

    async function loadPresets(preferredValue = select.value) {
        const keys = await getValue(STORAGE_KEY_API_IMAGE_API_KEYS, {});
        select.innerHTML = '<option value="">选择已保存的 Key...</option>';
        const names = Object.keys(keys).sort((a, b) => a.localeCompare(b));
        names.forEach(name => {
            const item = keys[name] || {};
            const option = document.createElement('option');
            option.value = name;
            option.textContent = `${name} (${maskApiKeyForDisplay(item.key)})`;
            select.appendChild(option);
        });
        select.value = names.includes(preferredValue) ? preferredValue : '';
    }

    async function loadSelected() {
        if (!select.value) {
            showToast('warning', '请先选择一个 API 生图 Key');
            return;
        }

        const keys = await getValue(STORAGE_KEY_API_IMAGE_API_KEYS, {});
        const item = keys[select.value];
        if (!item) {
            showToast('error', '选中的 API 生图 Key 不存在');
            await loadPresets();
            return;
        }

        if (inputs.apiImageApiKey) {
            inputs.apiImageApiKey.value = String(item.key || '');
            inputs.apiImageApiKey.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (item.provider && inputs.apiImageProvider) {
            inputs.apiImageProvider.value = item.provider;
            inputs.apiImageProvider.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (item.url && inputs.apiImageUrl) {
            inputs.apiImageUrl.value = item.url;
            inputs.apiImageUrl.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (item.model && inputs.apiImageModel) {
            inputs.apiImageModel.value = item.model;
            inputs.apiImageModel.dispatchEvent(new Event('input', { bubbles: true }));
        }

        await saveSettings(inputs);
        showToast('success', `已套用 API 生图 Key "${select.value}"`);
    }

    async function saveCurrentKey() {
        const key = String(inputs.apiImageApiKey?.value || '').trim();
        if (!key) {
            showToast('warning', '请先填写要保存的 API Key');
            return;
        }

        const defaultName = select.value || inputs.apiImageProvider?.selectedOptions?.[0]?.textContent || 'API 生图';
        const name = prompt('给这个 API Key 起个名字：', defaultName);
        if (!name) return;
        const cleanName = name.trim();
        if (!cleanName) {
            showToast('warning', 'API Key 名称不能为空');
            return;
        }

        const keys = await getValue(STORAGE_KEY_API_IMAGE_API_KEYS, {});
        keys[cleanName] = {
            key,
            provider: inputs.apiImageProvider?.value || '',
            url: inputs.apiImageUrl?.value || '',
            model: inputs.apiImageModel?.value || '',
            timestamp: Date.now(),
        };
        await setValue(STORAGE_KEY_API_IMAGE_API_KEYS, keys);
        await loadPresets(cleanName);
        showToast('success', `API 生图 Key "${cleanName}" 已保存`);
    }

    async function deleteSelected() {
        if (!select.value) {
            showToast('warning', '请先选择一个 API 生图 Key');
            return;
        }

        const name = select.value;
        if (!confirm(`确定要删除 API 生图 Key "${name}" 吗？此操作不可撤销。`)) return;

        const keys = await getValue(STORAGE_KEY_API_IMAGE_API_KEYS, {});
        delete keys[name];
        await setValue(STORAGE_KEY_API_IMAGE_API_KEYS, keys);
        await loadPresets();
        showToast('success', `API 生图 Key "${name}" 已删除`);
    }

    loadBtn.addEventListener('click', loadSelected);
    saveBtn.addEventListener('click', saveCurrentKey);
    deleteBtn.addEventListener('click', deleteSelected);

    loadPresets();
    return { loadPresets };
}
