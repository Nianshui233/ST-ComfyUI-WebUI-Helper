import { MODES } from '../core/runtime-config.js';
import {
    getFallbackPanelTab,
    isPanelTabVisibleForMode,
} from './panel-state-restore.js';

export function updatePanelModeUI({
    currentMode,
    moveModeSections,
    moveAdvancedSectionsToTab,
}) {
    moveModeSections(currentMode);
    const activeTab = document.querySelector('.tab-button.active');
    if (!activeTab || activeTab.style.display === 'none' || !isPanelTabVisibleForMode(activeTab.dataset.tab, currentMode)) {
        const fallbackTab = getFallbackPanelTab(currentMode);
        document.querySelector(`[data-tab="${fallbackTab}"]`)?.click();
    } else if (activeTab && ['generation', 'img2img', 'prompts'].includes(activeTab.dataset.tab)) {
        moveAdvancedSectionsToTab(activeTab.dataset.tab, currentMode);
    }
}

export function moveAdvancedSectionsToPanelTab(tabId, currentMode) {
    const source = document.getElementById('tab-generation');
    const target = document.getElementById(`tab-${tabId}`);
    if (!source || !target) return;

    const targetClass = `advanced-${tabId}-section`;
    if (target !== source) {
        document.querySelectorAll(`#tab-${tabId} .advanced-section`).forEach(el => source.appendChild(el));
        document.querySelectorAll(`.${targetClass}`).forEach(el => target.appendChild(el));
    }

    document.querySelectorAll('.advanced-section').forEach(section => {
        const matchesTab = section.classList.contains(targetClass);
        const matchesMode = (
            !section.classList.contains('comfyui-settings') && !section.classList.contains('webui-settings') && !section.classList.contains('api-settings')
        ) || (
            currentMode === MODES.COMFYUI && section.classList.contains('comfyui-settings')
        ) || (
            currentMode === MODES.WEBUI && section.classList.contains('webui-settings')
        ) || (
            currentMode === MODES.API && section.classList.contains('api-settings')
        );
        section.style.display = matchesTab && matchesMode ? '' : 'none';
    });
}
