export function createConnectionMonitor({ getCurrentMode, modes, getValue, makeRequest }) {
    return {
        indicator: null,
        init() {
            this.indicator = document.getElementById('comfy-conn-indicator');
            this.setStatus('disconnected', '未连接');
        },
        async check() {
            if (!this.indicator) return;
            this.setStatus('checking', '检查中...');
            try {
                const currentMode = getCurrentMode();
                if (currentMode === modes.API) {
                    const apiKey = await getValue('comfyui_api_image_api_key', '');
                    this.setStatus(apiKey ? 'connected' : 'disconnected', apiKey ? 'API Key 已配置' : 'API Key 未配置');
                    return;
                }
                const url = currentMode === modes.COMFYUI
                    ? (await getValue('comfyui_url', '')).trim()
                    : (await getValue('webui_url', '')).trim();
                if (!url) {
                    this.setStatus('disconnected', '未配置 URL');
                    return;
                }
                const endpoint = currentMode === modes.COMFYUI
                    ? `${url}/system_stats`
                    : `${url}/sdapi/v1/sd-models`;
                await makeRequest({ method: 'GET', url: endpoint, timeout: 5000 });
                this.setStatus('connected', `已连接 (${currentMode})`);
            } catch {
                this.setStatus('disconnected', '连接失败');
            }
        },
        setStatus(status, title) {
            if (!this.indicator) return;
            this.indicator.className = `comfy-conn-status ${status}`;
            this.indicator.title = title;
        },
        start() {
            this.check();
        },
        destroy() {
            // 手动连接模式下没有后台定时器；保留方法供断开按钮调用。
        },
    };
}
