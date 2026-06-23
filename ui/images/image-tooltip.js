export function createImageTooltip() {
    return {
        el: null,
        delayTimer: null,
        lastX: 0,
        lastY: 0,
        init() {
            this.el = document.createElement('div');
            this.el.className = 'comfy-image-tooltip';
            this.el.style.display = 'none';
            document.body.appendChild(this.el);
        },
        scheduleShow(e, metadata) {
            this.cancelSchedule();
            if (!this.el || !metadata) return;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.delayTimer = setTimeout(() => {
                const lines = [];
                if (metadata.model) lines.push(`模型: ${metadata.model}`);
                if (metadata.seed != null) lines.push(`Seed: ${metadata.seed}`);
                if (metadata.steps) lines.push(`步数: ${metadata.steps}`);
                if (metadata.cfg) lines.push(`CFG: ${metadata.cfg}`);
                if (metadata.sampler) lines.push(`采样器: ${metadata.sampler}`);
                if (metadata.width && metadata.height) lines.push(`尺寸: ${metadata.width}×${metadata.height}`);
                if (metadata.generationTime) lines.push(`耗时: ${(metadata.generationTime / 1000).toFixed(1)}s`);
                if (metadata.prompt) lines.push(`提示词: ${metadata.prompt.substring(0, 120)}${metadata.prompt.length > 120 ? '...' : ''}`);
                if (!lines.length) return;
                this.el.textContent = lines.join('\n');
                this.el.style.display = 'block';
                this.position(e);
            }, 3000);
        },
        onMove(e, metadata) {
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            if (dx * dx + dy * dy > 100) {
                this.hide();
                this.scheduleShow(e, metadata);
            }
        },
        position(e) {
            if (!this.el) return;
            const x = Math.min(e.clientX + 12, window.innerWidth - this.el.offsetWidth - 10);
            const y = Math.min(e.clientY + 12, window.innerHeight - this.el.offsetHeight - 10);
            this.el.style.left = x + 'px';
            this.el.style.top = y + 'px';
        },
        cancelSchedule() {
            if (this.delayTimer) {
                clearTimeout(this.delayTimer);
                this.delayTimer = null;
            }
        },
        hide() {
            this.cancelSchedule();
            if (this.el) this.el.style.display = 'none';
        },
    };
}
