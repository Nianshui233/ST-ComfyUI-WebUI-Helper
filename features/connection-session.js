export function createConnectionMonitor({ getCurrentMode, modes, getValue, makeRequest }) {
    return {
        timer: null,
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
                const url = currentMode === modes.COMFYUI
                    ? (await getValue('comfyui_url', '')).trim()
                    : (await getValue('webui_url', '')).trim();
                if (!url) {
                    this.setStatus('disconnected', '未配置URL');
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
            clearInterval(this.timer);
            this.timer = null;
        },
    };
}
