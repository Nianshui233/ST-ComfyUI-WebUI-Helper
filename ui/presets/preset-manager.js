export function createPresetManager(config, deps) {
    const { getValue, setValue, showToast } = deps;
    const select = document.getElementById(config.selectElementId);
    const loadBtn = document.getElementById(config.loadButtonId);
    const saveBtn = document.getElementById(config.saveButtonId);
    const deleteBtn = document.getElementById(config.deleteButtonId);
    const modal = document.getElementById(config.modalId);
    const nameInput = document.getElementById(config.nameInputId);
    const warning = document.getElementById(config.overwriteWarningId);
    const confirmBtn = document.getElementById(config.saveConfirmButtonId);
    const cancelBtn = document.getElementById(config.saveCancelButtonId);

    async function loadPresets(preferredValue = select.value) {
        const presets = await getValue(config.storageKey, {});
        select.innerHTML = `<option value="">选择${config.presetType}预设...</option>`;
        const names = Object.keys(presets).sort();
        names.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
        select.value = names.includes(preferredValue) ? preferredValue : '';
    }

    async function savePreset(presetName) {
        const data = config.getCurrentData();
        const presets = await getValue(config.storageKey, {});
        presets[presetName] = { ...data, timestamp: Date.now() };
        await setValue(config.storageKey, presets);
        await loadPresets(presetName);
        showToast('success', `${config.presetType}预设 "${presetName}" 已保存`);
    }

    async function loadSelected() {
        if (!select.value) {
            showToast('warning', `请先选择一个${config.presetType}预设`);
            return;
        }
        const presets = await getValue(config.storageKey, {});
        const preset = presets[select.value];
        if (preset) {
            if (config.shouldConfirmLoad && config.shouldConfirmLoad(preset, select.value)) {
                const ok = confirm(`当前${config.presetType}内容将被覆盖，确定要加载 "${select.value}" 吗？`);
                if (!ok) return;
            }
            await config.applyPreset(preset);
            showToast('success', `已加载${config.presetType}预设 "${select.value}"`);
        }
    }

    async function deleteSelected() {
        if (!select.value) {
            showToast('warning', `请先选择一个${config.presetType}预设`);
            return;
        }
        if (confirm(`确定要删除${config.presetType}预设 "${select.value}" 吗？此操作不可撤销。`)) {
            const presets = await getValue(config.storageKey, {});
            delete presets[select.value];
            await setValue(config.storageKey, presets);
            await loadPresets();
            showToast('success', `${config.presetType}预设 "${select.value}" 已删除`);
        }
    }

    function showSaveModal() {
        if (config.canSave && !config.canSave()) {
            showToast('warning', `没有可保存的${config.presetType}配置`);
            return;
        }
        nameInput.value = select.value || '';
        warning.style.display = select.value ? 'block' : 'none';
        modal.style.display = 'block';
        setTimeout(() => {
            nameInput.focus();
            nameInput.select();
        }, 100);
    }

    loadBtn.addEventListener('click', loadSelected);
    saveBtn.addEventListener('click', showSaveModal);
    deleteBtn.addEventListener('click', deleteSelected);

    nameInput.addEventListener('input', async () => {
        const presets = await getValue(config.storageKey, {});
        warning.style.display = (nameInput.value.trim() && presets[nameInput.value.trim()]) ? 'block' : 'none';
    });

    confirmBtn.addEventListener('click', async () => {
        const presetName = nameInput.value.trim();
        if (!presetName) {
            showToast('error', '请输入预设名称');
            return;
        }
        await savePreset(presetName);
        modal.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => modal.style.display = 'none');

    loadPresets();

    return { loadPresets };
}
