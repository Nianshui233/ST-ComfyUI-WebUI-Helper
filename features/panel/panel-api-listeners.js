export function createPanelApiListeners({
    makeRequest,
    connectionMonitor,
    manualScan,
    saveSettings,
    detectAiPromptModels,
    testAiPromptOpenAICompatibleApi,
    fetchAndPopulateModels,
    fetchAndPopulateUNetModels,
    fetchAndPopulateWebUIModels,
    fetchAndPopulateWebUILoras,
    fetchAndPopulateWebUIEmbeddings,
    fetchAndPopulateComfyUISamplingOptions,
    fetchAndPopulateWebUISamplingOptions,
    fetchAndPopulateComfyUILoras,
    renderComfyUILoraList,
    clearComfyUILoraSelection,
    applyComfyUILoraBulkWeights,
    selectFilteredComfyUILoras,
    setAllComfyUILorasEnabled,
    copyComfyUILoraSelection,
    exportComfyUILoraSelection,
    importComfyUILoraSelection,
    copyLastSubmittedComfyUIWorkflow,
    exportLastSubmittedComfyUIWorkflow,
    showToast,
    logger = console,
}) {
    function initApiListeners(buttons, inputs) {
        const disconnect = () => {
            connectionMonitor.destroy();
            connectionMonitor.setStatus('disconnected', '已断开');
            showToast('info', '后端连接状态已断开，聊天区插件仍由总开关控制');
        };

        buttons.disconnect?.addEventListener('click', disconnect);
        buttons.webuiDisconnect?.addEventListener('click', disconnect);

        buttons.scanChat?.addEventListener('click', async () => {
            if (!manualScan.hasControls()) {
                showToast('error', '扫描系统未就绪');
                return;
            }
            await manualScan.scanNow();
            showToast('success', '当前聊天扫描完成');
        });

        const createTestConnectionHandler = (urlInput, testButton, successCallback) => async () => {
            let url = urlInput.value.trim();
            if (!url) return;
            if (!url.startsWith('http')) url = 'http://' + url;

            showToast('info', `正在尝试连接 ${urlInput.id.includes('webui') ? 'WebUI' : 'ComfyUI'}...`);
            testButton.className = 'comfy-button testing';
            testButton.disabled = true;

            try {
                if (url.endsWith('/')) url = url.slice(0, -1);
                urlInput.value = url;

                const endpoint = urlInput.id.includes('webui') ? '/sdapi/v1/sd-models' : '/system_stats';
                await makeRequest({ method: 'GET', url: `${url}${endpoint}` });

                testButton.className = 'comfy-button success';
                showToast('success', '连接成功');
                connectionMonitor.start();
                await successCallback(url, inputs);
            } catch (error) {
                testButton.className = 'comfy-button error';
                showToast('error', `连接失败: ${error.message}`);
            } finally {
                testButton.disabled = false;
            }
        };

        buttons.test?.addEventListener('click', createTestConnectionHandler(inputs.url, buttons.test, async (url, inputs) => {
            await Promise.all([
                fetchAndPopulateModels(url, inputs.modelSelect, false),
                fetchAndPopulateUNetModels(url, inputs.unetSelect, false),
                fetchAndPopulateComfyUILoras(url, false),
                fetchAndPopulateComfyUISamplingOptions(url, false),
            ]);
        }));

        buttons.webuiTest?.addEventListener('click', createTestConnectionHandler(inputs.webuiUrl, buttons.webuiTest, async (url, inputs) => {
            await Promise.all([
                fetchAndPopulateWebUIModels(url, inputs.webuiModelSelect, false),
                fetchAndPopulateWebUILoras(url, false),
                fetchAndPopulateWebUIEmbeddings(url, false),
                fetchAndPopulateWebUISamplingOptions(url, false),
            ]);
        }));

        const handleApiAction = (urlInput, action, warningMessage) => async () => {
            const url = urlInput.value.trim();
            if (url) await action(url);
            else showToast('warning', warningMessage);
        };

        buttons.refreshModels?.addEventListener('click', handleApiAction(
            inputs.url,
            url => Promise.all([
                fetchAndPopulateModels(url, inputs.modelSelect, false),
                fetchAndPopulateComfyUISamplingOptions(url, false),
            ]),
            '请先输入 ComfyUI URL',
        ));

        buttons.refreshUnets?.addEventListener('click', handleApiAction(
            inputs.url,
            url => fetchAndPopulateUNetModels(url, inputs.unetSelect, false),
            '请先输入 ComfyUI URL',
        ));

        buttons.webuiRefreshModels?.addEventListener('click', handleApiAction(
            inputs.webuiUrl,
            url => Promise.all([
                fetchAndPopulateWebUIModels(url, inputs.webuiModelSelect, false),
                fetchAndPopulateWebUISamplingOptions(url, false),
            ]),
            '请先输入 WebUI URL',
        ));

        buttons.webuiRefreshLoras?.addEventListener('click', handleApiAction(inputs.webuiUrl, url => fetchAndPopulateWebUILoras(url, false), '请先输入 WebUI URL'));
        buttons.webuiRefreshEmbeddings?.addEventListener('click', handleApiAction(inputs.webuiUrl, url => fetchAndPopulateWebUIEmbeddings(url, false), '请先输入 WebUI URL'));
        buttons.comfyuiRefreshLorasList?.addEventListener('click', handleApiAction(inputs.url, url => fetchAndPopulateComfyUILoras(url, false), '请先输入 ComfyUI URL'));

        buttons.aiPromptDetectModels?.addEventListener('click', async () => {
            const originalHtml = buttons.aiPromptDetectModels.innerHTML;
            buttons.aiPromptDetectModels.disabled = true;
            buttons.aiPromptDetectModels.textContent = '检测中...';
            try {
                await saveSettings(inputs);
                await detectAiPromptModels({ silent: false });
            } catch (error) {
                logger.error('[AI Gen] 检测 AI/LLM 模型失败:', error);
                showToast('error', error.message || String(error));
            } finally {
                buttons.aiPromptDetectModels.disabled = false;
                buttons.aiPromptDetectModels.innerHTML = originalHtml;
            }
        });

        buttons.aiPromptTestApi?.addEventListener('click', async () => {
            const originalText = buttons.aiPromptTestApi.textContent;
            buttons.aiPromptTestApi.disabled = true;
            buttons.aiPromptTestApi.textContent = '测试中...';
            try {
                await testAiPromptOpenAICompatibleApi();
            } catch (error) {
                logger.error('[AI Gen] AI 绘图 API 测试失败:', error);
                showToast('error', error.message || String(error));
            } finally {
                buttons.aiPromptTestApi.disabled = false;
                buttons.aiPromptTestApi.textContent = originalText;
            }
        });

        if (buttons.loraAdd) {
            buttons.loraAdd.addEventListener('click', () => {
                const loraSelect = document.getElementById('webui-lora-select');
                const weightInput = document.getElementById('webui-lora-weight-input');
                const positivePromptTextarea = document.getElementById('comfyui-positive-prompt');
                const loraName = loraSelect.value;
                if (!loraName) return showToast('warning', '请先选择一个 LoRA 模型');

                const loraTag = `<lora:${loraName}:${weightInput.value || '1.0'}>`;
                const endsWithCommaSpace = /,\s*$/.test(positivePromptTextarea.value);

                positivePromptTextarea.value += (positivePromptTextarea.value.trim() && !endsWithCommaSpace ? ', ' : '') + loraTag;
                positivePromptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                showToast('success', `已添加 LoRA: ${loraName}`);
            });
        }

        document.getElementById('comfyui-lora-search')?.addEventListener('input', renderComfyUILoraList);
        document.getElementById('comfyui-lora-folder-filter')?.addEventListener('change', renderComfyUILoraList);
        buttons.comfyuiLoraClearSelection?.addEventListener('click', () => clearComfyUILoraSelection());
        buttons.comfyuiLoraBulkApply?.addEventListener('click', applyComfyUILoraBulkWeights);
        buttons.comfyuiLoraSelectFiltered?.addEventListener('click', () => selectFilteredComfyUILoras('add'));
        buttons.comfyuiLoraToggleFiltered?.addEventListener('click', () => selectFilteredComfyUILoras('toggle'));
        buttons.comfyuiLoraEnableAll?.addEventListener('click', () => setAllComfyUILorasEnabled(true));
        buttons.comfyuiLoraDisableAll?.addEventListener('click', () => setAllComfyUILorasEnabled(false));
        buttons.comfyuiLoraCopySelection?.addEventListener('click', copyComfyUILoraSelection);
        buttons.comfyuiLoraExportSelection?.addEventListener('click', exportComfyUILoraSelection);
        buttons.comfyuiLoraImportSelection?.addEventListener('click', importComfyUILoraSelection);
        buttons.comfyuiLoraCopyLastWorkflow?.addEventListener('click', copyLastSubmittedComfyUIWorkflow);
        buttons.comfyuiLoraExportLastWorkflow?.addEventListener('click', exportLastSubmittedComfyUIWorkflow);
    }

    return {
        initApiListeners,
    };
}
