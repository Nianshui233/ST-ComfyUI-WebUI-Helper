import { MODES } from '../core/runtime-config.js';

export function moveModeSections(currentMode) {
    document.querySelectorAll('.mode-switch-option').forEach(btn => {
        btn.classList.remove('active', MODES.COMFYUI, MODES.WEBUI);
        if (btn.dataset.mode === currentMode) {
            btn.classList.add('active', currentMode);
        }
    });

    const statusElement = document.querySelector('.mode-status');
    if (statusElement) {
        statusElement.textContent = `当前模式: ${currentMode === MODES.COMFYUI ? 'ComfyUI' : 'WebUI'}`;
    }

    const comfySettings = document.querySelectorAll('.comfyui-settings');
    const webuiSettings = document.querySelectorAll('.webui-settings');
    const displayComfy = currentMode === MODES.COMFYUI;

    comfySettings.forEach(el => {
        el.classList.toggle('hidden', !displayComfy);
        if (!el.classList.contains('tab-content') && !el.classList.contains('tab-button')) {
            el.style.display = displayComfy ? '' : 'none';
        }
    });

    webuiSettings.forEach(el => {
        el.classList.toggle('active', !displayComfy);
        if (!el.classList.contains('tab-content') && !el.classList.contains('tab-button')) {
            el.style.display = displayComfy ? 'none' : '';
        }
    });

    const comfyTabs = ['workflows', 'comfy-loras'];
    const webuiTabs = ['loras'];

    comfyTabs.forEach(tabName => {
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) {
            tabButton.style.display = displayComfy ? 'block' : 'none';
        }
    });

    webuiTabs.forEach(tabName => {
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) {
            tabButton.style.display = displayComfy ? 'none' : 'block';
        }
    });
}
