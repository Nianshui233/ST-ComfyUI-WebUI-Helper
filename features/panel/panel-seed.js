import { MODES } from '../core/runtime-config.js';

function getRandomSeed() {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function getSeedInput(currentMode) {
    return currentMode === MODES.COMFYUI
        ? document.getElementById('comfyui-seed')
        : document.getElementById('webui-seed');
}

export function getPanelSeedForGeneration(currentMode) {
    const seedInput = getSeedInput(currentMode);
    const val = Number.parseInt(seedInput?.value, 10);
    if (!seedInput) {
        return getRandomSeed();
    }

    if (!seedInput.dataset.locked) {
        const autoSeed = Number.parseInt(seedInput.dataset.autoSeed || '', 10);
        if (Number.isNaN(val) || val < 0 || (!Number.isNaN(autoSeed) && autoSeed === val)) {
            return getRandomSeed();
        }
    }

    return (Number.isNaN(val) || val < 0) ? getRandomSeed() : val;
}

export function updatePanelSeedDisplay(currentMode, seed) {
    const seedInput = getSeedInput(currentMode);
    if (seedInput && !seedInput.dataset.locked) {
        seedInput.value = seed;
        seedInput.dataset.autoSeed = String(seed);
    }
}
