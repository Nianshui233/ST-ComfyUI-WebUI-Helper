import { createSelectionManager } from '../../ui/presets/selection-manager.js';

export function createEmbeddingController({
    safeJsonParse,
}) {
    let availableEmbeddings = [];

    const embeddingManager = createSelectionManager({
        storageKey: 'selected_embeddings',
        tagClass: 'selected-embedding-tag',
        emptyText: '暂未选择Embedding',
    }, {
        safeJsonParse,
    });

    function setAvailableEmbeddings(embeddings) {
        availableEmbeddings = Array.isArray(embeddings) ? embeddings : [];
    }

    function getCurrentSelectedEmbeddings() {
        return embeddingManager.getAll();
    }

    function addSelectedEmbedding(name, weight, type = 'positive') {
        embeddingManager.add(name, weight, { type });
    }

    function removeSelectedEmbedding(name) {
        embeddingManager.remove(name);
    }

    function updateSelectedEmbeddingWeight(name, weight) {
        embeddingManager.updateWeight(name, weight);
    }

    function renderEmbeddingList() {
        const embeddingList = document.getElementById('embedding-list');
        if (!embeddingList) return;

        const selectedEmbeddings = getCurrentSelectedEmbeddings();
        embeddingList.innerHTML = '';

        availableEmbeddings.forEach(embedding => {
            const isSelected = selectedEmbeddings.some(selected => selected.name === embedding.name);
            const selectedData = selectedEmbeddings.find(selected => selected.name === embedding.name) || { weight: 1.0, type: 'positive' };

            const item = document.createElement('div');
            item.className = 'embedding-item';

            const info = document.createElement('div');
            info.className = 'embedding-info';
            const nameDiv = document.createElement('div');
            nameDiv.className = 'embedding-name';
            nameDiv.textContent = embedding.name;
            info.appendChild(nameDiv);

            const controls = document.createElement('div');
            controls.className = 'embedding-controls';

            const weightInput = document.createElement('input');
            weightInput.type = 'number';
            weightInput.className = 'embedding-weight';
            weightInput.min = '0';
            weightInput.max = '2';
            weightInput.step = '0.1';
            weightInput.value = selectedData.weight;
            weightInput.disabled = !isSelected;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'embedding-checkbox';
            checkbox.checked = isSelected;

            controls.append(weightInput, checkbox);
            item.append(info, controls);
            embeddingList.appendChild(item);

            checkbox.addEventListener('change', () => {
                weightInput.disabled = !checkbox.checked;
                if (checkbox.checked) {
                    addSelectedEmbedding(embedding.name, parseFloat(weightInput.value));
                } else {
                    removeSelectedEmbedding(embedding.name);
                }
                updateSelectedEmbeddingsDisplay();
            });

            weightInput.addEventListener('input', () => {
                if (checkbox.checked) {
                    updateSelectedEmbeddingWeight(embedding.name, parseFloat(weightInput.value));
                    updateSelectedEmbeddingsDisplay();
                }
            });
        });
    }

    function updateSelectedEmbeddingsDisplay() {
        embeddingManager.renderSelected('selected-embeddings-container', (name) => {
            removeSelectedEmbedding(name);
            renderEmbeddingList();
            updateSelectedEmbeddingsDisplay();
        });
    }

    function generateEmbeddingPromptString(isPositive = true) {
        const type = isPositive ? 'positive' : 'negative';
        return getCurrentSelectedEmbeddings()
            .filter(emb => (emb.type || 'positive') === type)
            .map(emb => emb.weight === 1.0 ? emb.name : `(${emb.name}:${emb.weight})`)
            .join(', ');
    }

    return {
        generateEmbeddingPromptString,
        renderEmbeddingList,
        setAvailableEmbeddings,
        updateSelectedEmbeddingsDisplay,
    };
}
