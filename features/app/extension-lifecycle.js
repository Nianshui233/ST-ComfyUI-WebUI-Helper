export function createExtensionLifecycle({
    buttonId,
    panelId,
    modes,
    imageCacheDB,
    panelController,
    connectionMonitor,
    helperActivation,
    imageTooltip,
    chatScanSystem,
    manualScan,
    streamingState,
    onGenerateButtonClick,
    onAiPromptActionClick,
    generateWithComfyUI,
    generateWithApiImage,
    generateWithWebUI,
    logRuntimeConfig,
    showToast,
    logger = console,
}) {
    let initialized = false;
    let helperActivated = false;

    function addMainButton(retries = 5) {
        if (document.getElementById(buttonId) || retries <= 0) return;

        const menuContent = document.querySelector('#options .options-content');
        if (!menuContent) {
            setTimeout(() => addMainButton(retries - 1), 100);
            return;
        }

        const btn = document.createElement('a');
        btn.id = buttonId;
        btn.className = 'interactable';
        btn.innerHTML = '<i class="fa-lg fa-solid fa-atom"></i><span>图片生成面板</span>';
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', async (event) => {
            event.preventDefault();
            await activateHelper();
            const panel = document.getElementById(panelId);
            if (panel) panel.style.display = 'flex';
            const options = document.getElementById('options');
            if (options) options.style.display = 'none';
        });
        menuContent.appendChild(btn);
    }

    function attachOptionsObserver() {
        const optionsObserver = new MutationObserver(() => {
            const menu = document.getElementById('options');
            if (menu && menu.style.display !== 'none') {
                addMainButton();
            }
        });

        const optionsTarget = document.getElementById('options');
        if (optionsTarget) {
            optionsObserver.observe(optionsTarget, { attributes: true, attributeFilter: ['style'] });
            return;
        }

        const bodyObserver = new MutationObserver(() => {
            const options = document.getElementById('options');
            if (!options) return;
            bodyObserver.disconnect();
            optionsObserver.observe(options, { attributes: true, attributeFilter: ['style'] });
        });
        bodyObserver.observe(document.body, { childList: true, subtree: true });
    }

    function installChatDelegates(mainChat) {
        mainChat.addEventListener('click', (event) => {
            const btn = event.target.closest('.comfy-chat-generate-button');
            if (btn && !btn.dataset.delegated) onGenerateButtonClick(event);
        });

        mainChat.addEventListener('click', (event) => {
            const btn = event.target.closest('.comfy-ai-prompt-action');
            if (btn) onAiPromptActionClick(event);
        });
    }

    async function activateHelper({ silent = false } = {}) {
        if (helperActivated) return true;
        helperActivated = true;
        helperActivation?.markActivated?.();

        imageCacheDB.init().catch(error => {
            logger.error('[AI Gen] IndexedDB初始化失败', error);
            if (!silent) showToast('error', 'IndexedDB初始化失败，缓存功能不可用');
        });

        panelController.createPanel();
        connectionMonitor.init();
        imageTooltip.init();

        const mainChat = document.querySelector('#chat[data-show-hidden-reasoning="true"]') || document.querySelector('#chat');
        if (!mainChat) {
            helperActivated = false;
            logger.error('[AI Gen] 无法找到 #chat 元素，脚本无法启动。');
            if (!silent) showToast('error', '没有找到 SillyTavern 聊天窗口，稍后可再次打开面板重试');
            return false;
        }

        if (!mainChat.dataset.aiGenMonitored) {
            mainChat.dataset.aiGenMonitored = 'true';
            logger.log('[AI Gen] 已锁定监控目标', mainChat);
            installChatDelegates(mainChat);
            chatScanSystem.attach(mainChat);
        }

        attachOptionsObserver();

        if (helperActivation?.isEnabled?.()) {
            manualScan.start();
            helperActivation.scheduleScan?.(120);
        }

        logger.log('[AI Gen Optimized] 脚本已成功初始化');
        if (!silent) showToast('info', 'SillyTavern图片生成器已就绪');
        logger.log('[AI Gen] 流式输出优化已就绪，插件总开关开启时会自动扫描聊天');
        logRuntimeConfig();

        return true;
    }

    function initialize() {
        addMainButton();
        logger.log('[AI Gen] 图片生成助手已加载，正在读取插件总开关。');
        helperActivation?.load?.()
            .then(isEnabled => {
                helperActivation?.setActivateCallback?.(activateHelper);
                if (isEnabled) {
                    return helperActivation.setEnabled(true, { silent: true, persist: false });
                }
                helperActivation?.clearChatImageControls?.();
                return null;
            })
            .catch(error => {
                logger.error('[AI Gen] 加载插件总开关失败:', error);
            });
    }

    function installGlobalApi() {
        window.AI_Generator = {
            switchMode: (mode) => panelController.switchMode(mode),
            currentMode: () => panelController.getCurrentMode(),
            generateWithComfyUI,
            generateWithApiImage,
            generateWithWebUI,
            updateModeUI: () => panelController.updateModeUI(),
            MODES: modes,

            forceRefreshAll: async () => {
                const mainChat = document.querySelector('#chat[data-show-hidden-reasoning="true"]') || document.querySelector('#chat');
                if (!mainChat) return;

                if (manualScan.hasControls()) {
                    await manualScan.scanNow();
                    showToast('success', '已触发强制扫描');
                    return;
                }

                logger.error('[AI Gen] ScanSystem 未初始化');
                showToast('error', '扫描系统未就绪');
            },

            getScanStats: () => {
                if (!window._AI_Gen_ScanSystem) {
                    return { error: 'ScanSystem 未初始化' };
                }

                return {
                    totalScans: window._AI_Gen_ScanSystem.state.scanCount,
                    missedTags: window._AI_Gen_ScanSystem.state.missedCount,
                    lastScanTime: new Date(window._AI_Gen_ScanSystem.state.lastScanTime).toLocaleTimeString(),
                    currentInterval: window._AI_Gen_ScanSystem.getCurrentInterval(),
                    activeMessages: streamingState.activeMessages.size,
                    pendingQueue: streamingState.pendingQueue.size,
                };
            },

            setScanInterval: (idle, active, streaming) => {
                if (!window._AI_Gen_ScanSystem) {
                    showToast('error', 'ScanSystem 未初始化');
                    return;
                }

                window._AI_Gen_ScanSystem.config.idleInterval = idle || window._AI_Gen_ScanSystem.config.idleInterval;
                window._AI_Gen_ScanSystem.config.activeInterval = active || window._AI_Gen_ScanSystem.config.activeInterval;
                window._AI_Gen_ScanSystem.config.streamingInterval = streaming || window._AI_Gen_ScanSystem.config.streamingInterval;
                logger.log('[AI Gen] 扫描间隔已更新', window._AI_Gen_ScanSystem.config);
                showToast('success', '扫描配置已更新');
            },
        };
    }

    function init() {
        if (initialized) return;
        initialized = true;
        installGlobalApi();
        helperActivation?.setActivateCallback?.(activateHelper);

        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', initialize, { once: true });
        } else {
            initialize();
        }
    }

    return {
        activateHelper,
        addMainButton,
        init,
        initialize,
        installGlobalApi,
    };
}
