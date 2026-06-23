import { getComfyUILoraFolder } from './comfyui-lora.js';
import { normalizeNumber } from '../../../lib/core/utils.js';

export function createComfyUILoraListRenderer({
    getAvailableLoras,
    getCurrentSelectedLoras,
    addSelectedLora,
    removeSelectedLora,
    updateSelectedLoraWeight,
    updateSelectedLorasDisplay,
}) {
    function renderFolderOptions(selectedFolder = '') {
        const folderSelect = document.getElementById('comfyui-lora-folder-filter');
        if (!folderSelect) return;

        const folders = [...new Set(getAvailableLoras().map(lora => getComfyUILoraFolder(lora.name)))].sort();
        const currentValue = folders.includes(selectedFolder) ? selectedFolder : '';
        folderSelect.innerHTML = '<option value="">全部目录</option>';

        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder;
            option.textContent = folder;
            folderSelect.appendChild(option);
        });
        folderSelect.value = currentValue;
    }

    function getFilterState() {
        return {
            searchTerm: (document.getElementById('comfyui-lora-search')?.value || '').trim().toLowerCase(),
            folderFilter: document.getElementById('comfyui-lora-folder-filter')?.value || '',
        };
    }

    function getFilteredLoras(searchTerm, folderFilter) {
        const filter = {
            searchTerm: searchTerm ?? getFilterState().searchTerm,
            folderFilter: folderFilter ?? getFilterState().folderFilter,
        };

        return getAvailableLoras().filter(lora => {
            const folder = getComfyUILoraFolder(lora.name);
            const matchesFolder = !filter.folderFilter || folder === filter.folderFilter;
            const matchesSearch = !filter.searchTerm || lora.name.toLowerCase().includes(filter.searchTerm);
            return matchesFolder && matchesSearch;
        });
    }

    function createWeightInput(value, title, disabled) {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'lora-weight';
        input.min = '0';
        input.max = '2';
        input.step = '0.05';
        input.value = value;
        input.title = title;
        input.disabled = disabled;
        return input;
    }

    function renderLoraItem(lora, selectedByName) {
        const folder = getComfyUILoraFolder(lora.name);
        const isSelected = selectedByName.has(lora.name);
        const selectedData = selectedByName.get(lora.name) || {
            modelWeight: 1.0,
            clipWeight: 1.0,
            enabled: true,
        };

        const loraItem = document.createElement('div');
        loraItem.className = 'lora-item';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'lora-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'lora-name';
        nameDiv.textContent = lora.name;

        const aliasDiv = document.createElement('div');
        aliasDiv.className = 'lora-alias';
        aliasDiv.textContent = folder;
        infoDiv.append(nameDiv, aliasDiv);

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'lora-controls';

        const modelWeightInput = createWeightInput(selectedData.modelWeight, '模型强度', !isSelected);
        const clipWeightInput = createWeightInput(selectedData.clipWeight, 'CLIP强度', !isSelected);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'lora-checkbox';
        checkbox.checked = isSelected;
        checkbox.title = '加入已选LoRA';

        controlsDiv.append(modelWeightInput, clipWeightInput, checkbox);
        loraItem.append(infoDiv, controlsDiv);

        checkbox.addEventListener('change', () => {
            modelWeightInput.disabled = !checkbox.checked;
            clipWeightInput.disabled = !checkbox.checked;
            if (checkbox.checked) {
                addSelectedLora(
                    lora.name,
                    normalizeNumber(modelWeightInput.value, 1),
                    normalizeNumber(clipWeightInput.value, normalizeNumber(modelWeightInput.value, 1))
                );
            } else {
                removeSelectedLora(lora.name);
            }
            updateSelectedLorasDisplay();
        });

        const updateWeights = () => {
            if (checkbox.checked) {
                updateSelectedLoraWeight(
                    lora.name,
                    normalizeNumber(modelWeightInput.value, 1),
                    normalizeNumber(clipWeightInput.value, normalizeNumber(modelWeightInput.value, 1))
                );
                updateSelectedLorasDisplay();
            }
        };
        modelWeightInput.addEventListener('input', updateWeights);
        clipWeightInput.addEventListener('input', updateWeights);

        return loraItem;
    }

    function renderLoraList() {
        const loraListContainer = document.getElementById('comfyui-lora-list');
        if (!loraListContainer) return;

        const selectedLoras = getCurrentSelectedLoras();
        const selectedByName = new Map(selectedLoras.map(lora => [lora.name, lora]));
        const folderFilter = document.getElementById('comfyui-lora-folder-filter')?.value || '';

        loraListContainer.innerHTML = '';
        renderFolderOptions(folderFilter);

        const filteredLoras = getFilteredLoras();
        if (filteredLoras.length === 0) {
            loraListContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">没有匹配的LoRA</div>';
            return;
        }

        let currentFolder = null;
        filteredLoras.forEach(lora => {
            const folder = getComfyUILoraFolder(lora.name);
            if (folder !== currentFolder) {
                currentFolder = folder;
                const header = document.createElement('div');
                header.className = 'lora-group-header';
                header.textContent = folder;
                loraListContainer.appendChild(header);
            }

            loraListContainer.appendChild(renderLoraItem(lora, selectedByName));
        });
    }

    return {
        getFilteredLoras,
        renderFolderOptions,
        renderLoraList,
    };
}
