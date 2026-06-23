import { PANEL_ID } from '../core/runtime-config.js';

export function initPanelTabListeners({
    saveActiveTab,
    moveAdvancedSectionsToTab,
    updateSelectedEmbeddingsDisplay,
    updateComfyUISelectedLorasDisplay,
    loadImageCache,
    updateWorkflowList,
    deviceDetector,
}) {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button.active').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content.active').forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            const targetTab = document.getElementById(`tab-${tabId}`);
            if (!targetTab) return;

            saveActiveTab?.(tabId);

            if (['generation', 'img2img', 'prompts'].includes(tabId)) {
                moveAdvancedSectionsToTab(tabId);
            }
            targetTab.classList.add('active');

            if (tabId === 'loras') {
                updateSelectedEmbeddingsDisplay();
            }
            if (tabId === 'comfy-loras') {
                updateComfyUISelectedLorasDisplay();
            }
            if (tabId === 'cache') loadImageCache();
            if (tabId === 'ai-prompt') {
                document.getElementById(PANEL_ID)?.updateAiPromptProviderUI?.();
            }

            if (tabId === 'workflows') {
                updateWorkflowList();
            }

            if (deviceDetector.isMobile()) {
                const panelContent = document.querySelector('.comfyui-panel-content');
                if (panelContent) panelContent.scrollTop = 0;
            }
        });
    });
}
