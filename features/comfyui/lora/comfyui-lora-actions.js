import { normalizeComfyUILoraItems } from './comfyui-lora.js';
import { downloadJsonFile, formatDecimal } from '../../../lib/core/utils.js';

function getBulkWeights() {
    const modelWeight = formatDecimal(document.getElementById('comfyui-lora-bulk-model')?.value, 1);
    const clipWeight = formatDecimal(document.getElementById('comfyui-lora-bulk-clip')?.value, modelWeight);
    return { modelWeight, clipWeight };
}

function buildExportPayload(getCurrentSelectedLoras) {
    return {
        type: 'ST-ComfyUI-WebUI-Helper ComfyUI LoRA selection',
        version: 1,
        exportedAt: new Date().toISOString(),
        loras: getCurrentSelectedLoras(),
    };
}

function extractLorasFromImport(imported) {
    if (Array.isArray(imported)) return imported;
    if (Array.isArray(imported?.loras)) return imported.loras;
    if (Array.isArray(imported?.settings?.comfyui_selected_loras)) return imported.settings.comfyui_selected_loras;
    if (Array.isArray(imported?.comfyui_selected_loras)) return imported.comfyui_selected_loras;
    return [];
}

export function createComfyUILoraActions({
    manager,
    getCurrentSelectedLoras,
    getFilteredLoras,
    refreshUI,
    copyTextToClipboard,
    showToast,
}) {
    function applyPreset(presetLoras, mode = 'replace') {
        const incoming = normalizeComfyUILoraItems(presetLoras);
        if (mode === 'replace') {
            manager.setAll(incoming);
            refreshUI();
            return;
        }

        const current = getCurrentSelectedLoras();
        const byName = new Map(current.map(lora => [lora.name, lora]));

        incoming.forEach(lora => {
            if (mode === 'append' && byName.has(lora.name)) return;
            byName.set(lora.name, lora);
        });

        manager.setAll([...byName.values()]);
        refreshUI();
    }

    function applyBulkWeights() {
        const items = getCurrentSelectedLoras();
        if (items.length === 0) {
            showToast('warning', '请先选择至少一个ComfyUI LoRA');
            return;
        }

        const { modelWeight, clipWeight } = getBulkWeights();
        manager.setAll(items.map(item => ({ ...item, modelWeight, clipWeight })));
        refreshUI();
        showToast('success', `已将 ${items.length} 个LoRA权重设为 ${modelWeight}/${clipWeight}`);
    }

    function selectFilteredLoras(mode = 'add') {
        const filtered = getFilteredLoras();
        if (filtered.length === 0) {
            showToast('warning', '当前过滤条件下没有LoRA');
            return;
        }

        const { modelWeight, clipWeight } = getBulkWeights();
        const byName = new Map(getCurrentSelectedLoras().map(lora => [lora.name, lora]));

        filtered.forEach(lora => {
            if (mode === 'toggle' && byName.has(lora.name)) {
                byName.delete(lora.name);
                return;
            }

            if (byName.has(lora.name)) {
                byName.set(lora.name, { ...byName.get(lora.name), enabled: true });
            } else {
                byName.set(lora.name, {
                    name: lora.name,
                    modelWeight,
                    clipWeight,
                    enabled: true,
                });
            }
        });

        manager.setAll([...byName.values()]);
        refreshUI();
        showToast('success', `${mode === 'toggle' ? '已反选' : '已选择'}当前过滤结果 (${filtered.length} 个)`);
    }

    function setAllEnabled(enabled) {
        const items = getCurrentSelectedLoras();
        if (items.length === 0) {
            showToast('warning', '当前没有已选LoRA');
            return;
        }

        manager.setAll(items.map(item => ({ ...item, enabled })));
        refreshUI();
        showToast('success', `已${enabled ? '启用' : '禁用'} ${items.length} 个LoRA`);
    }

    function moveSelectedLora(name, direction) {
        const items = getCurrentSelectedLoras();
        const index = items.findIndex(item => item.name === name);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= items.length) return;

        [items[index], items[target]] = [items[target], items[index]];
        manager.setAll(items);
        refreshUI();
    }

    function clearSelection({ ask = true } = {}) {
        if (getCurrentSelectedLoras().length === 0) return;
        if (ask && !confirm('确定要清空当前选择的ComfyUI LoRA吗？')) return;
        manager.clear();
        refreshUI();
        showToast('success', '已清空ComfyUI LoRA选择');
    }

    async function copySelection() {
        const payload = buildExportPayload(getCurrentSelectedLoras);
        if (payload.loras.length === 0) {
            showToast('warning', '当前没有已选LoRA可复制');
            return;
        }

        const text = JSON.stringify(payload, null, 2);
        try {
            await copyTextToClipboard(text, `已复制 ${payload.loras.length} 个LoRA配置`);
        } catch (error) {
            showToast('error', `复制LoRA配置失败: ${error.message}`);
        }
    }

    function exportSelection() {
        const payload = buildExportPayload(getCurrentSelectedLoras);
        if (payload.loras.length === 0) {
            showToast('warning', '当前没有已选LoRA可导出');
            return;
        }

        downloadJsonFile(payload, `comfyui_lora_selection_${new Date().toISOString().slice(0, 10)}.json`);
        showToast('success', `已导出 ${payload.loras.length} 个LoRA配置`);
    }

    function importSelection() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            try {
                const imported = JSON.parse(await file.text());
                const importedLoras = normalizeComfyUILoraItems(extractLorasFromImport(imported));
                if (importedLoras.length === 0) {
                    throw new Error('文件中没有可导入的ComfyUI LoRA配置');
                }

                const mode = document.getElementById('comfyui-lora-preset-mode')?.value || 'replace';
                applyPreset(importedLoras, mode);
                showToast('success', `已导入 ${importedLoras.length} 个LoRA配置 (${mode})`);
            } catch (error) {
                showToast('error', `导入LoRA配置失败: ${error.message}`);
            }
        };
        input.click();
    }

    return {
        applyBulkWeights,
        applyPreset,
        clearSelection,
        copySelection,
        exportSelection,
        importSelection,
        moveSelectedLora,
        selectFilteredLoras,
        setAllEnabled,
    };
}
