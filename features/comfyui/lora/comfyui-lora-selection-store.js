import { normalizeComfyUILoraItems } from './comfyui-lora.js';
import {
    formatDecimal,
    normalizeNumber,
    safeJsonParse,
} from '../../../lib/core/utils.js';

export const COMFYUI_SELECTED_LORAS_STORAGE_KEY = 'comfyui_selected_loras';

export function createComfyUILoraSelectionStore({
    getValue,
    setValue,
    logger = console,
}) {
    function persistSelected(items) {
        const normalized = normalizeComfyUILoraItems(items);
        localStorage.setItem(COMFYUI_SELECTED_LORAS_STORAGE_KEY, JSON.stringify(normalized));
        setValue(COMFYUI_SELECTED_LORAS_STORAGE_KEY, normalized).catch(error => {
            logger.warn('[AI Gen] 保存ComfyUI LoRA选择到GM存储失败:', error);
        });
    }

    async function syncSelectionStorage() {
        const localItems = normalizeComfyUILoraItems(
            safeJsonParse(localStorage.getItem(COMFYUI_SELECTED_LORAS_STORAGE_KEY) || '[]', [], COMFYUI_SELECTED_LORAS_STORAGE_KEY)
        );
        const storedItems = normalizeComfyUILoraItems(await getValue(COMFYUI_SELECTED_LORAS_STORAGE_KEY, []));
        const sourceItems = localItems.length > 0 ? localItems : storedItems;

        if (sourceItems.length > 0) {
            persistSelected(sourceItems);
        }
    }

    const manager = {
        getAll() {
            const parsed = safeJsonParse(localStorage.getItem(COMFYUI_SELECTED_LORAS_STORAGE_KEY) || '[]', [], COMFYUI_SELECTED_LORAS_STORAGE_KEY);
            const normalized = normalizeComfyUILoraItems(parsed);
            if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
                persistSelected(normalized);
            }
            return normalized;
        },
        setAll(items) {
            persistSelected(items);
        },
        add(name, modelWeight, clipWeight = modelWeight) {
            const items = this.getAll();
            if (!items.some(i => i.name === name)) {
                items.push({
                    name,
                    modelWeight: formatDecimal(modelWeight, 1),
                    clipWeight: formatDecimal(clipWeight, normalizeNumber(modelWeight, 1)),
                    triggerWords: '',
                    autoAppendTriggers: true,
                    enabled: true,
                });
                this.setAll(items);
            }
        },
        remove(name) {
            this.setAll(this.getAll().filter(i => i.name !== name));
        },
        update(name, patch) {
            const items = this.getAll();
            const item = items.find(i => i.name === name);
            if (item) {
                Object.assign(item, patch);
                this.setAll(items);
            }
        },
        updateWeight(name, modelWeight, clipWeight = modelWeight) {
            this.update(name, {
                modelWeight: formatDecimal(modelWeight, 1),
                clipWeight: formatDecimal(clipWeight, normalizeNumber(modelWeight, 1)),
            });
        },
        setEnabled(name, enabled) {
            this.update(name, { enabled });
        },
        updateTriggers(name, triggerWords, autoAppendTriggers) {
            this.update(name, {
                triggerWords: String(triggerWords || '').trim(),
                autoAppendTriggers: autoAppendTriggers !== false,
            });
        },
        clear() {
            this.setAll([]);
        },
    };

    return {
        manager,
        syncSelectionStorage,
    };
}
