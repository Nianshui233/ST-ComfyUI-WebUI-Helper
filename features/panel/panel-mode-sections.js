import { MODES } from '../core/runtime-config.js';
import { isPanelTabVisibleForMode } from './panel-state-restore.js';

export function moveModeSections(currentMode) {
    document.querySelectorAll('.mode-switch-option').forEach(btn => {
        btn.classList.remove('active', MODES.COMFYUI, MODES.WEBUI, MODES.API);
        if (btn.dataset.mode === currentMode) {
            btn.classList.add('active', currentMode);
        }
    });

    const statusElement = document.querySelector('.mode-status');
    if (statusElement) {
        const modeLabel = {
            [MODES.COMFYUI]: 'ComfyUI',
            [MODES.WEBUI]: 'WebUI',
            [MODES.API]: 'API 生图',
        }[currentMode] || currentMode;
        statusElement.textContent = `当前模式: ${modeLabel}`;
    }

    const comfySettings = document.querySelectorAll('.comfyui-settings');
    const webuiSettings = document.querySelectorAll('.webui-settings');
    const apiSettings = document.querySelectorAll('.api-settings');
    const displayComfy = currentMode === MODES.COMFYUI;
    const displayWebui = currentMode === MODES.WEBUI;
    const displayApi = currentMode === MODES.API;

    comfySettings.forEach(el => {
        el.classList.toggle('hidden', !displayComfy);
        if (!el.classList.contains('tab-content') && !el.classList.contains('tab-button')) {
            el.style.display = displayComfy ? '' : 'none';
        }
    });

    webuiSettings.forEach(el => {
        el.classList.toggle('active', displayWebui);
        if (!el.classList.contains('tab-content') && !el.classList.contains('tab-button')) {
            el.style.display = displayWebui ? '' : 'none';
        }
    });

    apiSettings.forEach(el => {
        el.classList.toggle('active', displayApi);
        if (!el.classList.contains('tab-content') && !el.classList.contains('tab-button')) {
            el.style.display = displayApi ? '' : 'none';
        }
    });

    const comfyTabs = ['workflows', 'comfy-loras'];
    const webuiTabs = ['loras'];
    const apiTabs = ['api-image'];
    const apiVisibleTabs = ['api-image', 'ai-prompt', 'prompts', 'cache', 'logs'];
    const localOnlyTabs = ['general', 'generation', 'img2img'];

    comfyTabs.forEach(tabName => {
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) {
            tabButton.style.display = displayComfy ? 'block' : 'none';
        }
    });

    webuiTabs.forEach(tabName => {
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) {
            tabButton.style.display = displayWebui ? 'block' : 'none';
        }
    });

    apiTabs.forEach(tabName => {
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) {
            tabButton.style.display = displayApi ? 'block' : 'none';
        }
    });

    localOnlyTabs.forEach(tabName => {
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) {
            tabButton.style.display = displayApi ? 'none' : 'block';
        }
    });

    ['ai-prompt', 'prompts', 'cache', 'logs'].forEach(tabName => {
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) tabButton.style.display = 'block';
    });

    if (displayApi) {
        const buttons = apiVisibleTabs
            .map(tabName => document.querySelector(`[data-tab="${tabName}"]`))
            .filter(Boolean);
        buttons.forEach((button, index) => {
            button.style.order = String(index + 1);
        });
        const activeTab = document.querySelector('.tab-button.active');
        if (!activeTab || !isPanelTabVisibleForMode(activeTab.dataset.tab, currentMode)) {
            document.querySelector('[data-tab="api-image"]')?.click();
        }
    } else {
        document.querySelectorAll('.tab-button').forEach(button => {
            button.style.order = '';
        });
    }
}
