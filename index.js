import { GM_addStyle, GM_getValue, GM_setValue, GM_xmlhttpRequest } from './lib/tampermonkey-compat.js';
import { createConnectionMonitor } from './features/connection-session.js';
import { createManualScanController } from './features/manual-scan.js';
import { validateComfyWorkflow, showWorkflowValidationResult as showWorkflowValidationToast } from './features/workflow-validation.js';
import { getPanelInputs, getPanelButtons } from './ui/panel-elements.js';
import { getPanelHtml } from './ui/panel-template.js';
import { getPanelStyles } from './ui/panel-styles.js';

let initialized = false;

    /*
     * File layout
     * 1. Storage and low-level utilities
     * 2. Shared runtime state and UI helpers
     * 3. Panel construction and panel event wiring
     * 4. Workflow, presets, models, and settings
     * 5. Cache management and generated image rendering
     * 6. Message scanning and generate button lifecycle
     * 7. ComfyUI / WebUI generation pipeline
     * 8. Initialization and DOM observers
     */

    // -------------------------------------------------------------------------
    // Section 1: Storage and Low-Level Utilities
    // -------------------------------------------------------------------------
    class ImageCacheDB {
        constructor() {
            this.dbName = 'AIGenerator_ImageCache';
            this.storeName = 'images';
            this.version = 2; // 升级版本号
            this.db = null;
        }

        async init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.version);

                request.onerror = () => {
                    console.error('[AI Gen DB] 打开失败:', request.error);
                    reject(request.error);
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // 清理旧的object store（如果存在）
                    if (db.objectStoreNames.contains(this.storeName)) {
                        db.deleteObjectStore(this.storeName);
                    }

                    // 创建新的object store
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('mode', 'mode', { unique: false });
                };
            });
        }

        async saveImage(id, imageBlob, metadata) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);

                const data = {
                    id,
                    blob: imageBlob,
                    prompt: metadata.prompt || '',
                    mode: metadata.mode || 'unknown',
                    metadata: metadata.metadata || {},
                    timestamp: Date.now()
                };

                const request = store.put(data);
                request.onsuccess = () => {
                    resolve();
                };
                request.onerror = () => {
                    console.error(`[AI Gen DB] 保存失败 [${id}]:`, request.error);
                    reject(request.error);
                };
            });
        }

        async getImage(id) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(id);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async getAllImages() {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        }

        async deleteImage(id) {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(id);

                request.onsuccess = () => {
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        }

        async clearAll() {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.clear();

                request.onsuccess = () => {
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        }

        // [Phase 1.5] Optimized: cursor-based instead of getAllImages()
        async getStorageInfo() {
            if (!this.db) await this.init();
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction([this.storeName], 'readonly');
                const store = tx.objectStore(this.storeName);
                let count = 0, totalSize = 0;
                const req = store.openCursor();
                req.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        count++;
                        if (cursor.value.blob) totalSize += cursor.value.blob.size;
                        cursor.continue();
                    } else {
                        resolve({ count, totalSize, sizeMB: (totalSize / 1024 / 1024).toFixed(2) });
                    }
                };
                req.onerror = () => reject(req.error);
            });
        }

        async pruneOldImages(maxSize = 200 * 1024 * 1024, maxCount = 200) {
            if (!this.db) await this.init();

            const images = await this.getAllImages();

            // 按时间排序（旧的在前）
            images.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

            let currentSize = 0;
            for (const img of images) {
                if (img.blob) currentSize += img.blob.size;
            }

            const toDelete = [];
            let index = 0;

            // 删除最旧的图片直到满足限制
            while ((currentSize > maxSize || images.length - toDelete.length > maxCount) && index < images.length) {
                const img = images[index];
                toDelete.push(img.id);
                if (img.blob) currentSize -= img.blob.size;
                index++;
            }

            for (const id of toDelete) {
                await this.deleteImage(id);
            }

            return toDelete.length;
        }

        async exportCache() {
            const images = await this.getAllImages();
            const exportData = [];

            for (const img of images) {
                if (img.blob) {
                    const base64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(img.blob);
                    });

                    exportData.push({
                        id: img.id,
                        prompt: img.prompt,
                        mode: img.mode,
                        metadata: img.metadata,
                        timestamp: img.timestamp,
                        imageData: base64
                    });
                }
            }

            return JSON.stringify(exportData);
        }

        async importCache(jsonData) {
            const data = safeJsonParse(jsonData, null, 'cache import');
            if (!Array.isArray(data)) {
                throw new Error('导入数据格式无效');
            }
            let successCount = 0;

            for (const item of data) {
                try {
                    // [Phase 3.2] importCache security: validate data URI
                    if (!item.imageData || !item.imageData.startsWith('data:')) {
                        console.warn(`[AI Gen DB] 跳过非法数据: ${item.id}`);
                        continue;
                    }
                    const response = await fetch(item.imageData);
                    const blob = await response.blob();

                    await this.saveImage(item.id, blob, {
                        prompt: item.prompt,
                        mode: item.mode,
                        metadata: item.metadata
                    });

                    successCount++;
                } catch (e) {
                    console.error(`[AI Gen DB] 导入失败 [${item.id}]:`, e);
                }
            }

            return successCount;
        }
    }

    // 创建全局实例
    const imageCacheDB = new ImageCacheDB();

    // [Phase 2.1] BlobURL Tracker - prevents memory leaks from unreleased object URLs
    const BlobURLTracker = {
        urls: new Set(),
        create(blob) {
            const url = URL.createObjectURL(blob);
            this.urls.add(url);
            return url;
        },
        revoke(url) {
            URL.revokeObjectURL(url);
            this.urls.delete(url);
        },
        revokeAll() {
            for (const url of this.urls) URL.revokeObjectURL(url);
            this.urls.clear();
        }
    };

    async function getStoredValues(entries) {
        const values = await Promise.all(
            entries.map(([key, defaultValue]) => GM_getValue(key, defaultValue))
        );

        return Object.fromEntries(
            entries.map(([key], index) => [key, values[index]])
        );
    }

    async function setStoredValues(entries) {
        await Promise.all(
            entries
                .filter(([, value]) => value !== undefined)
                .map(([key, value]) => GM_setValue(key, value))
        );
    }

    function createClientId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return `ai-gen-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }

    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('Blob 转 DataURL 失败'));
            reader.readAsDataURL(blob);
        });
    }

    function downloadJsonFile(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = BlobURLTracker.create(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        BlobURLTracker.revoke(url);
    }

    function safeJsonParse(text, fallback, label = 'JSON') {
        try {
            return JSON.parse(text);
        } catch (error) {
            console.warn(`[AI Gen] ${label} 解析失败:`, error);
            return fallback;
        }
    }

    function normalizeNumber(value, fallback = 1) {
        const number = Number.parseFloat(value);
        return Number.isFinite(number) ? number : fallback;
    }

    // [Phase 1.1] Cache /object_info responses
    let _objectInfoCache = { url: '', data: null, timestamp: 0 };
    async function getCachedObjectInfo(url, ttl = 30000) {
        const now = Date.now();
        if (_objectInfoCache.data && _objectInfoCache.url === url && now - _objectInfoCache.timestamp < ttl) {
            return _objectInfoCache.data;
        }
        const resp = await makeRequest({ method: 'GET', url: `${url}/object_info` });
        const parsed = safeJsonParse(resp.responseText, null, 'object_info');
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('ComfyUI /object_info 返回了无效数据');
        }
        _objectInfoCache = { url, data: parsed, timestamp: now };
        return _objectInfoCache.data;
    }

    // [Phase 6.2] Toast stacking counter
    let activeToastCount = 0;

    // [优化] 内置消息通知函数，作为 toastr 的后备方案
    function showToast(type, message) {
        if (typeof toastr !== 'undefined') {
            toastr[type](message);
            return;
        }

        console.log(`[AI Gen Toast]: ${type.toUpperCase()} - ${message}`);
        const toastId = `toast-${Date.now()}`;
        const toastColors = {
            success: 'var(--vp-success-color, #00ff9c)',
            info: 'var(--vp-accent-color, #00d1ff)',
            warning: 'var(--vp-warning-color, #ffa500)',
            error: 'var(--vp-error-color, #ff4747)',
        };

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.style.cssText = `
            position: fixed;
            top: ${20 + activeToastCount * 60}px;
            right: 20px;
            padding: 15px 20px;
            background-color: var(--vp-bg-color, rgba(10, 15, 25, 0.9));
            color: var(--vp-text-color, #e0e5f0);
            border-radius: 8px;
            z-index: 10001;
            border-left: 5px solid ${toastColors[type]};
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            font-family: var(--vp-font, sans-serif);
            opacity: 0;
            transform: translateX(100%);
            transition: opacity 0.3s ease, transform 0.3s ease;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);
        activeToastCount++;

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            activeToastCount--;
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // 设备检测（修复：改进判断逻辑，避免PC端被误判为移动端）
    const DeviceDetector = {
        isMobile: () => {
            // 优先检查User Agent（最可靠的方法）
            const mobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            // 如果UA明确表示是移动设备，直接返回true
            if (mobileUA) return true;

            // 只有在UA不明确的情况下，才检查其他特征
            // 必须同时满足触摸支持和小屏幕才判定为移动端（避免触摸屏笔记本被误判）
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const smallScreen = window.innerWidth <= 768;

            return hasTouch && smallScreen;
        },

        isTablet: () => {
            // 优先检查User Agent中的平板标识
            if (/iPad/i.test(navigator.userAgent)) return true;
            if (/Android(?!.*Mobile)/i.test(navigator.userAgent) && window.innerWidth >= 768) return true;

            return false;
        },

        isTouchDevice: () => {
            return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        },

        getDeviceType: () => {
            // 优先检查User Agent（最准确）
            if (/iPhone|iPod|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                return 'mobile';
            }
            if (/iPad|Android(?!.*Mobile)/i.test(navigator.userAgent)) {
                return 'tablet';
            }

            // UA不明确时，根据屏幕尺寸和触摸特性综合判断
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            if (window.innerWidth <= 768 && hasTouch) {
                return 'mobile';
            }
            if (window.innerWidth > 768 && window.innerWidth <= 1024 && hasTouch) {
                return 'tablet';
            }

            return 'desktop';
        }
    };

    // -------------------------------------------------------------------------
    // Section 2: Shared State and UI Helpers
    // -------------------------------------------------------------------------

    // Configuration constants
    const BUTTON_ID = 'comfyui-launcher-button';
    const PANEL_ID = 'comfyui-panel';
    const POLLING_TIMEOUT_MS = 3600000;
    const POLLING_INTERVAL_MS = 2000;
    const STORAGE_KEY_IMAGES = 'comfyui_generated_images';
    const STORAGE_KEY_WORKFLOWS = 'comfyui_saved_workflows';
    const STORAGE_KEY_MODE = 'generation_mode';
    const STORAGE_KEY_PROMPT_PRESETS = 'comfyui_prompt_presets';
    const STORAGE_KEY_COMFYUI_LORA_PRESETS = 'comfyui_lora_presets';
    const SETTINGS_EXPORT_VERSION = 1;
    const EXPORTABLE_STORAGE_KEYS = [
        STORAGE_KEY_MODE,
        STORAGE_KEY_WORKFLOWS,
        STORAGE_KEY_PROMPT_PRESETS,
        STORAGE_KEY_COMFYUI_LORA_PRESETS,
        'comfyui_url',
        'webui_url',
        'comfyui_workflow',
        'comfyui_start_tag',
        'comfyui_end_tag',
        'comfyui_gen_width',
        'comfyui_gen_height',
        'comfyui_display_width',
        'comfyui_display_height',
        'comfyui_auto_generate',
        'comfyui_model',
        'comfyui_unet_model',
        'webui_model',
        'comfyui_sampler',
        'comfyui_scheduler',
        'comfyui_steps',
        'comfyui_cfg',
        'webui_sampler',
        'webui_scheduler',
        'webui_steps',
        'webui_cfg',
        'webui_denoising',
        'webui_enable_hires',
        'webui_hires_upscaler',
        'webui_hires_steps',
        'webui_hires_upscale',
        'webui_hires_denoising',
        'comfyui_seed',
        'webui_seed',
        'comfyui_img2img_enable',
        'webui_img2img_enable',
        'comfyui_img2img_denoising',
        'webui_img2img_denoising',
        'comfyui_positive_prompt',
        'comfyui_negative_prompt',
        'comfyui_enable_comparison',
        'comfyui_hide_buttons',
        'selected_embeddings',
        'comfyui_selected_loras',
        'comfyui_panel_position',
    ];
    let observerDebounceTimer = null;
    let streamCheckInterval = null;
    let lastProcessedMessageCount = 0;
    const generateThrottle = new Map();
    const GENERATE_COOLDOWN = 2000; // 2秒冷却时间

    // 生成模式枚举
    const MODES = {
        COMFYUI: 'comfyui',
        WEBUI: 'webui'
    };

    const DEFAULT_SETTINGS = {
        mode: MODES.COMFYUI,
        url: 'http://127.0.0.1:8188',
        webuiUrl: 'http://127.0.0.1:7860',
        workflow: '',
        startTag: '开始生成',
        endTag: '结束生成',
        genWidth: 512,
        genHeight: 768,
        displayWidth: 400,
        displayHeight: 0,
        autoGenerate: false,
        model: '',
        unetModel: '',
        webuiModel: '',
        selectedLoras: [],
        sampler: 'euler',
        scheduler: 'normal',
        steps: 20,
        cfg: 7.0,
        positivePrompt: '',
        negativePrompt: '',
        webuiSampler: 'Euler a',
        webuiScheduler: 'Automatic',
        denoisingStrength: 0.7,
        enableHires: false,
        hiresUpscaler: 'Latent',
        hiresSteps: 0,
        hiresUpscale: 2.0,
        hiresDenoising: 0.5,
        seed: -1,
        seedLocked: false,
        img2imgEnable: false,
        img2imgDenoising: 0.75,
        enableComparison: true,
        hideButtons: false,
    };

    // Shared runtime state
    let currentEditingWorkflow = null;
    let isEditMode = false;
    let currentMode = MODES.COMFYUI;
    let availableLoras = [];
    let availableEmbeddings = [];
    let availableComfyUILoras = [];
    let helperActivated = false;
    const manualScan = createManualScanController();
    const streamingState = {
        activeMessages: new Map(), // Map<messageId, { node, detectedTags, lastUpdate }>
        pendingQueue: new Set(), // Set<messageId>
        config: {
            stabilityDelay: 800,      // 稳定延迟：内容停止变化后等待时间
            maxWaitTime: 30000,       // 最大等待时间：30秒
            checkInterval: 300        // 检查间隔：300ms
        }
    };

    const ConnectionMonitor = createConnectionMonitor({
        getCurrentMode: () => currentMode,
        modes: MODES,
        getValue: GM_getValue,
        makeRequest,
    });

    // Image metadata tooltip
    const ImageTooltip = {
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
        /** 延迟显示：鼠标静止3秒后才展示 */
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
        /** 鼠标移动时：如果移动幅度超过阈值则隐藏并重新计时 */
        onMove(e, metadata) {
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            if (dx * dx + dy * dy > 100) { // 移动超过10px
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
            if (this.delayTimer) { clearTimeout(this.delayTimer); this.delayTimer = null; }
        },
        hide() {
            this.cancelSchedule();
            if (this.el) this.el.style.display = 'none';
        }
    };

    // Generation progress tracker
    const ProgressTracker = {
        ws: null,
        pollTimer: null,
        container: null,
        bar: null,
        text: null,
        activePromptId: null,
        activeClientId: null,
        lastPreviewDataUrl: null,

        createUI(anchorElement) {
            this.remove(); // 清理旧的
            this.container = document.createElement('div');
            this.container.className = 'comfy-progress-container';
            this.bar = document.createElement('div');
            this.bar.className = 'comfy-progress-bar';
            this.text = document.createElement('div');
            this.text.className = 'comfy-progress-text';
            this.container.appendChild(this.bar);
            anchorElement.insertAdjacentElement('afterend', this.text);
            anchorElement.insertAdjacentElement('afterend', this.container);
        },

        update(progress, statusText) {
            if (this.bar) this.bar.style.width = `${Math.min(progress * 100, 100)}%`;
            if (this.text) this.text.textContent = statusText || `${Math.round(progress * 100)}%`;
        },

        async capturePreview(payload) {
            try {
                const buffer = payload instanceof ArrayBuffer
                    ? payload
                    : await payload.arrayBuffer();
                if (buffer.byteLength <= 8) return;

                const blob = new Blob([buffer.slice(8)]);
                this.lastPreviewDataUrl = await blobToDataUrl(blob);
            } catch (error) {
                console.warn('[AI Gen] 捕获 ComfyUI 预览图失败:', error);
            }
        },

        async waitForPreview(timeoutMs = 1200) {
            const deadline = Date.now() + timeoutMs;
            while (Date.now() < deadline) {
                if (this.lastPreviewDataUrl) return this.lastPreviewDataUrl;
                await new Promise(resolve => setTimeout(resolve, 80));
            }
            return this.lastPreviewDataUrl;
        },

        clearPreview() {
            this.lastPreviewDataUrl = null;
        },

        startComfyUI(url, promptId, clientId) {
            if (this.ws) {
                try { this.ws.close(); } catch {}
                this.ws = null;
            }
            this.clearPreview();
            this.activePromptId = promptId;
            this.activeClientId = clientId;
            try {
                const wsUrl = `${url.replace(/^http/, 'ws')}/ws?clientId=${encodeURIComponent(clientId)}`;
                this.ws = new WebSocket(wsUrl);
                this.ws.binaryType = 'arraybuffer';
                this.ws.onmessage = (event) => {
                    try {
                        if (typeof event.data === 'string') {
                            const msg = JSON.parse(event.data);
                            if (msg.type === 'progress') {
                                const { value, max } = msg.data;
                                this.update(value / max, `${value}/${max} 步`);
                            }
                            return;
                        }

                        this.capturePreview(event.data);
                    } catch {}
                };
                this.ws.onerror = () => { this.ws = null; };
            } catch {}
        },

        startWebUI(url) {
            this.pollTimer = setInterval(async () => {
                try {
                    const resp = await makeRequest({ method: 'GET', url: `${url}/sdapi/v1/progress`, timeout: 3000 });
                    const data = JSON.parse(resp.responseText);
                    this.update(data.progress, `${Math.round(data.progress * 100)}% (ETA: ${data.eta_relative?.toFixed(0) || '?'}s)`);
                } catch {}
            }, 1000);
        },

        stop() {
            if (this.ws) { try { this.ws.close(); } catch {} this.ws = null; }
            if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
            this.activePromptId = null;
            this.activeClientId = null;
        },

        remove() {
            this.stop();
            this.container?.remove();
            this.text?.remove();
            this.clearPreview();
            this.container = null; this.bar = null; this.text = null;
        }
    };

    // Before/after image comparison
    const ComparisonMode = {
        oldImageSrc: null,

        captureOldImage(group) {
            const container = group.nextElementSibling;
            if (container?.classList.contains('comfy-image-container')) {
                const img = container.querySelector('img');
                if (img?.src) this.oldImageSrc = img.src;
            }
        },

        show(group, newImageSrc) {
            if (!this.oldImageSrc) return false;
            const existing = group.parentElement.querySelector('.comfy-compare-container');
            if (existing) existing.remove();
            const existingActions = group.parentElement.querySelector('.comfy-compare-actions');
            if (existingActions) existingActions.remove();

            const wrapper = document.createElement('div');
            wrapper.className = 'comfy-compare-container';

            const newImg = document.createElement('img');
            newImg.src = newImageSrc;
            newImg.className = 'comfy-compare-new';

            const oldImg = document.createElement('img');
            oldImg.src = this.oldImageSrc;
            oldImg.className = 'comfy-compare-old';

            const slider = document.createElement('div');
            slider.className = 'comfy-compare-slider';

            wrapper.append(newImg, oldImg, slider);

            // 拖拽逻辑
            let dragging = false;
            const onMouseMove = (e) => {
                if (!dragging) return;
                const rect = wrapper.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                slider.style.left = `${pct * 100}%`;
                oldImg.style.clipPath = `inset(0 ${(1 - pct) * 100}% 0 0)`;
            };
            const onMouseUp = () => { dragging = false; };
            slider.addEventListener('mousedown', () => { dragging = true; });
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

            // 操作按钮
            const actions = document.createElement('div');
            actions.className = 'comfy-compare-actions';

            const cleanup = () => {
                wrapper.remove(); actions.remove();
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                this.oldImageSrc = null;
            };

            const keepNewBtn = document.createElement('button');
            keepNewBtn.className = 'comfy-button success';
            keepNewBtn.textContent = '保留新图';
            keepNewBtn.addEventListener('click', cleanup);

            const keepOldBtn = document.createElement('button');
            keepOldBtn.className = 'comfy-button';
            keepOldBtn.textContent = '恢复旧图';
            keepOldBtn.addEventListener('click', () => {
                const imgContainer = group.nextElementSibling;
                if (imgContainer?.classList.contains('comfy-image-container')) {
                    const img = imgContainer.querySelector('img');
                    if (img) img.src = this.oldImageSrc;
                }
                cleanup();
            });

            const closeBtn = document.createElement('button');
            closeBtn.className = 'comfy-button error';
            closeBtn.textContent = '关闭对比';
            closeBtn.addEventListener('click', cleanup);

            actions.append(keepNewBtn, keepOldBtn, closeBtn);

            // 插入到图片容器之后
            const imageContainer = group.nextElementSibling;
            if (imageContainer) {
                imageContainer.insertAdjacentElement('afterend', actions);
                imageContainer.insertAdjacentElement('afterend', wrapper);
            }
            return true;
        }
    };

    // Per-mode Img2Img state
    const img2imgStates = {
        comfyui: { enabled: false, imageData: null, fileName: null },
        webui: { enabled: false, imageData: null, fileName: null }
    };

    function getImg2ImgState(modeOrPrefix = currentMode) {
        const key = modeOrPrefix === MODES.WEBUI || modeOrPrefix === 'webui' ? 'webui' : 'comfyui';
        return img2imgStates[key];
    }

    GM_addStyle(getPanelStyles({ panelId: PANEL_ID, buttonId: BUTTON_ID }));


    // [优化] 预设管理通用工厂函数，减少代码重复
    /**
     * 创建一个预设管理器
     * @param {object} config - 配置对象
     * @param {string} config.storageKey - GM_setValue的键
     * @param {string} config.selectElementId - <select>元素的ID
     * @param {string} config.loadButtonId - 加载按钮的ID
     * @param {string} config.saveButtonId - 保存按钮的ID
     * @param {string} config.deleteButtonId - 删除按钮的ID
     * @param {string} config.modalId - 保存模态框的ID
     * @param {string} config.nameInputId - 模态框中名称输入的ID
     * @param {string} config.overwriteWarningId - 模态框中覆盖警告的ID
     * @param {string} config.saveConfirmButtonId - 模态框确认按钮的ID
     * @param {string} config.saveCancelButtonId - 模态框取消按钮的ID
     * @param {string} config.presetType - 预设类型名称 (e.g., "提示词", "LoRA")
     * @param {function(): object} config.getCurrentData - 获取当前要保存的数据的函数
     * @param {function(object): Promise<void>} config.applyPreset - 应用一个预设的函数
     * @param {function(): boolean} [config.canSave=() => true] - 检查是否可以保存的函数
     */
    function createPresetManager(config) {
        const select = document.getElementById(config.selectElementId);
        const loadBtn = document.getElementById(config.loadButtonId);
        const saveBtn = document.getElementById(config.saveButtonId);
        const deleteBtn = document.getElementById(config.deleteButtonId);
        const modal = document.getElementById(config.modalId);
        const nameInput = document.getElementById(config.nameInputId);
        const warning = document.getElementById(config.overwriteWarningId);
        const confirmBtn = document.getElementById(config.saveConfirmButtonId);
        const cancelBtn = document.getElementById(config.saveCancelButtonId);

        async function loadPresets() {
            const presets = await GM_getValue(config.storageKey, {});
            select.innerHTML = `<option value="">选择${config.presetType}预设...</option>`;
            Object.keys(presets).sort().forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            });
        }

        async function savePreset(presetName) {
            const data = config.getCurrentData();
            const presets = await GM_getValue(config.storageKey, {});
            presets[presetName] = { ...data, timestamp: Date.now() };
            await GM_setValue(config.storageKey, presets);
            await loadPresets();
            showToast('success', `${config.presetType}预设 "${presetName}" 已保存`);
        }

        async function loadSelected() {
            if (!select.value) {
                showToast('warning', `请先选择一个${config.presetType}预设`);
                return;
            }
            const presets = await GM_getValue(config.storageKey, {});
            const preset = presets[select.value];
            if (preset) {
                await config.applyPreset(preset);
                showToast('success', `已加载${config.presetType}预设 "${select.value}"`);
            }
        }

        async function deleteSelected() {
            if (!select.value) {
                showToast('warning', `请先选择一个${config.presetType}预设`);
                return;
            }
            if (confirm(`确定要删除${config.presetType}预设 "${select.value}" 吗？此操作不可撤销。`)) {
                const presets = await GM_getValue(config.storageKey, {});
                delete presets[select.value];
                await GM_setValue(config.storageKey, presets);
                await loadPresets();
                showToast('success', `${config.presetType}预设 "${select.value}" 已删除`);
            }
        }

        function showSaveModal() {
            if (config.canSave && !config.canSave()) {
                showToast('warning', `没有可保存的${config.presetType}配置`);
                return;
            }
            nameInput.value = '';
            warning.style.display = 'none';
            modal.style.display = 'block';
            setTimeout(() => nameInput.focus(), 100);
        }

        // Event Listeners
        loadBtn.addEventListener('click', loadSelected);
        saveBtn.addEventListener('click', showSaveModal);
        deleteBtn.addEventListener('click', deleteSelected);

        nameInput.addEventListener('input', async () => {
            const presets = await GM_getValue(config.storageKey, {});
            warning.style.display = (nameInput.value.trim() && presets[nameInput.value.trim()]) ? 'block' : 'none';
        });

        confirmBtn.addEventListener('click', async () => {
            const presetName = nameInput.value.trim();
            if (!presetName) {
                showToast('error', '请输入预设名称');
                return;
            }
            await savePreset(presetName);
            modal.style.display = 'none';
        });

        cancelBtn.addEventListener('click', () => modal.style.display = 'none');

        // Initial load
        loadPresets();

        return { loadPresets };
    }

    // -------------------------------------------------------------------------
    // Section 3: Generic Utilities
    // -------------------------------------------------------------------------

    /**
    * HTML转义
    * @param {string} str - 输入字符串
    * @returns {string} - 转义后的字符串
    */
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
    * 封装GM_xmlhttpRequest为Promise
    * @param {Object} options - 请求选项
    * @returns {Promise<any>} - 返回请求Promise
    */
    function makeRequest(options) {
        return new Promise((resolve, reject) => {
            // [优化] 自动清理URL并对错误URL进行严格处理
            let cleanedUrl;
            try {
                const urlObj = new URL(options.url);
                urlObj.pathname = urlObj.pathname.replace(/\/+/g, '/');
                cleanedUrl = urlObj.toString();
                if (cleanedUrl.endsWith('/') && cleanedUrl.length > 8) { // 避免 "http://"
                    cleanedUrl = cleanedUrl.slice(0, -1);
                }
            } catch (e) {
                // 如果URL格式不正确，直接拒绝，提供明确反馈
                reject(new Error(`URL格式无效: "${options.url}"`));
                return;
            }

            const requestOptions = {
                method: options.method || 'GET',
                url: cleanedUrl,
                headers: options.headers || {},
                data: options.data,
                timeout: options.timeout || 3600000,
                onload: (response) => {
                    if (response.status >= 200 && response.status < 300) {
                        resolve(response);
                    } else {
                        reject(new Error(`API错误: ${response.status} ${response.statusText || ''}. Response: ${response.responseText.substring(0, 100)}`));
                    }
                },
                onerror: (error) => {
                    reject(new Error(`网络错误: ${error.details || '未知错误，可能是目标服务(ComfyUI/WebUI)未启动、地址错误或CORS策略问题'}`));
                },
                ontimeout: () => {
                    reject(new Error('请求超时'));
                }
            };

            if (options.responseType) {
                requestOptions.responseType = options.responseType;
            }

            GM_xmlhttpRequest(requestOptions);
        });
    }

    /**
     *  带重试机制的API请求
     * @param {Object} options - 请求选项
     * @param {number} maxRetries - 最大重试次数
     * @returns {Promise<any>} - 请求结果
     */
    async function makeRequestWithRetry(options, maxRetries = 3) {
        let lastError;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await makeRequest(options);
            } catch (error) {
                lastError = error;

                // 对于某些错误不重试
                const noRetryPatterns = ['404', '401', '403', 'URL格式无效'];
                if (noRetryPatterns.some(pattern => error.message.includes(pattern))) {
                    throw error;
                }

                // 如果还有重试机会
                if (attempt < maxRetries - 1) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // 指数退避：1s, 2s, 4s
                    console.log(`[AI Gen] 请求失败，${delay}ms后重试 (${attempt + 1}/${maxRetries})`, error.message);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    /**
    * 生成简单的哈希值
    * @param {string} str - 输入字符串
    * @returns {string} - 生成的哈希ID
    */
    // [Phase 3.3] Stronger hash (FNV-1a)
    function simpleHash(str) {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = (h * 0x01000193) | 0;
        }
        return 'comfy-id-' + (h >>> 0).toString(36);
    }

    /**
     *  获取稳定的消息ID
     * @param {HTMLElement} messageNode - 消息DOM节点
     * @returns {string} - 稳定的消息ID
     */
    function getStableMessageId(messageNode) {
        // 优先使用SillyTavern的原生ID
        const nativeId = messageNode.dataset.messageId ||
            messageNode.getAttribute('mesid') ||
            messageNode.querySelector('[data-message-id]')?.dataset.messageId;

        if (nativeId) {
            return `native_${nativeId}`;
        }

        // 如果已经生成过ID，直接返回
        if (messageNode.dataset.aiGenId) {
            return messageNode.dataset.aiGenId;
        }

        // 生成新ID：时间戳 + 随机数
        const newId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        messageNode.dataset.aiGenId = newId;

        return newId;
    }

    /**
    * 转义正则表达式特殊字符
    * @param {string} str - 输入字符串
    * @returns {string} - 转义后的字符串
    */
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     *  SD提示词智能解析器
     * @description 支持完整的Stable Diffusion提示词语法
     */
    class SDPromptParser {
        constructor() {
            // 各类语法的正则表达式
            this.patterns = {
                // LoRA: <lora:name:weight> 或 <lyco:name:weight>
                lora: /<(lora|lyco):([^:>]+):?([0-9.]*?)>/gi,
                // Hypernetwork: <hypernet:name:weight>
                hypernet: /<hypernet:([^:>]+):?([0-9.]*?)>/gi,
                // Embedding/TI: embedding:name 或直接名称（需要在列表中）
                embedding: /\b(embedding:)?([a-zA-Z0-9_-]+)\b/g,
                // 权重语法: (word:1.2) 或 ((word)) 或 [word]
                weight: /(\(+)([^()[\]]+?)(:[\d.]+)?(\)+)|\[([^\[\]]+?)\]/g,
                // 混合语法: [word1:word2:0.5]
                blend: /\[([^:\[\]]+):([^:\[\]]+):([\d.]+)\]/g,
                // 交替语法: [word1|word2]
                alternate: /\[([^|\[\]]+)\|([^|\[\]]+)\]/g,
                // 特殊标记
                special: /\b(BREAK|AND)\b/i
            };
        }

        /**
         * 解析提示词为结构化对象
         * @param {string} prompt - 原始提示词
         * @returns {Object} 解析结果
         */
        parse(prompt) {
            if (!prompt || typeof prompt !== 'string') {
                return { loras: [], hypernets: [], embeddings: [], words: [], specials: [] };
            }

            const result = {
                loras: [],      // LoRA列表
                hypernets: [],  // Hypernetwork列表
                embeddings: [], // Embedding列表
                words: [],      // 普通词汇（包含权重语法）
                specials: [],   // 特殊标记（BREAK、AND）
                original: prompt.trim()
            };

            let remaining = prompt;

            // 1. 提取LoRA
            remaining = remaining.replace(this.patterns.lora, (match, type, name, weight) => {
                result.loras.push({
                    type: type.toLowerCase(),
                    name: name.trim(),
                    weight: parseFloat(weight) || 1.0,
                    raw: match
                });
                return ''; // 移除已提取的部分
            });

            // 2. 提取Hypernetwork
            remaining = remaining.replace(this.patterns.hypernet, (match, name, weight) => {
                result.hypernets.push({
                    name: name.trim(),
                    weight: parseFloat(weight) || 1.0,
                    raw: match
                });
                return '';
            });

            // 3. 提取特殊标记（BREAK、AND）
            const specialMatches = remaining.match(this.patterns.special) || [];
            specialMatches.forEach(s => {
                result.specials.push({ keyword: s, raw: s });
            });

            // 4. 分割普通词汇（保留完整的权重语法）
            remaining = remaining
                .replace(/\s*,\s*/g, ',') // 标准化逗号
                .replace(/,+/g, ',')      // 合并连续逗号
                .replace(/^,|,$/g, '');   // 移除首尾逗号

            if (remaining.trim()) {
                // 按逗号分割，但保持权重语法完整
                const parts = this.smartSplit(remaining);
                parts.forEach(part => {
                    const cleaned = part.trim();
                    if (cleaned && !this.patterns.special.test(cleaned)) {
                        result.words.push({
                            text: cleaned,
                            raw: cleaned,
                            hasWeight: /[(\[\])]/.test(cleaned)
                        });
                    }
                });
            }

            return result;
        }

        /**
         * 智能分割（保持括号内的内容完整）
         * @param {string} text - 待分割文本
         * @returns {Array<string>} 分割结果
         */
        smartSplit(text) {
            const result = [];
            let current = '';
            let depth = 0; // 括号深度

            for (let i = 0; i < text.length; i++) {
                const char = text[i];

                if (char === '(' || char === '[') {
                    depth++;
                    current += char;
                } else if (char === ')' || char === ']') {
                    depth--;
                    current += char;
                } else if (char === ',' && depth === 0) {
                    // 只在括号外分割
                    if (current.trim()) {
                        result.push(current.trim());
                    }
                    current = '';
                } else {
                    current += char;
                }
            }

            if (current.trim()) {
                result.push(current.trim());
            }

            return result;
        }

        // [Phase 4] rebuild() method removed - dead code
    }

    // [Phase 6.1] SDPromptParser singleton
    const sdPromptParser = new SDPromptParser();

    /**
     * 仅修复提示词里的明显格式错误：
     * 1. 删除逗号前多余的空格/Tab
     * 2. 逗号后如果直接接普通字符，则补一个空格
     * 3. 逗号后的多个空格/Tab压缩为一个空格
     * 4. 合并明显错误的连续逗号
     *
     * 注意：
     * - 不做去重
     * - 不做重排
     * - 不 trim 整体内容
     * - 不改动换行/回车
     */
    function fixPromptFormattingOnly(prompt) {
        if (typeof prompt !== 'string' || prompt === '') return '';

        return prompt
            // 删除逗号前的多余空格/Tab，不动换行
            .replace(/[ \t]+,/g, ',')
            // 合并连续逗号（只处理明显错误的情况，不动换行）
            .replace(/,([ \t]*,)+/g, ',')
            // 逗号后如果直接接普通字符，则补一个空格；如果后面本来就是换行/空格，则不动
            .replace(/,(?![ \t\r\n,]|$)/g, ', ')
            // 逗号后的多个空格/Tab压成一个空格，不动换行
            .replace(/,[ \t]{2,}/g, ', ');
    }

    /**
     * 合并两个提示词片段：
     * - 仅在“边界缺少分隔符”时补一个逗号
     * - 保留原有排版和换行
     * - 如果两边都已经有逗号，保留前一个，去掉后一个，避免双逗号
     */
    function mergePromptBoundaryPreserveFormat(previous, next) {
        if (!previous || !previous.trim()) return next || '';
        if (!next || !next.trim()) return previous || '';

        const prevTrailingWs = previous.match(/[ \t\r\n]*$/)?.[0] || '';
        const nextLeadingWs = next.match(/^[ \t\r\n]*/)?.[0] || '';

        const prevCore = previous.slice(0, previous.length - prevTrailingWs.length);
        let nextCore = next.slice(nextLeadingWs.length);

        if (!prevCore) return next;
        if (!nextCore) return previous;

        const prevEndsWithComma = prevCore.endsWith(',');
        const nextStartsWithComma = nextCore.startsWith(',');

        // 两边都有逗号：保留前一个，去掉后一个，避免变成 ",,"
        if (prevEndsWithComma && nextStartsWithComma) {
            nextCore = nextCore.replace(/^,/, '');
            return previous + nextLeadingWs + nextCore;
        }

        // 任意一边已有逗号，就不额外补
        if (prevEndsWithComma || nextStartsWithComma) {
            return previous + next;
        }

        // 边界缺少逗号：补一个逗号，但保留两边原有空白/换行
        return `${prevCore},${prevTrailingWs}${nextLeadingWs}${nextCore}`;
    }

    /**
     * 最终提示词合并：
     * - 只修复格式错误
     * - 不做任何重新排版
     * - 保留原有回车换行
     */
    function smartMergePrompts(...prompts) {
        const validPrompts = prompts.filter(
            p => typeof p === 'string' && p.trim() !== ''
        );

        if (validPrompts.length === 0) return '';

        let result = fixPromptFormattingOnly(validPrompts[0]);

        for (let i = 1; i < validPrompts.length; i++) {
            const next = fixPromptFormattingOnly(validPrompts[i]);
            result = mergePromptBoundaryPreserveFormat(result, next);
        }

        // 最后只再做一次轻量格式修复，不重排
        return fixPromptFormattingOnly(result);
    }

    /**
     *  提示词验证器
     * @param {string} prompt - 待验证的提示词
     * @returns {Object} 验证结果 { valid: boolean, errors: Array, warnings: Array }
     */
    function validatePrompt(prompt) {
        const result = {
            valid: true,
            errors: [],
            warnings: []
        };

        if (!prompt || typeof prompt !== 'string') {
            result.valid = false;
            result.errors.push('提示词为空或格式无效');
            return result;
        }

        // 检查括号匹配
        const openCount = (prompt.match(/\(/g) || []).length;
        const closeCount = (prompt.match(/\)/g) || []).length;
        if (openCount !== closeCount) {
            result.valid = false;
            result.errors.push(`圆括号不匹配：${openCount} 个 '(' vs ${closeCount} 个 ')'`);
        }

        const openSquare = (prompt.match(/\[/g) || []).length;
        const closeSquare = (prompt.match(/\]/g) || []).length;
        if (openSquare !== closeSquare) {
            result.valid = false;
            result.errors.push(`方括号不匹配：${openSquare} 个 '[' vs ${closeSquare} 个 ']'`);
        }

        // 检查LoRA语法
        const loraMatches = prompt.match(/<(lora|lyco):([^:>]+):?([0-9.]*?)>/gi) || [];
        loraMatches.forEach(match => {
            const parts = match.match(/<(lora|lyco):([^:>]+):?([0-9.]*?)>/i);
            if (parts) {
                const weight = parseFloat(parts[3]);
                if (parts[3] && (isNaN(weight) || weight < 0 || weight > 2)) {
                    result.warnings.push(`LoRA权重异常：${match}（建议范围：0-2）`);
                }
            }
        });

        // 检查权重语法
        const weightMatches = prompt.match(/\([^)]+:[\d.]+\)/g) || [];
        weightMatches.forEach(match => {
            const weight = parseFloat(match.match(/:([\d.]+)/)?.[1]);
            if (weight && (weight < 0.1 || weight > 2.0)) {
                result.warnings.push(`词权重异常：${match}（建议范围：0.1-2.0）`);
            }
        });

        // 检查长度（WebUI有75 token限制）
        const approximateTokens = prompt.split(/[,\s]+/).length;
        if (approximateTokens > 75) {
            result.warnings.push(`提示词可能超过75 token限制（约${approximateTokens}个词），建议使用BREAK分割`);
        }

        return result;
    }

    /**
     *  显示实际使用的提示词（增强版）
     * @param {string} positive - 正向提示词
     * @param {string} negative - 负向提示词
     * @param {string} mode - 生成模式
     */
    function logFinalPrompts(positive, negative, mode) {
        console.group(`[AI Gen] ${mode} 最终提示词`);

        // 验证提示词
        const posValidation = validatePrompt(positive);
        const negValidation = validatePrompt(negative);

        // [Phase 6.1] Use singleton instead of new instance
        const posParsed = sdPromptParser.parse(positive);
        const negParsed = sdPromptParser.parse(negative);

        console.log(' 正向提示词:', positive || '(无)');
        console.log('   📊 统计:', {
            LoRA: posParsed.loras.length,
            Hypernet: posParsed.hypernets.length,
            普通词: posParsed.words.length,
            特殊标记: posParsed.specials.length,
            总长度: positive.length + '字符'
        });

        if (posParsed.loras.length > 0) {
            console.log('    LoRA列表:', posParsed.loras.map(l => `${l.name}(${l.weight})`).join(', '));
        }

        if (!posValidation.valid || posValidation.warnings.length > 0) {
            console.warn('    验证问题:', [...posValidation.errors, ...posValidation.warnings]);
        }

        console.log('🚫 负向提示词:', negative || '(无)');
        console.log('   📊 统计:', {
            LoRA: negParsed.loras.length,
            普通词: negParsed.words.length,
            总长度: negative.length + '字符'
        });

        if (!negValidation.valid || negValidation.warnings.length > 0) {
            console.warn('    验证问题:', [...negValidation.errors, ...negValidation.warnings]);
        }

        console.groupEnd();
    }

    // [Phase 4] getPromptSuggestions() removed - dead code

    // [Phase 4] safeGetValue() removed - dead code

    /**
     *  输入验证器
     */
    const InputValidators = {
        // [Phase 4] port and percentage validators removed - dead code

        // 图片尺寸验证（必须是8的倍数）
        dimension: (val) => {
            const num = parseInt(val);
            return !isNaN(num) && num >= 64 && num <= 8192 && num % 8 === 0;
        },

        // CFG值验证
        cfg: (val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num >= 1 && num <= 30;
        },

        // 步数验证
        steps: (val) => {
            const num = parseInt(val);
            return !isNaN(num) && num >= 1 && num <= 150;
        },

        // URL验证
        url: (val) => {
            try {
                const normalized = /^https?:\/\//i.test(val) ? val : `http://${val}`;
                new URL(normalized);
                return true;
            } catch {
                return false;
            }
        }
    };

    /**
     *  验证设置输入
     * @returns {boolean} - 验证是否通过
     */
    function validateSettings() {
        const errors = [];

        // 验证URL
        const comfyUrl = document.getElementById('comfyui-url').value.trim();
        const webuiUrl = document.getElementById('webui-url').value.trim();

        if (comfyUrl && !InputValidators.url(comfyUrl)) {
            errors.push('ComfyUI URL格式错误');
        }
        if (webuiUrl && !InputValidators.url(webuiUrl)) {
            errors.push('WebUI URL格式错误');
        }

        // 验证尺寸
        const width = document.getElementById('comfyui-gen-width').value;
        const height = document.getElementById('comfyui-gen-height').value;

        if (width && !InputValidators.dimension(width)) {
            errors.push('生成宽度必须是64-8192之间且能被8整除的数字');
        }
        if (height && !InputValidators.dimension(height)) {
            errors.push('生成高度必须是64-8192之间且能被8整除的数字');
        }

        // 验证CFG
        const cfg = document.getElementById('comfyui-cfg').value;
        if (cfg && !InputValidators.cfg(cfg)) {
            errors.push('CFG值应在1-30之间');
        }

        // 验证步数
        const steps = document.getElementById('comfyui-steps').value;
        if (steps && !InputValidators.steps(steps)) {
            errors.push('步数应在1-150之间');
        }

        if (errors.length > 0) {
            showToast('error', errors.join('\n'));
            return false;
        }

        return true;
    }

    function showWorkflowValidationResult(result) {
        showWorkflowValidationToast(result, showToast);
    }

    // -------------------------------------------------------------------------
    // Section 4: Mode Switching and Panel Construction
    // -------------------------------------------------------------------------

    /**
    * 切换生成模式
    * @param {string} mode - 目标模式
    */
    async function switchMode(mode) {
        currentMode = mode;
        await GM_setValue(STORAGE_KEY_MODE, mode);
        updateModeUI();
        showToast('success', `已切换到 ${mode === MODES.COMFYUI ? 'ComfyUI' : 'WebUI'} 模式`);
        ConnectionMonitor.setStatus('disconnected', '未连接');
    }

    /**
    * 更新模式相关的UI
    */
    function updateModeUI() {
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

        //  修复：排除标签按钮，避免显示逻辑冲突
        comfySettings.forEach(el => {
            el.classList.toggle('hidden', !displayComfy);
            // 标签按钮的显示由后面专门的标签控制逻辑处理
            if (!el.classList.contains('tab-content') && !el.classList.contains('tab-button')) {
                el.style.display = displayComfy ? '' : 'none';
            }
        });

        //  修复：排除标签按钮，避免显示逻辑冲突
        webuiSettings.forEach(el => {
            el.classList.toggle('active', !displayComfy);
            // 标签按钮的显示由后面专门的标签控制逻辑处理
            if (!el.classList.contains('tab-content') && !el.classList.contains('tab-button')) {
                el.style.display = displayComfy ? 'none' : '';
            }
        });

        //  专门控制标签按钮的显示
        const comfyTabs = ['workflows', 'comfy-loras'];
        const webuiTabs = ['loras'];

        comfyTabs.forEach(tabName => {
            const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (tabButton) {
                //  修复：使用明确的display值，而不是空字符串
                tabButton.style.display = displayComfy ? 'block' : 'none';
            }
        });

        webuiTabs.forEach(tabName => {
            const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (tabButton) {
                //  修复：使用明确的display值，而不是空字符串
                tabButton.style.display = displayComfy ? 'none' : 'block';
            }
        });


        // 如果当前激活的标签被隐藏了，自动切换到通用标签
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab && activeTab.style.display === 'none') {
            document.querySelector('[data-tab="general"]')?.click();
        } else if (activeTab && ['generation', 'img2img', 'prompts'].includes(activeTab.dataset.tab)) {
            moveAdvancedSectionsToTab(activeTab.dataset.tab);
        }
    }

    /**
    * 创建ComfyUI/WebUI控制面板
    */
    function createComfyUIPanel() {
        if (document.getElementById(PANEL_ID)) return;

        const panelHTML = getPanelHtml({ panelId: PANEL_ID, modes: MODES });

        document.body.insertAdjacentHTML('beforeend', panelHTML);
        initPanelLogic();
    }


    // -------------------------------------------------------------------------
    // Section 5: Panel Interaction Wiring
    // -------------------------------------------------------------------------

    /**
    * 初始化面板逻辑
    */
    async function initPanelLogic() {
        const panel = document.getElementById(PANEL_ID);

        const inputs = getPanelInputs();
        const buttons = getPanelButtons(panel);

        // 设备适配初始化
        const deviceType = DeviceDetector.getDeviceType();
        panel.classList.add(`device-${deviceType}`);

        // [优化] 将事件监听器按功能分组
        initGeneralListeners(panel, buttons, inputs);
        initTabListeners();
        initWorkflowListeners(buttons, inputs);
        initApiListeners(buttons, inputs);
        initPresetManagers();
        initCacheListeners(buttons);
        initSettingsBackupListeners(buttons, inputs);

        // 加载设置
        await loadCurrentMode();
        await loadSettings(inputs);
        await syncComfyUILoraSelectionStorage();
        moveAdvancedSectionsToTab('generation');
        updateComfyUISelectedLorasDisplay();
    }

    // [优化] 拆分 initPanelLogic
    function initGeneralListeners(panel, buttons, inputs) {
        buttons.close.addEventListener('click', () => {
            panel.style.display = 'none';
        });

        document.querySelectorAll('.mode-switch-option').forEach(btn => {
            btn.addEventListener('click', () => switchMode(btn.dataset.mode));
        });

        inputs.webuiEnableHires.addEventListener('change', () => {
            document.getElementById('hires-settings').style.display = inputs.webuiEnableHires.checked ? 'grid' : 'none';
        });

        // [Phase 1.2] 自动保存设置（debounced）
        let saveDebounceTimer = null;
        Object.values(inputs).forEach(input => {
            const eventType = (input.tagName === 'SELECT' || input.type === 'checkbox') ? 'change' : 'input';
            input.addEventListener(eventType, () => {
                if (input === inputs.url) buttons.test.className = 'comfy-button';
                else if (input === inputs.webuiUrl) buttons.webuiTest.className = 'comfy-button';
                clearTimeout(saveDebounceTimer);
                saveDebounceTimer = setTimeout(() => saveSettings(inputs), 500);
            });
        });

        // Feature 2: 尺寸预设按钮
        panel.querySelectorAll('.comfy-size-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('comfyui-gen-width').value = btn.dataset.w;
                document.getElementById('comfyui-gen-height').value = btn.dataset.h;
                document.getElementById('comfyui-gen-width').dispatchEvent(new Event('input', { bubbles: true }));
                document.getElementById('comfyui-gen-height').dispatchEvent(new Event('input', { bubbles: true }));
                showToast('success', `尺寸已设为 ${btn.dataset.w}x${btn.dataset.h}`);
            });
        });

        // Feature 5: Seed 管理按钮
        ['comfyui', 'webui'].forEach(prefix => {
            const input = document.getElementById(`${prefix}-seed`);
            input?.addEventListener('input', () => {
                delete input.dataset.autoSeed;
            });

            document.getElementById(`${prefix}-seed-random`)?.addEventListener('click', () => {
                input.value = -1;
                delete input.dataset.locked;
                delete input.dataset.autoSeed;
                document.getElementById(`${prefix}-seed-lock`).innerHTML = '&#x1F513;';
            });
            document.getElementById(`${prefix}-seed-lock`)?.addEventListener('click', () => {
                const lockBtn = document.getElementById(`${prefix}-seed-lock`);
                if (input.dataset.locked) {
                    delete input.dataset.locked;
                    lockBtn.innerHTML = '&#x1F513;';
                } else {
                    input.dataset.locked = 'true';
                    lockBtn.innerHTML = '&#x1F512;';
                }
            });
        });

        // Feature 3: Img2Img 事件监听
        initImg2ImgListeners();
    }

    // Feature 5: Seed 辅助函数
    function getSeedForGeneration() {
        const seedInput = currentMode === MODES.COMFYUI
            ? document.getElementById('comfyui-seed')
            : document.getElementById('webui-seed');
        const val = Number.parseInt(seedInput?.value, 10);
        if (!seedInput) {
            return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        }

        if (!seedInput.dataset.locked) {
            const autoSeed = Number.parseInt(seedInput.dataset.autoSeed || '', 10);
            if (Number.isNaN(val) || val < 0 || (!Number.isNaN(autoSeed) && autoSeed === val)) {
                return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            }
        }

        return (Number.isNaN(val) || val < 0) ? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) : val;
    }

    function updateSeedDisplay(seed) {
        const seedInput = currentMode === MODES.COMFYUI
            ? document.getElementById('comfyui-seed')
            : document.getElementById('webui-seed');
        if (seedInput && !seedInput.dataset.locked) {
            seedInput.value = seed;
            seedInput.dataset.autoSeed = String(seed);
        }
    }

    // Feature 3: Img2Img 函数
    function initImg2ImgListeners() {
        ['comfyui', 'webui'].forEach(prefix => {
            const enableCheckbox = document.getElementById(`${prefix}-img2img-enable`);
            const area = document.getElementById(`${prefix}-img2img-area`);
            const dropzone = document.getElementById(`${prefix}-img2img-dropzone`);
            const fileInput = document.getElementById(`${prefix}-img2img-file`);
            const preview = document.getElementById(`${prefix}-img2img-preview`);
            const clearButton = document.getElementById(`${prefix}-img2img-clear`);
            const img2imgState = getImg2ImgState(prefix);

            enableCheckbox?.addEventListener('change', () => {
                if (area) area.style.display = enableCheckbox.checked ? 'block' : 'none';
                img2imgState.enabled = enableCheckbox.checked;
            });

            dropzone?.addEventListener('click', () => fileInput?.click());
            dropzone?.addEventListener('dragover', e => { e.preventDefault(); dropzone.style.borderColor = 'var(--vp-accent-color)'; });
            dropzone?.addEventListener('dragleave', () => { dropzone.style.borderColor = 'var(--vp-border-color)'; });
            dropzone?.addEventListener('drop', e => {
                e.preventDefault();
                dropzone.style.borderColor = 'var(--vp-border-color)';
                const file = e.dataTransfer.files[0];
                if (file) handleImg2ImgFile(prefix, file, preview);
            });
            fileInput?.addEventListener('change', (e) => {
                if (e.target.files[0]) handleImg2ImgFile(prefix, e.target.files[0], preview);
            });
            clearButton?.addEventListener('click', () => clearImg2ImgState(prefix));
        });
    }

    function handleImg2ImgFile(prefix, file, previewEl) {
        if (!file.type.startsWith('image/')) { showToast('error', '请上传图片文件'); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img2imgState = getImg2ImgState(prefix);
            img2imgState.imageData = e.target.result;
            img2imgState.fileName = file.name;
            img2imgState.fileSize = file.size;
            img2imgState.enabled = true;
            const enableCheckbox = document.getElementById(`${prefix}-img2img-enable`);
            const area = document.getElementById(`${prefix}-img2img-area`);
            if (enableCheckbox) enableCheckbox.checked = true;
            if (area) area.style.display = 'block';
            if (previewEl) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.onload = () => {
                    img2imgState.width = img.naturalWidth;
                    img2imgState.height = img.naturalHeight;
                    renderImg2ImgPreview(prefix);
                };
                renderImg2ImgPreview(prefix);
            }
            showToast('success', '参考图片已加载');
        };
        reader.readAsDataURL(file);
    }

    function clearImg2ImgState(prefix) {
        const img2imgState = getImg2ImgState(prefix);
        img2imgState.enabled = false;
        img2imgState.imageData = null;
        img2imgState.fileName = null;
        img2imgState.fileSize = null;
        img2imgState.width = null;
        img2imgState.height = null;

        const enableCheckbox = document.getElementById(`${prefix}-img2img-enable`);
        const area = document.getElementById(`${prefix}-img2img-area`);
        const fileInput = document.getElementById(`${prefix}-img2img-file`);
        const preview = document.getElementById(`${prefix}-img2img-preview`);
        if (enableCheckbox) enableCheckbox.checked = false;
        if (area) area.style.display = 'none';
        if (fileInput) fileInput.value = '';
        if (preview) preview.innerHTML = '';
    }

    function renderImg2ImgPreview(prefix) {
        const previewEl = document.getElementById(`${prefix}-img2img-preview`);
        const img2imgState = getImg2ImgState(prefix);
        if (!previewEl || !img2imgState.imageData) return;

        previewEl.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'img2img-preview-card';

        const img = document.createElement('img');
        img.src = img2imgState.imageData;

        const info = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'img2img-preview-name';
        name.textContent = img2imgState.fileName || '参考图片';

        const meta = document.createElement('div');
        meta.className = 'img2img-preview-meta';
        const sizeText = img2imgState.fileSize ? `${(img2imgState.fileSize / 1024 / 1024).toFixed(2)} MB` : '未知大小';
        const dimensionText = img2imgState.width && img2imgState.height ? `${img2imgState.width}x${img2imgState.height}` : '读取尺寸中';
        meta.textContent = `${dimensionText} · ${sizeText}`;

        info.append(name, meta);
        card.append(img, info);
        previewEl.appendChild(card);
    }

    async function uploadImageToComfyUI(url, imageDataUrl, filename) {
        const resp = await fetch(imageDataUrl);
        const blob = await resp.blob();
        const formData = new FormData();
        formData.append('image', blob, filename || 'input.png');
        const result = await makeRequest({
            method: 'POST', url: `${url}/upload/image`,
            data: formData,
        });
        const parsed = safeJsonParse(result.responseText, null, 'upload/image');
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('ComfyUI 上传图片返回了无效数据');
        }
        return parsed;
    }

    // Feature 7: 多图网格显示
    async function displayImageGrid(anchorElement, images) {
        let container = anchorElement.nextElementSibling;
        if (!container || !container.classList.contains('comfy-image-container')) {
            container = document.createElement('span');
            container.className = 'comfy-image-container';
            anchorElement.insertAdjacentElement('afterend', container);
        }
        container.innerHTML = '';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = `repeat(${Math.min(images.length, 2)}, 1fr)`;
        container.style.gap = '4px';

        const displayWidth = await GM_getValue('comfyui_display_width');
        for (const { imageUrl, seed } of images) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = 'Generated by AI';
            img.style.width = '100%';
            img.style.maxWidth = displayWidth > 0 ? `${displayWidth}px` : '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '4px';
            img.style.cursor = 'pointer';
            img._aiGenMeta = { seed };
            img.addEventListener('mouseenter', (e) => { if (img._aiGenMeta) ImageTooltip.show(e, img._aiGenMeta); });
            img.addEventListener('mousemove', (e) => ImageTooltip.position(e));
            img.addEventListener('mouseleave', () => ImageTooltip.hide());
            img.addEventListener('click', () => window.open(imageUrl, '_blank'));
            container.appendChild(img);
        }
    }

    // [优化] 拆分 initPanelLogic
    function initTabListeners() {
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.tab-button.active').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content.active').forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                const targetTab = document.getElementById(`tab-${tabId}`);
                if (['generation', 'img2img', 'prompts'].includes(tabId)) {
                    moveAdvancedSectionsToTab(tabId);
                }
                targetTab.classList.add('active');

                if (tabId === 'loras') {
                    // updateSelectedLorasDisplay is for WebUI which uses a different system
                    updateSelectedEmbeddingsDisplay();
                }
                if (tabId === 'comfy-loras') {
                    updateComfyUISelectedLorasDisplay();
                }
                if (tabId === 'cache') loadImageCache();

                // [修复] 切换到工作流标签时，强制刷新列表
                if (tabId === 'workflows') {
                    updateWorkflowList();
                }


                if (DeviceDetector.isMobile()) {
                    const panelContent = document.querySelector('.comfyui-panel-content');
                    if (panelContent) panelContent.scrollTop = 0;
                }
            });
        });
    }

    function moveAdvancedSectionsToTab(tabId) {
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
                !section.classList.contains('comfyui-settings') && !section.classList.contains('webui-settings')
            ) || (
                currentMode === MODES.COMFYUI && section.classList.contains('comfyui-settings')
            ) || (
                currentMode === MODES.WEBUI && section.classList.contains('webui-settings')
            );
            section.style.display = matchesTab && matchesMode ? '' : 'none';
        });
    }

    // [优化] 拆分 initPanelLogic
    function initWorkflowListeners(buttons, inputs) {
        document.getElementById('workflow-search').addEventListener('input', (e) => filterWorkflows(e.target.value.toLowerCase()));
        buttons.editMode.addEventListener('click', toggleEditMode);
        buttons.saveEdit.addEventListener('click', saveEditedWorkflow);
        buttons.cancelEdit.addEventListener('click', cancelEditMode);
        buttons.formatWorkflow?.addEventListener('click', () => formatCurrentWorkflow(inputs.workflow));
        buttons.copyWorkflow?.addEventListener('click', () => copyCurrentWorkflow(inputs.workflow));
        document.querySelectorAll('.workflow-placeholder-btn').forEach(button => {
            button.addEventListener('click', () => insertWorkflowPlaceholder(inputs.workflow, button.dataset.placeholder));
        });
        buttons.toPlaceholders.addEventListener('click', () => {
            if (!inputs.workflow.value.trim()) return showToast('error', '工作流内容为空');
            try {
                inputs.workflow.value = convertWorkflowToPlaceholders(inputs.workflow.value);
                showWorkflowValidationResult(validateComfyWorkflow(inputs.workflow.value));
                showToast('success', '工作流已转换为占位符格式 (请务必自行检查)');
            } catch (error) {
                showToast('error', `转换失败: ${error.message}`);
            }
        });
        buttons.validateWorkflow.addEventListener('click', () => {
            if (!inputs.workflow.value.trim()) return showToast('error', '工作流内容为空');
            showWorkflowValidationResult(validateComfyWorkflow(inputs.workflow.value));
        });
        buttons.createWorkflow.addEventListener('click', () => {
            inputs.workflow.value = '';
            showWorkflowSaveModal('新工作流');
        });
        buttons.saveWorkflow.addEventListener('click', () => {
            if (!inputs.workflow.value.trim()) return showToast('error', '工作流内容不能为空');
            const validation = validateComfyWorkflow(inputs.workflow.value);
            showWorkflowValidationResult(validation);
            if (!validation.ok) return;
            showWorkflowSaveModal('');
        });
        buttons.exportWorkflows.addEventListener('click', exportAllWorkflows);
        buttons.importWorkflows.addEventListener('click', importAllWorkflows);
    }

    // [优化] 拆分 initPanelLogic
    function initApiListeners(buttons, inputs) {
        const disconnect = () => {
            ConnectionMonitor.destroy();
            ConnectionMonitor.setStatus('disconnected', '已断开');
            manualScan.stop();
            showToast('info', '已断开，扫描已停止');
        };

        buttons.disconnect.addEventListener('click', disconnect);
        buttons.webuiDisconnect.addEventListener('click', disconnect);

        buttons.scanChat.addEventListener('click', async () => {
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
                await makeRequest({ method: "GET", url: `${url}${endpoint}` });

                testButton.className = 'comfy-button success';
                showToast('success', '连接成功');
                ConnectionMonitor.start();
                manualScan.start();
                await successCallback(url, inputs);
            } catch (error) {
                testButton.className = 'comfy-button error';
                showToast('error', `连接失败: ${error.message}`);
            } finally {
                testButton.disabled = false;
            }
        };

        buttons.test.addEventListener('click', createTestConnectionHandler(inputs.url, buttons.test, async (url, inputs) => {
            await Promise.all([
                fetchAndPopulateModels(url, inputs.modelSelect, false),
                fetchAndPopulateUNetModels(url, inputs.unetSelect, false),
                fetchAndPopulateComfyUILoras(url, false),
                fetchAndPopulateComfyUISamplingOptions(url, false)
            ]);
        }));

        buttons.webuiTest.addEventListener('click', createTestConnectionHandler(inputs.webuiUrl, buttons.webuiTest, async (url, inputs) => {
            await Promise.all([
                fetchAndPopulateWebUIModels(url, inputs.webuiModelSelect, false),
                fetchAndPopulateWebUILoras(url, false),
                fetchAndPopulateWebUIEmbeddings(url, false),
                fetchAndPopulateWebUISamplingOptions(url, false)
            ]);
        }));

        const handleApiAction = (urlInput, action, warningMessage) => async () => {
            const url = urlInput.value.trim();
            if (url) await action(url);
            else showToast('warning', warningMessage);
        };

        buttons.refreshModels.addEventListener('click', handleApiAction(
            inputs.url,
            url => Promise.all([
                fetchAndPopulateModels(url, inputs.modelSelect, false),
                fetchAndPopulateComfyUISamplingOptions(url, false)
            ]),
            '请先输入ComfyUI URL'
        ));

        buttons.refreshUnets.addEventListener('click', handleApiAction(
            inputs.url,
            url => fetchAndPopulateUNetModels(url, inputs.unetSelect, false),
            '请先输入ComfyUI URL'
        ));

        buttons.webuiRefreshModels.addEventListener('click', handleApiAction(
            inputs.webuiUrl,
            url => Promise.all([
                fetchAndPopulateWebUIModels(url, inputs.webuiModelSelect, false),
                fetchAndPopulateWebUISamplingOptions(url, false)
            ]),
            '请先输入WebUI URL'
        ));

        buttons.webuiRefreshLoras.addEventListener('click', handleApiAction(inputs.webuiUrl, url => fetchAndPopulateWebUILoras(url, false), '请先输入WebUI URL'));
        buttons.webuiRefreshEmbeddings.addEventListener('click', handleApiAction(inputs.webuiUrl, url => fetchAndPopulateWebUIEmbeddings(url, false), '请先输入WebUI URL'));
        buttons.comfyuiRefreshLorasList.addEventListener('click', handleApiAction(inputs.url, url => fetchAndPopulateComfyUILoras(url, false), '请先输入ComfyUI URL'));

        if (buttons.loraAdd) {
            buttons.loraAdd.addEventListener('click', () => {
                const loraSelect = document.getElementById('webui-lora-select');
                const weightInput = document.getElementById('webui-lora-weight-input');
                const positivePromptTextarea = document.getElementById('comfyui-positive-prompt');
                const loraName = loraSelect.value;
                if (!loraName) return showToast('warning', '请先选择一个LoRA模型');

                const loraTag = `<lora:${loraName}:${weightInput.value || '1.0'}>`;
                const endsWithCommaSpace = /,\s*$/.test(positivePromptTextarea.value);

                positivePromptTextarea.value += (positivePromptTextarea.value.trim() && !endsWithCommaSpace ? ', ' : '') + loraTag;
                positivePromptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                showToast('success', `已添加LoRA: ${loraName}`);
            });
        }

        document.getElementById('comfyui-lora-search')?.addEventListener('input', renderComfyUILoraList);
        document.getElementById('comfyui-lora-folder-filter')?.addEventListener('change', renderComfyUILoraList);
        buttons.comfyuiLoraClearSelection?.addEventListener('click', () => {
            if (getCurrentComfyUISelectedLoras().length === 0) return;
            if (!confirm('确定要清空当前选择的ComfyUI LoRA吗？')) return;
            comfyUILoraManager.clear();
            renderComfyUILoraList();
            updateComfyUISelectedLorasDisplay();
            showToast('success', '已清空ComfyUI LoRA选择');
        });
    }

    // [优化] 拆分 initPanelLogic
    function initCacheListeners(buttons) {
        buttons.clearCache.addEventListener('click', async () => {
            if (confirm('您确定要删除所有已生成的图片缓存吗？')) {
                await GM_setValue(STORAGE_KEY_IMAGES, {});
                document.querySelectorAll('.comfy-image-container').forEach(el => el.remove());
                document.querySelectorAll('.comfy-button-group').forEach(group => {
                    group.querySelector('.comfy-delete-button')?.remove();
                    const genBtn = group.querySelector('.comfy-chat-generate-button');
                    if (genBtn) {
                        genBtn.textContent = '开始生成';
                        genBtn.disabled = false;
                        genBtn.className = 'comfy-button comfy-chat-generate-button';
                    }
                });
                showToast('success', '图片缓存已清空');
            }
        });
        buttons.applyDims.addEventListener('click', async () => {
            const displayWidth = await GM_getValue('comfyui_display_width', DEFAULT_SETTINGS.displayWidth);
            const displayHeight = await GM_getValue('comfyui_display_height', DEFAULT_SETTINGS.displayHeight);
            document.querySelectorAll('.comfy-image-container img').forEach(img => {
                img.style.width = '100%';
                img.style.maxWidth = displayWidth > 0 ? `${displayWidth}px` : '100%';
                img.style.maxHeight = displayHeight > 0 ? `${displayHeight}px` : 'none';
                img.style.height = 'auto'; // 保持比例
            });
            showToast('success', '显示尺寸已应用');
        });
        buttons.applyTags.addEventListener('click', () => showToast('success', '捕获标记已更新！'));
        buttons.applyGenParams.addEventListener('click', () => showToast('success', 'ComfyUI生成参数已保存！'));
        buttons.webuiApplyGenParams.addEventListener('click', () => showToast('success', 'WebUI生成参数已保存！'));
        buttons.cacheRefresh?.addEventListener('click', loadImageCache);
        buttons.cacheClearAll?.addEventListener('click', clearAllCache);

        document.getElementById('cache-export')?.addEventListener('click', async () => {
            try {
                const data = await imageCacheDB.exportCache();
                const blob = new Blob([data], { type: 'application/json' });
                const url = BlobURLTracker.create(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ai_gen_cache_${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                BlobURLTracker.revoke(url);
                showToast('success', '缓存已导出');
            } catch (e) {
                console.error('[AI Gen] 导出失败:', e);
                showToast('error', '导出失败');
            }
        });

        // 导入缓存
        document.getElementById('cache-import')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                    const text = await file.text();
                    const count = await imageCacheDB.importCache(text);
                    await loadImageCache();
                    showToast('success', `成功导入 ${count} 张图片`);
                } catch (e) {
                    console.error('[AI Gen] 导入失败:', e);
                    showToast('error', '导入失败，文件格式可能不正确');
                }
            };
            input.click();
        });
    }

    function initSettingsBackupListeners(buttons, inputs) {
        buttons.exportSettings?.addEventListener('click', exportAllSettings);
        buttons.importSettings?.addEventListener('click', () => importAllSettings(inputs));
    }

    // [优化] 拆分 initPanelLogic
    function initPresetManagers() {
        // 提示词预设管理器
        createPresetManager({
            storageKey: STORAGE_KEY_PROMPT_PRESETS,
            selectElementId: 'prompt-preset-select',
            loadButtonId: 'prompt-preset-load',
            saveButtonId: 'prompt-preset-save',
            deleteButtonId: 'prompt-preset-delete',
            modalId: 'prompt-preset-save-modal',
            nameInputId: 'prompt-preset-name-input',
            overwriteWarningId: 'prompt-preset-overwrite-warning',
            saveConfirmButtonId: 'prompt-preset-save-confirm',
            saveCancelButtonId: 'prompt-preset-save-cancel',
            presetType: '提示词',
            getCurrentData: () => ({
                positive: document.getElementById('comfyui-positive-prompt').value,
                negative: document.getElementById('comfyui-negative-prompt').value,
            }),
            applyPreset: async (preset) => {
                document.getElementById('comfyui-positive-prompt').value = preset.positive || '';
                document.getElementById('comfyui-negative-prompt').value = preset.negative || '';
                // 触发保存
                await saveSettings({
                    positivePrompt: document.getElementById('comfyui-positive-prompt'),
                    negativePrompt: document.getElementById('comfyui-negative-prompt')
                });
            }
        });

        // ComfyUI LoRA 预设管理器
        createPresetManager({
            storageKey: STORAGE_KEY_COMFYUI_LORA_PRESETS,
            selectElementId: 'comfyui-lora-preset-select',
            loadButtonId: 'comfyui-lora-preset-load',
            saveButtonId: 'comfyui-lora-preset-save',
            deleteButtonId: 'comfyui-lora-preset-delete',
            modalId: 'lora-preset-save-modal',
            nameInputId: 'lora-preset-name-input',
            overwriteWarningId: 'lora-preset-overwrite-warning',
            saveConfirmButtonId: 'lora-preset-save-confirm',
            saveCancelButtonId: 'lora-preset-save-cancel',
            presetType: 'ComfyUI LoRA',
            getCurrentData: () => ({ loras: getCurrentComfyUISelectedLoras() }),
            canSave: () => getCurrentComfyUISelectedLoras().length > 0,
            applyPreset: async (preset) => {
                if (preset && preset.loras) {
                    const mode = document.getElementById('comfyui-lora-preset-mode')?.value || 'replace';
                    applyComfyUILoraPreset(preset.loras, mode);
                    renderComfyUILoraList();
                    updateComfyUISelectedLorasDisplay();
                }
            }
        });
    }

    function applyComfyUILoraPreset(presetLoras, mode = 'replace') {
        const incoming = normalizeComfyUILoraItems(presetLoras);
        if (mode === 'replace') {
            comfyUILoraManager.setAll(incoming);
            return;
        }

        const current = getCurrentComfyUISelectedLoras();
        const byName = new Map(current.map(lora => [lora.name, lora]));

        incoming.forEach(lora => {
            if (mode === 'append' && byName.has(lora.name)) return;
            byName.set(lora.name, lora);
        });

        comfyUILoraManager.setAll([...byName.values()]);
    }

    /**
    * 加载当前模式
    */
    async function loadCurrentMode() {
        currentMode = await GM_getValue(STORAGE_KEY_MODE, DEFAULT_SETTINGS.mode);
        updateModeUI();
    }

    /**
    * 切换编辑模式
    */
    function toggleEditMode() {
        isEditMode = !isEditMode;
        const toolbar = document.getElementById('edit-mode-toolbar');
        const editModeBtn = document.getElementById('workflow-edit-mode');

        if (isEditMode) {
            toolbar.classList.add('active');
            editModeBtn.textContent = '退出编辑';
            editModeBtn.classList.add('error');
            showToast('info', '已进入编辑模式，点击工作流名称可直接编辑');
        } else {
            toolbar.classList.remove('active');
            editModeBtn.textContent = '编辑模式';
            editModeBtn.classList.remove('error');
            document.querySelectorAll('.workflow-item.editing').forEach(item => {
                item.classList.remove('editing');
            });
        }
    }

    /**
    * 保存编辑的工作流
    */
    async function saveEditedWorkflow() {
        if (!currentEditingWorkflow) return;

        const editInput = currentEditingWorkflow.querySelector('.workflow-edit-input');
        const newName = editInput.value.trim();
        const oldName = currentEditingWorkflow.dataset.workflowName;

        if (!newName) {
            showToast('error', '工作流名称不能为空');
            return;
        }

        currentEditingWorkflow.classList.remove('editing');
        currentEditingWorkflow = null;

        if (newName === oldName) return;

        const workflows = await GM_getValue(STORAGE_KEY_WORKFLOWS, {});
        if (workflows[newName] && !confirm(`工作流"${newName}"已存在，是否覆盖？`)) {
            return;
        }

        workflows[newName] = workflows[oldName];
        delete workflows[oldName];
        await GM_setValue(STORAGE_KEY_WORKFLOWS, workflows);

        showToast('success', `工作流已重命名为"${newName}"`);
        updateWorkflowList();
    }

    /**
    * 取消编辑模式
    */
    function cancelEditMode() {
        if (currentEditingWorkflow) {
            currentEditingWorkflow.classList.remove('editing');
            currentEditingWorkflow = null;
        }
        if (isEditMode) {
            toggleEditMode();
        }
    }

    /**
    * 过滤工作流
    */
    function filterWorkflows(searchTerm) {
        document.querySelectorAll('.workflow-item').forEach(item => {
            const title = item.querySelector('.workflow-item-title').textContent.toLowerCase();
            item.style.display = title.includes(searchTerm) ? 'flex' : 'none';
        });
    }

    function formatCurrentWorkflow(workflowInput) {
        if (!workflowInput.value.trim()) {
            showToast('error', '工作流内容为空');
            return;
        }

        try {
            workflowInput.value = JSON.stringify(JSON.parse(workflowInput.value), null, 2);
            workflowInput.dispatchEvent(new Event('input', { bubbles: true }));
            showWorkflowValidationResult(validateComfyWorkflow(workflowInput.value));
            showToast('success', '工作流 JSON 已格式化');
        } catch (error) {
            showToast('error', `格式化失败: ${error.message}`);
        }
    }

    async function copyCurrentWorkflow(workflowInput) {
        if (!workflowInput.value.trim()) {
            showToast('error', '工作流内容为空');
            return;
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(workflowInput.value);
            } else {
                workflowInput.select();
                document.execCommand('copy');
            }
            showToast('success', '工作流 JSON 已复制');
        } catch (error) {
            showToast('error', `复制失败: ${error.message}`);
        }
    }

    function insertWorkflowPlaceholder(workflowInput, placeholder) {
        if (!placeholder) return;

        const start = workflowInput.selectionStart ?? workflowInput.value.length;
        const end = workflowInput.selectionEnd ?? workflowInput.value.length;
        workflowInput.value = `${workflowInput.value.slice(0, start)}${placeholder}${workflowInput.value.slice(end)}`;
        workflowInput.focus();
        workflowInput.setSelectionRange(start + placeholder.length, start + placeholder.length);
        workflowInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * 转换工作流为占位符格式
     * @param {string} workflowString - 原始工作流字符串
     * @returns {string} - 转换后的工作流字符串
     */
    function convertWorkflowToPlaceholders(workflowString) {
        try {
            const workflow = JSON.parse(workflowString);
            let modified = false;

            // 首先分析节点连接关系，识别正负提示词节点
            const nodeConnections = analyzeNodeConnections(workflow);
            console.log('[AI Gen] 节点连接分析结果:', nodeConnections);

            // 遍历每个节点进行处理
            for (const nodeId in workflow) {
                const nodeData = workflow[nodeId];
                if (nodeData && typeof nodeData === 'object') {
                    if (processNodeForPlaceholders(nodeData, nodeId, nodeConnections, workflow)) {
                        modified = true;
                    }
                }
            }

            if (!modified) {
                throw new Error('未找到可替换的值，工作流可能已是占位符格式');
            }

            return JSON.stringify(workflow, null, 2);
        } catch (error) {
            throw new Error(`解析工作流失败: ${error.message}`);
        }
    }

    /**
     * [辅助函数] 递归处理节点对象以替换占位符
     */
    function processNodeForPlaceholders(obj, nodeId, connections, workflow) {
        let hasModified = false;
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                // 递归处理嵌套对象
                if (processNodeForPlaceholders(value, nodeId, connections, workflow)) {
                    hasModified = true;
                }
            } else if (typeof value === 'string' || typeof value === 'number') {
                const replacement = getPlaceholder(key, value, nodeId, connections, workflow);
                if (replacement !== null && replacement !== value) {
                    obj[key] = replacement;
                    hasModified = true;
                    console.log(`[AI Gen] 替换: 节点 ${nodeId}, 键 ${key}: "${value}" -> "${replacement}"`);
                }
            }
        }
        return hasModified;
    }


    /**
    * [辅助函数] 分析节点连接关系
    */
    function analyzeNodeConnections(workflow) {
        const connections = {
            positivePromptNodes: new Set(),
            negativePromptNodes: new Set(),
            samplerNodes: new Set()
        };

        // 找到所有采样器节点
        for (const [nodeId, nodeData] of Object.entries(workflow)) {
            if (nodeData.class_type?.toLowerCase().includes('sampler')) {
                connections.samplerNodes.add(nodeId);
            }
        }

        // 分析采样器的positive和negative连接
        for (const samplerId of connections.samplerNodes) {
            const inputs = workflow[samplerId]?.inputs;
            if (inputs?.positive?.[0]) connections.positivePromptNodes.add(inputs.positive[0].toString());
            if (inputs?.negative?.[0]) connections.negativePromptNodes.add(inputs.negative[0].toString());
        }
        return connections;
    }


    /**
     * [辅助函数] 根据键名和值获取对应的占位符
     */
    function getPlaceholder(key, value, nodeId, connections, workflow) {
        const keyLower = key.toLowerCase();
        const currentNode = workflow[nodeId];

        // Checkpoint & UNet 模型处理
        if ((keyLower.includes('ckpt_name') || keyLower.includes('model_name')) && typeof value === 'string' && value) return '%model%';
        if ((keyLower.includes('unet_name')) && typeof value === 'string' && value) return '%unet_model%';

        // 提示词处理
        if (keyLower === 'text' && typeof value === 'string' && currentNode?.class_type === 'CLIPTextEncode') {
            if (connections.positivePromptNodes.has(nodeId)) return '%prompt%';
            if (connections.negativePromptNodes.has(nodeId)) return '%negative_prompt%';

            // 当连接不明确时，根据节点标题和内容进行猜测
            const title = currentNode._meta?.title?.toLowerCase() || '';
            if (title.includes('负') || title.includes('negative')) return '%negative_prompt%';
            if (title.includes('正') || title.includes('positive')) return '%prompt%';

            const negativeKeywords = ['worst', 'bad', 'ugly', 'low quality', 'nsfw'];
            if (negativeKeywords.some(kw => value.toLowerCase().includes(kw))) {
                return '%negative_prompt%';
            }
            return '%prompt%'; // 默认为正向
        }

        // 尺寸、种子、步数、CFG
        if (keyLower === 'width' && typeof value === 'number' && value > 0) return '%width%';
        if (keyLower === 'height' && typeof value === 'number' && value > 0) return '%height%';
        if (keyLower === 'seed' && typeof value === 'number') return '%seed%';
        if (keyLower === 'steps' && typeof value === 'number' && value > 0) return '%steps%';
        if (keyLower === 'cfg' && typeof value === 'number' && value > 0) return '%cfg%';

        // 采样器和调度器
        if ((keyLower === 'sampler_name' || keyLower === 'sampler') && typeof value === 'string' && value) return '%sampler%';
        if (keyLower === 'scheduler' && typeof value === 'string' && value) return '%scheduler%';

        return null; // 没有匹配的占位符
    }

    /**
    * 更新工作流列表显示
    */
    async function updateWorkflowList() {
        const listContainer = document.getElementById('workflow-list');
        const workflows = await GM_getValue(STORAGE_KEY_WORKFLOWS, {});
        const currentWorkflowJSON = await GM_getValue('comfyui_workflow', '');

        listContainer.innerHTML = ''; // 清空列表

        if (Object.keys(workflows).length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-workflows-message';
            emptyMsg.textContent = '暂无保存的工作流，请创建或导入。';
            listContainer.appendChild(emptyMsg);
            return;
        }

        const sortedNames = Object.keys(workflows).sort();

        // [安全修复] 使用 DOM API 代替 innerHTML
        for (const name of sortedNames) {
            const workflowData = workflows[name];
            const isActive = workflowData === currentWorkflowJSON;

            const item = document.createElement('div');
            item.className = `workflow-item${isActive ? ' active' : ''}`;
            item.dataset.workflowName = name;

            const title = document.createElement('div');
            title.className = 'workflow-item-title';
            title.textContent = name;

            const editInput = document.createElement('input');
            editInput.type = 'text';
            editInput.className = 'workflow-edit-input';
            editInput.value = name;

            const actions = document.createElement('div');
            actions.className = 'workflow-item-actions';

            // 创建按钮
            const createActionButton = (text, className, onClick) => {
                const btn = document.createElement('button');
                btn.className = `comfy-button ${className}`;
                btn.textContent = text;
                btn.addEventListener('click', onClick);
                return btn;
            };

            const loadBtn = createActionButton('加载', 'workflow-load-btn', () => loadWorkflow(name, workflowData, item));
            const cloneBtn = createActionButton('克隆', 'workflow-clone-btn', () => cloneWorkflow(name, workflowData));
            const renameBtn = createActionButton('重命名', 'workflow-rename-btn', () => renameWorkflow(name));
            const deleteBtn = createActionButton('删除', 'error workflow-delete-btn', () => deleteWorkflow(name));

            actions.append(loadBtn, cloneBtn, renameBtn, deleteBtn);
            item.append(title, editInput, actions);
            listContainer.appendChild(item);

            // 添加事件
            title.addEventListener('click', () => {
                if (isEditMode) {
                    item.classList.toggle('editing');
                    currentEditingWorkflow = item.classList.contains('editing') ? item : null;
                    if (currentEditingWorkflow) { editInput.focus(); editInput.select(); }
                } else {
                    loadWorkflow(name, workflowData, item);
                }
            });

            editInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') saveEditedWorkflow();
                else if (e.key === 'Escape') {
                    item.classList.remove('editing');
                    currentEditingWorkflow = null;
                }
            });
        }
    }

    async function cloneWorkflow(name, workflowData) {
        const workflows = await GM_getValue(STORAGE_KEY_WORKFLOWS, {});
        let cloneName = `${name} - 副本`;
        let counter = 2;
        while (workflows[cloneName]) {
            cloneName = `${name} - 副本 ${counter++}`;
        }
        workflows[cloneName] = workflowData;
        await GM_setValue(STORAGE_KEY_WORKFLOWS, workflows);
        showToast('success', `工作流已克隆为 "${cloneName}"`);
        updateWorkflowList();
    }

    async function renameWorkflow(oldName) {
        const newName = prompt(`请输入"${oldName}"的新名称:`, oldName);
        if (!newName || !newName.trim() || newName === oldName) return;

        const trimmedNewName = newName.trim();
        const workflows = await GM_getValue(STORAGE_KEY_WORKFLOWS, {});
        if (workflows[trimmedNewName] && !confirm(`工作流"${trimmedNewName}"已存在，是否覆盖？`)) return;

        workflows[trimmedNewName] = workflows[oldName];
        delete workflows[oldName];
        await GM_setValue(STORAGE_KEY_WORKFLOWS, workflows);
        showToast('success', `工作流已重命名为 "${trimmedNewName}"`);
        updateWorkflowList();
    }

    async function deleteWorkflow(name) {
        if (confirm(`确定要删除工作流 "${name}" 吗？此操作不可撤销。`)) {
            const workflows = await GM_getValue(STORAGE_KEY_WORKFLOWS, {});
            delete workflows[name];
            await GM_setValue(STORAGE_KEY_WORKFLOWS, workflows);
            showToast('success', `工作流 "${name}" 已删除`);
            updateWorkflowList();
        }
    }


    /**
     * 加载工作流
     */
    async function loadWorkflow(name, workflowData, workflowItem) {
        document.getElementById('comfyui-workflow').value = workflowData;
        await GM_setValue('comfyui_workflow', workflowData);

        document.querySelectorAll('.workflow-item.active').forEach(item => item.classList.remove('active'));
        workflowItem.classList.add('active');

        showToast('success', `已加载工作流 "${name}"`);
    }

    async function exportAllWorkflows() {
        const workflows = await GM_getValue(STORAGE_KEY_WORKFLOWS, {});
        if (Object.keys(workflows).length === 0) {
            return showToast('warning', '没有工作流可导出');
        }
        const exportData = JSON.stringify(workflows, null, 2);
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = BlobURLTracker.create(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comfyui_workflows_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        BlobURLTracker.revoke(url);
        showToast('success', '已导出工作流');
    }

    async function importAllWorkflows() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    if (typeof importedData !== 'object' || importedData === null) {
                        throw new Error('无效的文件格式');
                    }
                    const looksLikeSingleWorkflow = Object.values(importedData).some(value => value?.class_type);
                    if (looksLikeSingleWorkflow) {
                        const workflowText = JSON.stringify(importedData, null, 2);
                        const validation = validateComfyWorkflow(workflowText);
                        showWorkflowValidationResult(validation);
                        if (!validation.ok) return;
                        document.getElementById('comfyui-workflow').value = workflowText;
                        await GM_setValue('comfyui_workflow', workflowText);
                        showToast('success', '工作流已导入到当前编辑区');
                        return;
                    }
                    const workflowEntries = Object.entries(importedData).filter(([, value]) => typeof value === 'string');
                    for (const [name, workflowText] of workflowEntries) {
                        const validation = validateComfyWorkflow(workflowText);
                        if (!validation.ok) {
                            throw new Error(`工作流 "${name}" 校验失败: ${validation.errors.join('；')}`);
                        }
                    }
                    const existingWorkflows = await GM_getValue(STORAGE_KEY_WORKFLOWS, {});
                    const newWorkflows = { ...existingWorkflows, ...importedData };
                    await GM_setValue(STORAGE_KEY_WORKFLOWS, newWorkflows);
                    updateWorkflowList();
                    showToast('success', '工作流导入成功');
                } catch (error) {
                    showToast('error', `导入失败: ${error.message}`);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }


    /**
    * 显示保存工作流模态框
    * @param {string} defaultName - 默认工作流名称
    */
    // [Phase 6.4] Use AbortController for clean event listener management
    function showWorkflowSaveModal(defaultName = '') {
        const modal = document.getElementById('workflow-save-modal');
        const nameInput = document.getElementById('workflow-name-input');
        const warning = document.getElementById('overwrite-warning');
        const confirmBtn = document.getElementById('workflow-save-confirm');
        const cancelBtn = document.getElementById('workflow-save-cancel');

        // Abort previous listeners if modal was opened before
        if (modal._abortController) modal._abortController.abort();
        modal._abortController = new AbortController();
        const { signal } = modal._abortController;

        confirmBtn.addEventListener('click', async () => {
            const workflowName = nameInput.value.trim();
            if (!workflowName) return showToast('error', '请输入工作流名称');
            const workflowText = document.getElementById('comfyui-workflow').value;
            if (!workflowText.trim()) return showToast('error', '工作流内容不能为空');
            const validation = validateComfyWorkflow(workflowText);
            showWorkflowValidationResult(validation);
            if (!validation.ok) return;

            const workflows = await GM_getValue(STORAGE_KEY_WORKFLOWS, {});
            workflows[workflowName] = workflowText;
            await GM_setValue(STORAGE_KEY_WORKFLOWS, workflows);

            modal.style.display = 'none';
            showToast('success', `工作流 "${workflowName}" 已保存`);
            updateWorkflowList();
        }, { signal });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        }, { signal });

        nameInput.addEventListener('input', async () => {
            const presets = await GM_getValue(STORAGE_KEY_WORKFLOWS, {});
            warning.style.display = (nameInput.value.trim() && presets[nameInput.value.trim()]) ? 'block' : 'none';
        }, { signal });

        nameInput.value = defaultName;
        nameInput.dispatchEvent(new Event('input')); // Trigger check
        modal.style.display = 'block';
        setTimeout(() => nameInput.focus(), 100);
    }

    // [Phase 5.2] Generic fetch+populate helper
    async function fetchAndPopulateSelect({ selectElement, fetchItems, savedValueKey, loadingText, emptyText, successMsg, silent, defaultFirst }) {
        selectElement.innerHTML = `<option>${loadingText}</option>`;
        selectElement.disabled = true;
        try {
            const items = await fetchItems();
            if (!items || items.length === 0) {
                selectElement.innerHTML = `<option value="">${emptyText}</option>`;
                if (!silent) showToast('info', emptyText);
                return;
            }
            selectElement.innerHTML = defaultFirst ? `<option value="">${defaultFirst}</option>` : '';
            items.forEach(item => {
                const option = document.createElement('option');
                option.value = typeof item === 'string' ? item : (item.value || item.name || item.model_name || item.title);
                option.textContent = typeof item === 'string' ? item : (item.label || item.alias || item.name || item.model_name || item.title);
                selectElement.appendChild(option);
            });
            const saved = await GM_getValue(savedValueKey);
            if (saved) selectElement.value = saved;
            if (!silent) showToast('success', successMsg);
        } catch (e) {
            selectElement.innerHTML = '<option>加载失败</option>';
            console.warn(`[AI Gen] ${successMsg}失败:`, e.message);
            if (!silent) showToast('error', `加载失败: ${e.message}`);
        } finally {
            selectElement.disabled = false;
        }
    }

    async function fetchAndPopulateModels(url, selectElement, silent = false) {
        await fetchAndPopulateSelect({
            selectElement,
            fetchItems: async () => {
                const data = await getCachedObjectInfo(url);
                const models = data?.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0];
                if (!models || models.length === 0) throw new Error("未找到模型");
                return models;
            },
            savedValueKey: 'comfyui_model',
            loadingText: '正在加载模型...',
            emptyText: '未找到模型',
            successMsg: 'ComfyUI Checkpoint模型列表加载成功',
            silent
        });
    }

    async function fetchAndPopulateUNetModels(url, selectElement, silent = false) {
        await fetchAndPopulateSelect({
            selectElement,
            fetchItems: async () => {
                const data = await getCachedObjectInfo(url);
                const possibleNodeTypes = ['UNETLoader', 'UnetLoader', 'DiffusionModelLoader', 'UNetLoader'];
                for (const nodeType of possibleNodeTypes) {
                    if (data[nodeType]?.input?.required?.unet_name?.[0]) {
                        return data[nodeType].input.required.unet_name[0];
                    }
                }
                return null;
            },
            savedValueKey: 'comfyui_unet_model',
            loadingText: '正在加载UNet模型...',
            emptyText: '无UNet模型可用',
            successMsg: 'ComfyUI UNet模型列表加载成功',
            silent,
            defaultFirst: '选择UNet模型...'
        });
    }

    async function fetchAndPopulateWebUIModels(url, selectElement, silent = false) {
        selectElement.innerHTML = '<option>正在加载模型...</option>';
        selectElement.disabled = true;

        try {
            const response = await makeRequest({ method: 'GET', url: `${url}/sdapi/v1/sd-models` });
            const models = JSON.parse(response.responseText);
            if (!models || models.length === 0) throw new Error("未找到模型");

            selectElement.innerHTML = '';
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.model_name || model.title;
                option.textContent = model.model_name || model.title;
                selectElement.appendChild(option);
            });

            const savedModel = await GM_getValue('webui_model');
            if (savedModel) {
                selectElement.value = savedModel;
            } else if (models.length > 0) {
                selectElement.value = models[0].model_name || models[0].title;
                await GM_setValue('webui_model', selectElement.value);
            }
            selectElement.dispatchEvent(new Event('change'));

            if (!silent) {
                showToast('success', 'WebUI模型列表加载成功');
            }
        } catch (e) {
            selectElement.innerHTML = `<option>加载失败</option>`;
            console.warn('[AI Gen] 加载WebUI模型失败:', e.message);
            if (!silent) {
                showToast('error', `加载WebUI模型失败: ${e.message}`);
            }
        } finally {
            selectElement.disabled = false;
        }
    }

    async function fetchAndPopulateWebUILoras(url, silent = false) {
        const loraSelect = document.getElementById('webui-lora-select');
        if (!loraSelect) return;
        await fetchAndPopulateSelect({
            selectElement: loraSelect,
            fetchItems: async () => {
                const response = await makeRequest({ method: 'GET', url: `${url}/sdapi/v1/loras` });
                const loras = JSON.parse(response.responseText);
                availableLoras = loras;
                return loras;
            },
            savedValueKey: '_webui_lora_dummy_',
            loadingText: '正在加载LoRA...',
            emptyText: '未找到LoRA模型',
            successMsg: `已加载WebUI LoRA模型`,
            silent,
            defaultFirst: '--- 请选择一个LoRA ---'
        });
    }

    /**
    * 获取并填充WebUI Embedding列表
    * @param {string} url - WebUI服务器URL
    * @returns {Promise<void>}
    */
    async function fetchAndPopulateWebUIEmbeddings(url, silent = false) {
        const embeddingList = document.getElementById('embedding-list');
        embeddingList.innerHTML = '<div style="padding: 20px; text-align: center;">正在加载Embedding...</div>';

        try {
            const response = await makeRequest({ method: 'GET', url: `${url}/sdapi/v1/embeddings` });
            const embeddings = JSON.parse(response.responseText);
            availableEmbeddings = Object.keys(embeddings.loaded || {}).map(name => ({ name }));
            if (!availableEmbeddings || availableEmbeddings.length === 0) {
                embeddingList.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">未找到Embedding模型</div>';
                return;
            }
            renderEmbeddingList();

            if (!silent) {
                showToast('success', `已加载 ${availableEmbeddings.length} 个Embedding模型`);
            }
        } catch (e) {
            embeddingList.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--vp-error-color);">加载失败: ${e.message}</div>`;
            console.warn('[AI Gen] 加载Embedding失败:', e.message);

            if (!silent) {
                showToast('error', `加载Embedding失败: ${e.message}`);
            }
        }
    }

    /**
     * 动态设置 select 选项（不清空时机外的 fallback）
     */
    function setDynamicSelectOptions(selectElement, rawOptions, preferredValue = '') {
        if (!selectElement || !Array.isArray(rawOptions)) return false;

        const options = [...new Set(
            rawOptions
                .map(item => typeof item === 'string' ? item : (item?.name || item?.label || ''))
                .map(s => String(s || '').trim())
                .filter(Boolean)
        )];

        if (options.length === 0) return false;

        const currentValue = selectElement.value;
        selectElement.innerHTML = '';

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            selectElement.appendChild(option);
        });

        const finalValue = preferredValue || currentValue;
        if (finalValue && options.includes(finalValue)) {
            selectElement.value = finalValue;
        } else {
            selectElement.value = options[0];
        }

        return true;
    }

    /**
     * 从 ComfyUI object_info 中提取枚举选项
     */
    function findComfyOptionList(objectInfo, nodeTypeCandidates, fieldCandidates) {
        if (!objectInfo) return [];

        for (const nodeType of nodeTypeCandidates) {
            const node = objectInfo[nodeType];
            if (!node?.input?.required) continue;

            const required = node.input.required;
            for (const field of fieldCandidates) {
                const fieldDef = required[field];
                if (Array.isArray(fieldDef) && Array.isArray(fieldDef[0]) && fieldDef[0].length > 0) {
                    return fieldDef[0];
                }
            }
        }

        return [];
    }

    /**
     * 动态读取 ComfyUI 采样器/调度器
     */
    async function fetchAndPopulateComfyUISamplingOptions(url, silent = false) {
        const samplerSelect = document.getElementById('comfyui-sampler');
        const schedulerSelect = document.getElementById('comfyui-scheduler');
        if (!samplerSelect || !schedulerSelect) return;

        try {
            const objectInfo = await getCachedObjectInfo(url);

            const samplerList = findComfyOptionList(
                objectInfo,
                ['KSampler', 'KSamplerAdvanced', 'SamplerCustom', 'KSamplerSelect'],
                ['sampler_name', 'sampler']
            );

            const schedulerList = findComfyOptionList(
                objectInfo,
                ['KSampler', 'KSamplerAdvanced', 'SamplerCustom', 'KSamplerSelect'],
                ['scheduler']
            );

            const savedSampler = await GM_getValue('comfyui_sampler', DEFAULT_SETTINGS.sampler);
            const savedScheduler = await GM_getValue('comfyui_scheduler', DEFAULT_SETTINGS.scheduler);

            const samplerUpdated = setDynamicSelectOptions(samplerSelect, samplerList, savedSampler);
            const schedulerUpdated = setDynamicSelectOptions(schedulerSelect, schedulerList, savedScheduler);

            if (!silent) {
                if (samplerUpdated || schedulerUpdated) {
                    showToast('success', 'ComfyUI 采样器/调度器已动态更新');
                } else {
                    showToast('warning', '未从 ComfyUI 读取到采样器/调度器，已保留本地选项');
                }
            }
        } catch (e) {
            console.warn('[AI Gen] 动态加载 ComfyUI 采样参数失败:', e.message);
            if (!silent) {
                showToast('warning', `ComfyUI采样参数动态加载失败，已保留本地选项: ${e.message}`);
            }
        }
    }

    /**
     * 动态读取 WebUI 采样器/调度器/高清修复算法
     */
    async function fetchAndPopulateWebUISamplingOptions(url, silent = false) {
        const samplerSelect = document.getElementById('webui-sampler');
        const schedulerSelect = document.getElementById('webui-scheduler');
        const upscalerSelect = document.getElementById('webui-hires-upscaler');

        if (!samplerSelect || !schedulerSelect || !upscalerSelect) return;

        let updatedAny = false;

        // 1) samplers
        try {
            const resp = await makeRequestWithRetry({
                method: 'GET',
                url: `${url}/sdapi/v1/samplers`
            }, 2);

            const data = JSON.parse(resp.responseText);
            const samplerList = Array.isArray(data) ? data : [];
            const savedSampler = await GM_getValue('webui_sampler', DEFAULT_SETTINGS.webuiSampler);

            if (setDynamicSelectOptions(samplerSelect, samplerList, savedSampler)) {
                updatedAny = true;
            }
        } catch (e) {
            console.warn('[AI Gen] 动态加载 WebUI 采样器失败:', e.message);
        }

        // 2) schedulers（有些版本没有该端点）
        try {
            const resp = await makeRequestWithRetry({
                method: 'GET',
                url: `${url}/sdapi/v1/schedulers`
            }, 2);

            const parsed = JSON.parse(resp.responseText);
            const schedulerList = Array.isArray(parsed)
                ? parsed
                : (Array.isArray(parsed?.schedulers) ? parsed.schedulers : []);

            const savedScheduler = await GM_getValue('webui_scheduler', DEFAULT_SETTINGS.webuiScheduler);

            if (setDynamicSelectOptions(schedulerSelect, schedulerList, savedScheduler)) {
                updatedAny = true;
            }
        } catch (e) {
            // 旧版可能没有 /schedulers，不报错中断
            console.warn('[AI Gen] 动态加载 WebUI 调度器失败或端点不存在:', e.message);
        }

        // 3) hires upscalers（合并普通 upscaler + latent upscale modes）
        try {
            const [upscalersResp, latentResp] = await Promise.allSettled([
                makeRequestWithRetry({ method: 'GET', url: `${url}/sdapi/v1/upscalers` }, 2),
                makeRequestWithRetry({ method: 'GET', url: `${url}/sdapi/v1/latent-upscale-modes` }, 2)
            ]);

            let upscalerList = [];

            if (upscalersResp.status === 'fulfilled') {
                const parsed = JSON.parse(upscalersResp.value.responseText);
                if (Array.isArray(parsed)) upscalerList.push(...parsed);
            }

            if (latentResp.status === 'fulfilled') {
                const parsed = JSON.parse(latentResp.value.responseText);
                if (Array.isArray(parsed)) upscalerList.push(...parsed);
            }

            const savedUpscaler = await GM_getValue('webui_hires_upscaler', DEFAULT_SETTINGS.hiresUpscaler);

            if (setDynamicSelectOptions(upscalerSelect, upscalerList, savedUpscaler)) {
                updatedAny = true;
            }
        } catch (e) {
            console.warn('[AI Gen] 动态加载 WebUI 高清修复算法失败:', e.message);
        }

        if (!silent) {
            if (updatedAny) {
                showToast('success', 'WebUI 采样参数已动态更新');
            } else {
                showToast('warning', '未读取到 WebUI 动态采样参数，已保留本地选项');
            }
        }
    }

    /**
    * 渲染Embedding列表
    */
    function renderEmbeddingList() {
        const embeddingList = document.getElementById('embedding-list');
        const selectedEmbeddings = getCurrentSelectedEmbeddings();
        embeddingList.innerHTML = '';

        // [安全修复] 使用DOM API 代替 innerHTML
        availableEmbeddings.forEach(embedding => {
            const isSelected = selectedEmbeddings.some(selected => selected.name === embedding.name);
            const selectedData = selectedEmbeddings.find(selected => selected.name === embedding.name) || { weight: 1.0, type: 'positive' };

            const item = document.createElement('div');
            item.className = 'embedding-item';

            const info = document.createElement('div');
            info.className = 'embedding-info';
            const nameDiv = document.createElement('div');
            nameDiv.className = 'embedding-name';
            nameDiv.textContent = embedding.name;
            info.appendChild(nameDiv);

            const controls = document.createElement('div');
            controls.className = 'embedding-controls';

            const weightInput = document.createElement('input');
            weightInput.type = 'number';
            weightInput.className = 'embedding-weight';
            weightInput.min = "0"; weightInput.max = "2"; weightInput.step = "0.1";
            weightInput.value = selectedData.weight;
            weightInput.disabled = !isSelected;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'embedding-checkbox';
            checkbox.checked = isSelected;

            controls.append(weightInput, checkbox);
            item.append(info, controls);
            embeddingList.appendChild(item);

            checkbox.addEventListener('change', () => {
                weightInput.disabled = !checkbox.checked;
                if (checkbox.checked) {
                    addSelectedEmbedding(embedding.name, parseFloat(weightInput.value));
                } else {
                    removeSelectedEmbedding(embedding.name);
                }
                updateSelectedEmbeddingsDisplay();
            });

            weightInput.addEventListener('input', () => {
                if (checkbox.checked) {
                    updateSelectedEmbeddingWeight(embedding.name, parseFloat(weightInput.value));
                    updateSelectedEmbeddingsDisplay();
                }
            });
        });
    }

    // [Phase 5.1] createSelectionManager factory - replaces duplicate LoRA/Embedding functions
    function createSelectionManager({ storageKey, tagClass, emptyText }) {
        const readItems = () => {
            const parsed = safeJsonParse(localStorage.getItem(storageKey) || '[]', [], storageKey);
            return Array.isArray(parsed) ? parsed : [];
        };

        return {
            getAll() { return readItems(); },
            add(name, weight, extra = {}) {
                const items = this.getAll();
                if (!items.some(i => i.name === name)) {
                    items.push({ name, weight, ...extra });
                    localStorage.setItem(storageKey, JSON.stringify(items));
                }
            },
            remove(name) {
                const items = this.getAll().filter(i => i.name !== name);
                localStorage.setItem(storageKey, JSON.stringify(items));
            },
            updateWeight(name, weight) {
                const items = this.getAll();
                const item = items.find(i => i.name === name);
                if (item) { item.weight = weight; localStorage.setItem(storageKey, JSON.stringify(items)); }
            },
            renderSelected(containerId, onRemove) {
                const container = document.getElementById(containerId);
                const items = this.getAll();
                container.innerHTML = '';
                if (items.length === 0) {
                    container.innerHTML = `<div style="color: #888; font-style: italic;">${emptyText}</div>`;
                    return;
                }
                items.forEach(item => {
                    const tag = document.createElement('span');
                    tag.className = tagClass;
                    tag.textContent = `${item.name} (${item.weight})`;
                    const removeBtn = document.createElement('span');
                    removeBtn.className = 'remove';
                    removeBtn.textContent = '\u00d7';
                    removeBtn.onclick = () => onRemove(item.name);
                    tag.appendChild(removeBtn);
                    container.appendChild(tag);
                });
            }
        };
    }

    function getComfyUILoraFolder(name) {
        const normalized = String(name || '').replace(/\\/g, '/');
        const parts = normalized.split('/').filter(Boolean);
        return parts.length > 1 ? parts[0] : '根目录';
    }

    function normalizeComfyUILoraItem(item) {
        if (!item || typeof item !== 'object') return null;
        const name = String(item.name || '').trim();
        if (!name) return null;

        const fallbackWeight = normalizeNumber(item.weight, 1);
        return {
            name,
            modelWeight: normalizeNumber(item.modelWeight, fallbackWeight),
            clipWeight: normalizeNumber(item.clipWeight, fallbackWeight),
            enabled: item.enabled !== false,
        };
    }

    function normalizeComfyUILoraItems(items) {
        if (!Array.isArray(items)) return [];
        const seen = new Set();
        const normalized = [];

        items.forEach(item => {
            const lora = normalizeComfyUILoraItem(item);
            if (!lora || seen.has(lora.name)) return;
            seen.add(lora.name);
            normalized.push(lora);
        });

        return normalized;
    }

    function findComfyUILoraLoader(objectInfo) {
        const loraNodeTypes = ['LoraLoader', 'LoRALoader', 'Lora Loader', 'LoRA_Loader_Z'];

        for (const nodeType of loraNodeTypes) {
            const nodeInfo = objectInfo?.[nodeType];
            const required = nodeInfo?.input?.required || {};
            const output = nodeInfo?.output || [];
            if (
                required.lora_name?.[0] &&
                required.model &&
                required.clip &&
                output.includes('MODEL') &&
                output.includes('CLIP')
            ) {
                return { type: nodeType, nodeInfo };
            }
        }

        return null;
    }

    function persistComfyUISelectedLoras(items) {
        const normalized = normalizeComfyUILoraItems(items);
        localStorage.setItem('comfyui_selected_loras', JSON.stringify(normalized));
        GM_setValue('comfyui_selected_loras', normalized).catch(error => {
            console.warn('[AI Gen] 保存ComfyUI LoRA选择到GM存储失败:', error);
        });
    }

    async function syncComfyUILoraSelectionStorage() {
        const localItems = normalizeComfyUILoraItems(
            safeJsonParse(localStorage.getItem('comfyui_selected_loras') || '[]', [], 'comfyui_selected_loras')
        );
        const storedItems = normalizeComfyUILoraItems(await GM_getValue('comfyui_selected_loras', []));
        const sourceItems = localItems.length > 0 ? localItems : storedItems;

        if (sourceItems.length > 0) {
            persistComfyUISelectedLoras(sourceItems);
        }
    }

    const embeddingManager = createSelectionManager({
        storageKey: 'selected_embeddings',
        tagClass: 'selected-embedding-tag',
        emptyText: '暂未选择Embedding'
    });

    // Backward-compatible wrappers
    function getCurrentSelectedEmbeddings() { return embeddingManager.getAll(); }
    function addSelectedEmbedding(name, weight, type = 'positive') { embeddingManager.add(name, weight, { type }); }
    function removeSelectedEmbedding(name) { embeddingManager.remove(name); }
    function updateSelectedEmbeddingWeight(name, weight) { embeddingManager.updateWeight(name, weight); }

    function updateSelectedEmbeddingsDisplay() {
        embeddingManager.renderSelected('selected-embeddings-container', (name) => {
            removeSelectedEmbedding(name);
            renderEmbeddingList();
            updateSelectedEmbeddingsDisplay();
        });
    }

    function generateEmbeddingPromptString(isPositive = true) {
        const type = isPositive ? 'positive' : 'negative';
        return getCurrentSelectedEmbeddings()
            .filter(emb => (emb.type || 'positive') === type)
            .map(emb => emb.weight === 1.0 ? emb.name : `(${emb.name}:${emb.weight})`)
            .join(', ');
    }

    /**
    * 获取并填充ComfyUI LoRA列表
    * @param {string} url - ComfyUI服务器URL
    * @returns {Promise<void>}
    */
    async function fetchAndPopulateComfyUILoras(url, silent = false) {
        const loraListContainer = document.getElementById('comfyui-lora-list');
        loraListContainer.innerHTML = '<div style="padding: 20px; text-align: center;">正在加载ComfyUI LoRA...</div>';

        try {
            const data = await getCachedObjectInfo(url);
            const loraLoader = findComfyUILoraLoader(data);
            const loras = loraLoader?.nodeInfo?.input?.required?.lora_name?.[0];

            if (!loras || loras.length === 0) {
                loraListContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">未找到LoRA模型</div>';
                return;
            }

            availableComfyUILoras = loras
                .map(name => ({ name }))
                .sort((a, b) => {
                    const folderCompare = getComfyUILoraFolder(a.name).localeCompare(getComfyUILoraFolder(b.name));
                    return folderCompare || a.name.localeCompare(b.name);
                });
            renderComfyUILoraList();

            if (!silent) {
                showToast('success', `已加载 ${loras.length} 个ComfyUI LoRA模型`);
            }
        } catch (e) {
            loraListContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--vp-error-color);">加载失败: ${e.message}</div>`;
            console.warn('[AI Gen] 加载ComfyUI LoRA列表失败:', e.message);

            if (!silent) {
                showToast('error', `加载ComfyUI LoRA列表失败: ${e.message}`);
            }
        }
    }

    /**
    * 渲染ComfyUI LoRA列表
    */
    function renderComfyUILoraList() {
        const loraListContainer = document.getElementById('comfyui-lora-list');
        const selectedLoras = getCurrentComfyUISelectedLoras();
        const selectedByName = new Map(selectedLoras.map(lora => [lora.name, lora]));
        const searchTerm = (document.getElementById('comfyui-lora-search')?.value || '').trim().toLowerCase();
        const folderFilter = document.getElementById('comfyui-lora-folder-filter')?.value || '';
        loraListContainer.innerHTML = '';

        renderComfyUILoraFolderOptions(folderFilter);

        const filteredLoras = availableComfyUILoras.filter(lora => {
            const folder = getComfyUILoraFolder(lora.name);
            const matchesFolder = !folderFilter || folder === folderFilter;
            const matchesSearch = !searchTerm || lora.name.toLowerCase().includes(searchTerm);
            return matchesFolder && matchesSearch;
        });

        if (filteredLoras.length === 0) {
            loraListContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">没有匹配的LoRA</div>';
            return;
        }

        let currentFolder = null;
        filteredLoras.forEach(lora => {
            const folder = getComfyUILoraFolder(lora.name);
            if (folder !== currentFolder) {
                currentFolder = folder;
                const header = document.createElement('div');
                header.className = 'lora-group-header';
                header.textContent = folder;
                loraListContainer.appendChild(header);
            }

            const isSelected = selectedByName.has(lora.name);
            const selectedData = selectedByName.get(lora.name) || {
                modelWeight: 1.0,
                clipWeight: 1.0,
                enabled: true,
            };
            const loraItem = document.createElement('div');
            loraItem.className = 'lora-item';

            const infoDiv = document.createElement('div');
            infoDiv.className = 'lora-info';
            const nameDiv = document.createElement('div');
            nameDiv.className = 'lora-name';
            nameDiv.textContent = lora.name;
            const aliasDiv = document.createElement('div');
            aliasDiv.className = 'lora-alias';
            aliasDiv.textContent = folder;
            infoDiv.append(nameDiv, aliasDiv);

            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'lora-controls';

            const modelWeightInput = document.createElement('input');
            modelWeightInput.type = 'number';
            modelWeightInput.className = 'lora-weight';
            modelWeightInput.min = "0"; modelWeightInput.max = "2"; modelWeightInput.step = "0.05";
            modelWeightInput.value = selectedData.modelWeight;
            modelWeightInput.title = '模型强度';
            modelWeightInput.disabled = !isSelected;

            const clipWeightInput = document.createElement('input');
            clipWeightInput.type = 'number';
            clipWeightInput.className = 'lora-weight';
            clipWeightInput.min = "0"; clipWeightInput.max = "2"; clipWeightInput.step = "0.05";
            clipWeightInput.value = selectedData.clipWeight;
            clipWeightInput.title = 'CLIP强度';
            clipWeightInput.disabled = !isSelected;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'lora-checkbox';
            checkbox.checked = isSelected;
            checkbox.title = '加入已选LoRA';

            controlsDiv.append(modelWeightInput, clipWeightInput, checkbox);
            loraItem.append(infoDiv, controlsDiv);

            checkbox.addEventListener('change', () => {
                modelWeightInput.disabled = !checkbox.checked;
                clipWeightInput.disabled = !checkbox.checked;
                if (checkbox.checked) {
                    addComfyUISelectedLora(
                        lora.name,
                        normalizeNumber(modelWeightInput.value, 1),
                        normalizeNumber(clipWeightInput.value, normalizeNumber(modelWeightInput.value, 1))
                    );
                }
                else removeComfyUISelectedLora(lora.name);
                updateComfyUISelectedLorasDisplay();
            });

            const updateWeights = () => {
                if (checkbox.checked) {
                    updateComfyUISelectedLoraWeight(
                        lora.name,
                        normalizeNumber(modelWeightInput.value, 1),
                        normalizeNumber(clipWeightInput.value, normalizeNumber(modelWeightInput.value, 1))
                    );
                    updateComfyUISelectedLorasDisplay();
                }
            };
            modelWeightInput.addEventListener('input', updateWeights);
            clipWeightInput.addEventListener('input', updateWeights);
            loraListContainer.appendChild(loraItem);
        });
    }

    function renderComfyUILoraFolderOptions(selectedFolder = '') {
        const folderSelect = document.getElementById('comfyui-lora-folder-filter');
        if (!folderSelect) return;

        const folders = [...new Set(availableComfyUILoras.map(lora => getComfyUILoraFolder(lora.name)))].sort();
        const currentValue = folders.includes(selectedFolder) ? selectedFolder : '';
        folderSelect.innerHTML = '<option value="">全部目录</option>';

        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder;
            option.textContent = folder;
            folderSelect.appendChild(option);
        });
        folderSelect.value = currentValue;
    }

    const comfyUILoraManager = {
        getAll() {
            const parsed = safeJsonParse(localStorage.getItem('comfyui_selected_loras') || '[]', [], 'comfyui_selected_loras');
            const normalized = normalizeComfyUILoraItems(parsed);
            if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
                persistComfyUISelectedLoras(normalized);
            }
            return normalized;
        },
        setAll(items) {
            persistComfyUISelectedLoras(items);
        },
        add(name, modelWeight, clipWeight = modelWeight) {
            const items = this.getAll();
            if (!items.some(i => i.name === name)) {
                items.push({
                    name,
                    modelWeight: normalizeNumber(modelWeight, 1),
                    clipWeight: normalizeNumber(clipWeight, normalizeNumber(modelWeight, 1)),
                    enabled: true,
                });
                this.setAll(items);
            }
        },
        remove(name) {
            this.setAll(this.getAll().filter(i => i.name !== name));
        },
        update(name, patch) {
            const items = this.getAll();
            const item = items.find(i => i.name === name);
            if (item) {
                Object.assign(item, patch);
                this.setAll(items);
            }
        },
        clear() {
            this.setAll([]);
        },
    };

    // Backward-compatible wrappers
    function getCurrentComfyUISelectedLoras() { return comfyUILoraManager.getAll(); }
    function getEnabledComfyUISelectedLoras() { return getCurrentComfyUISelectedLoras().filter(lora => lora.enabled !== false); }
    function addComfyUISelectedLora(name, modelWeight, clipWeight = modelWeight) { comfyUILoraManager.add(name, modelWeight, clipWeight); }
    function removeComfyUISelectedLora(name) { comfyUILoraManager.remove(name); }
    function updateComfyUISelectedLoraWeight(name, modelWeight, clipWeight = modelWeight) {
        comfyUILoraManager.update(name, {
            modelWeight: normalizeNumber(modelWeight, 1),
            clipWeight: normalizeNumber(clipWeight, normalizeNumber(modelWeight, 1)),
        });
    }
    function setComfyUISelectedLoraEnabled(name, enabled) { comfyUILoraManager.update(name, { enabled }); }
    function updateComfyUISelectedLorasDisplay() {
        const container = document.getElementById('comfyui-selected-loras-container');
        const count = document.getElementById('comfyui-selected-loras-count');
        if (!container) return;

        const items = getCurrentComfyUISelectedLoras();
        const enabledCount = items.filter(lora => lora.enabled !== false).length;
        if (count) count.textContent = `${enabledCount}/${items.length}`;

        container.innerHTML = '';
        if (items.length === 0) {
            container.innerHTML = '<div style="color: #888; font-style: italic;">暂未选择ComfyUI LoRA</div>';
            return;
        }

        items.forEach(item => {
            const row = document.createElement('div');
            row.className = `selected-lora-row${item.enabled === false ? ' disabled' : ''}`;

            const enabled = document.createElement('input');
            enabled.type = 'checkbox';
            enabled.checked = item.enabled !== false;
            enabled.title = '启用/禁用';

            const name = document.createElement('div');
            name.className = 'selected-lora-name';
            name.textContent = item.name;

            const modelWeight = document.createElement('input');
            modelWeight.type = 'number';
            modelWeight.className = 'lora-weight';
            modelWeight.min = '0'; modelWeight.max = '2'; modelWeight.step = '0.05';
            modelWeight.value = item.modelWeight;
            modelWeight.title = '模型强度';

            const clipWeight = document.createElement('input');
            clipWeight.type = 'number';
            clipWeight.className = 'lora-weight';
            clipWeight.min = '0'; clipWeight.max = '2'; clipWeight.step = '0.05';
            clipWeight.value = item.clipWeight;
            clipWeight.title = 'CLIP强度';

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'comfy-button error selected-lora-remove';
            removeBtn.textContent = '删除';

            enabled.addEventListener('change', () => {
                setComfyUISelectedLoraEnabled(item.name, enabled.checked);
                renderComfyUILoraList();
                updateComfyUISelectedLorasDisplay();
            });

            const updateWeights = () => {
                updateComfyUISelectedLoraWeight(
                    item.name,
                    normalizeNumber(modelWeight.value, 1),
                    normalizeNumber(clipWeight.value, normalizeNumber(modelWeight.value, 1))
                );
                renderComfyUILoraList();
            };
            modelWeight.addEventListener('input', updateWeights);
            clipWeight.addEventListener('input', updateWeights);

            removeBtn.addEventListener('click', () => {
                removeComfyUISelectedLora(item.name);
                renderComfyUILoraList();
                updateComfyUISelectedLorasDisplay();
            });

            row.append(enabled, name, modelWeight, clipWeight, removeBtn);
            container.appendChild(row);
        });
    }

    /**
     * 加载设置到UI
     * @param {Object} inputs - 包含所有输入元素引用的对象
     */
    // -------------------------------------------------------------------------
    // Section 6: Settings, Presets, Workflows, and Remote Data
    // -------------------------------------------------------------------------
    async function loadSettings(inputs) {
        const settingsToLoad = {
            url: ['comfyui_url', DEFAULT_SETTINGS.url],
            webuiUrl: ['webui_url', DEFAULT_SETTINGS.webuiUrl],
            workflow: ['comfyui_workflow', DEFAULT_SETTINGS.workflow],
            startTag: ['comfyui_start_tag', DEFAULT_SETTINGS.startTag],
            endTag: ['comfyui_end_tag', DEFAULT_SETTINGS.endTag],
            genWidth: ['comfyui_gen_width', DEFAULT_SETTINGS.genWidth],
            genHeight: ['comfyui_gen_height', DEFAULT_SETTINGS.genHeight],
            displayWidth: ['comfyui_display_width', DEFAULT_SETTINGS.displayWidth],
            displayHeight: ['comfyui_display_height', DEFAULT_SETTINGS.displayHeight],
            autoGen: ['comfyui_auto_generate', DEFAULT_SETTINGS.autoGenerate],
            sampler: ['comfyui_sampler', DEFAULT_SETTINGS.sampler],
            scheduler: ['comfyui_scheduler', DEFAULT_SETTINGS.scheduler],
            steps: ['comfyui_steps', DEFAULT_SETTINGS.steps],
            cfg: ['comfyui_cfg', DEFAULT_SETTINGS.cfg],
            webuiSampler: ['webui_sampler', DEFAULT_SETTINGS.webuiSampler],
            webuiScheduler: ['webui_scheduler', DEFAULT_SETTINGS.webuiScheduler],
            webuiSteps: ['webui_steps', DEFAULT_SETTINGS.steps],
            webuiCfg: ['webui_cfg', DEFAULT_SETTINGS.cfg],
            webuiDenoising: ['webui_denoising', DEFAULT_SETTINGS.denoisingStrength],
            webuiEnableHires: ['webui_enable_hires', DEFAULT_SETTINGS.enableHires],
            webuiHiresUpscaler: ['webui_hires_upscaler', DEFAULT_SETTINGS.hiresUpscaler],
            webuiHiresSteps: ['webui_hires_steps', DEFAULT_SETTINGS.hiresSteps],
            webuiHiresUpscale: ['webui_hires_upscale', DEFAULT_SETTINGS.hiresUpscale],
            webuiHiresDenoising: ['webui_hires_denoising', DEFAULT_SETTINGS.hiresDenoising],
            comfyuiSeed: ['comfyui_seed', DEFAULT_SETTINGS.seed],
            webuiSeed: ['webui_seed', DEFAULT_SETTINGS.seed],
            comfyuiImg2ImgEnable: ['comfyui_img2img_enable', DEFAULT_SETTINGS.img2imgEnable],
            webuiImg2ImgEnable: ['webui_img2img_enable', DEFAULT_SETTINGS.img2imgEnable],
            comfyuiImg2ImgDenoising: ['comfyui_img2img_denoising', DEFAULT_SETTINGS.img2imgDenoising],
            webuiImg2ImgDenoising: ['webui_img2img_denoising', DEFAULT_SETTINGS.img2imgDenoising],
            positivePrompt: ['comfyui_positive_prompt', DEFAULT_SETTINGS.positivePrompt],
            negativePrompt: ['comfyui_negative_prompt', DEFAULT_SETTINGS.negativePrompt],
            enableComparison: ['comfyui_enable_comparison', DEFAULT_SETTINGS.enableComparison],
            hideButtons: ['comfyui_hide_buttons', DEFAULT_SETTINGS.hideButtons],
        };

        const settingsEntries = Object.entries(settingsToLoad);
        const storedValues = await getStoredValues(
            settingsEntries.map(([, [storageKey, defaultValue]]) => [storageKey, defaultValue])
        );

        for (const [inputKey, [storageKey]] of settingsEntries) {
            const value = storedValues[storageKey];
            if (inputs[inputKey]) {
                if (inputs[inputKey].type === 'checkbox') {
                    inputs[inputKey].checked = value;
                } else {
                    inputs[inputKey].value = value;
                }
            }
        }

        document.getElementById('hires-settings').style.display = inputs.webuiEnableHires.checked ? 'grid' : 'none';
        ['comfyui', 'webui'].forEach(prefix => {
            const enabled = document.getElementById(`${prefix}-img2img-enable`)?.checked || false;
            const area = document.getElementById(`${prefix}-img2img-area`);
            const state = getImg2ImgState(prefix);
            state.enabled = enabled;
            if (area) area.style.display = enabled ? 'block' : 'none';
        });

        // Remote model/LoRA/sampler lists are loaded only by explicit user actions.
    }

    /**
    * 保存设置
    * @param {Object} inputs - 包含所有输入元素引用的对象
    */
    async function saveSettings(inputs) {
        const settingsToSave = {};
        for (const key in inputs) {
            const input = inputs[key];
            if (!input) continue;

            let value;
            if (input.type === 'checkbox') {
                value = input.checked;
            } else if (input.type === 'number') {
                value = parseFloat(input.value) || 0;
            } else {
                value = input.value;
            }

            const storageKey = input.id.replace(/-/g, '_');
            settingsToSave[storageKey] = value;
        }

        // Handle specific cases that don't map directly
        if (inputs.modelSelect) settingsToSave.comfyui_model = inputs.modelSelect.value;
        if (inputs.unetSelect) settingsToSave.comfyui_unet_model = inputs.unetSelect.value;
        if (inputs.webuiModelSelect) settingsToSave.webui_model = inputs.webuiModelSelect.value;

        await setStoredValues(Object.entries(settingsToSave));
    }

    async function exportAllSettings() {
        const values = await getStoredValues(EXPORTABLE_STORAGE_KEYS.map(key => [key, undefined]));
        const settings = Object.fromEntries(
            Object.entries(values).filter(([, value]) => value !== undefined)
        );
        settings.comfyui_selected_loras = getCurrentComfyUISelectedLoras();

        downloadJsonFile({
            type: 'ST-ComfyUI-WebUI-Helper settings',
            version: SETTINGS_EXPORT_VERSION,
            exportedAt: new Date().toISOString(),
            settings,
        }, `st_comfyui_webui_helper_settings_${new Date().toISOString().slice(0, 10)}.json`);

        showToast('success', '插件配置已导出');
    }

    async function importAllSettings(inputs) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            try {
                const imported = JSON.parse(await file.text());
                const settings = imported?.settings && typeof imported.settings === 'object'
                    ? imported.settings
                    : imported;

                if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
                    throw new Error('配置文件格式无效');
                }

                const allowedKeys = new Set(EXPORTABLE_STORAGE_KEYS);
                const entries = Object.entries(settings).filter(([key]) => allowedKeys.has(key));
                if (entries.length === 0) {
                    throw new Error('没有可导入的配置项');
                }

                await setStoredValues(entries);
                if (Array.isArray(settings.comfyui_selected_loras)) {
                    comfyUILoraManager.setAll(settings.comfyui_selected_loras);
                }
                await loadCurrentMode();
                await loadSettings(inputs);
                updateWorkflowList();
                renderComfyUILoraList();
                updateComfyUISelectedLorasDisplay();
                updateSelectedEmbeddingsDisplay();

                showToast('success', `插件配置已导入 (${entries.length} 项)`);
            } catch (error) {
                console.error('[AI Gen] 配置导入失败:', error);
                showToast('error', `配置导入失败: ${error.message}`);
            }
        };
        input.click();
    }

    // -------------------------------------------------------------------------
    // Section 7: Cache Storage and Image Rendering
    // -------------------------------------------------------------------------
    async function saveImageToCache(generationId, imageUrl, prompt, metadata = {}) {
        try {
            let blob;

            if (imageUrl.startsWith('data:')) {
                // WebUI 返回的 base64 dataURL
                const res = await fetch(imageUrl);
                blob = await res.blob();
            } else {
                // ComfyUI /view URL，走 Tampermonkey 的 GM_xmlhttpRequest，避开 CORS 问题
                const resp = await makeRequestWithRetry({
                    method: 'GET',
                    url: imageUrl,
                    responseType: 'blob',
                    timeout: 60000,
                }, 3);

                // 在 Tampermonkey 中 responseType = 'blob' 时，resp.response 一般就是 Blob
                blob = resp.response instanceof Blob
                    ? resp.response
                    : new Blob([resp.response]);
            }

            await imageCacheDB.saveImage(generationId, blob, {
                prompt,
                mode: currentMode,
                metadata,
                // 时间戳内部函数也会加，这里只是冗余安全
                timestamp: Date.now(),
            });

            // 自动清理策略：200MB 或 200 张
            const deletedCount = await imageCacheDB.pruneOldImages(200 * 1024 * 1024, 200);
            if (deletedCount > 0) {
                console.log(`[AI Gen] 自动清理旧缓存 ${deletedCount} 张`);
            }

        } catch (error) {
            console.error('[AI Gen] 保存图片失败: ', {
                generationId,
                imageUrl,
                mode: currentMode,
                error,
            });

            if (error?.name === 'QuotaExceededError') {
                showToast('error', '浏览器存储空间不足，无法缓存图片，请在“图片缓存”中清理一些图片');
            } else {
                showToast('error', `图片保存失败: ${error.message || error}`);
            }
            throw error;
        }
    }

    /**
     * 加载图片缓存列表（从IndexedDB）
     */
    async function loadImageCache() {
        const cacheGrid = document.getElementById('cache-grid');
        const cacheStats = document.getElementById('cache-stats');

        // [Phase 2.1] Revoke all tracked blob URLs before reloading
        BlobURLTracker.revokeAll();

        try {
            const images = await imageCacheDB.getAllImages();
            const totalSize = images.reduce((sum, image) => sum + (image.blob?.size || 0), 0);
            const info = {
                count: images.length,
                totalSize,
                sizeMB: (totalSize / 1024 / 1024).toFixed(2)
            };

            cacheStats.textContent = `共 ${info.count} 张缓存图片 (${info.sizeMB} MB)`;
            cacheGrid.innerHTML = '';

            if (info.count === 0) {
                cacheGrid.innerHTML = '<div class="cache-empty">暂无缓存图片</div>';
                return;
            }

            // 按时间倒序排列
            const sortedImages = images.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            sortedImages.forEach((data) => {
                const item = document.createElement('div');
                item.className = 'cache-item';

                const img = document.createElement('img');
                img.className = 'cache-item-image';
                if (data.blob) {
                    const blobUrl = BlobURLTracker.create(data.blob);
                    img.src = blobUrl;
                }
                img.alt = '缓存图片';
                img.dataset.id = data.id;

                const infoDiv = document.createElement('div');
                infoDiv.className = 'cache-item-info';

                const promptDiv = document.createElement('div');
                promptDiv.className = 'cache-item-prompt';
                promptDiv.textContent = data.prompt || '无提示词';
                promptDiv.title = data.prompt || '无提示词';

                const sizeInfo = data.blob ? ` • ${(data.blob.size / 1024 / 1024).toFixed(2)}MB` : '';
                const metaDiv = document.createElement('div');
                metaDiv.className = 'cache-item-meta';
                metaDiv.textContent = `${data.mode || '未知'} • ${new Date(data.timestamp || 0).toLocaleString()}${sizeInfo}`;

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'cache-item-actions';

                const viewBtn = document.createElement('button');
                viewBtn.className = 'comfy-button cache-view-btn';
                viewBtn.textContent = '查看';
                viewBtn.dataset.id = data.id;

                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'comfy-button cache-download-btn';
                downloadBtn.textContent = '下载';
                downloadBtn.dataset.id = data.id;
                downloadBtn.dataset.prompt = data.prompt || 'image';

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'comfy-button error cache-delete-btn';
                deleteBtn.textContent = '删除';
                deleteBtn.dataset.id = data.id;

                actionsDiv.append(viewBtn, downloadBtn, deleteBtn);
                infoDiv.append(promptDiv, metaDiv, actionsDiv);
                item.append(img, infoDiv);
                cacheGrid.appendChild(item);
            });

            attachCacheEventListeners();

        } catch (error) {
            console.error('[AI Gen] 加载缓存列表失败:', error);
            cacheGrid.innerHTML = '<div class="cache-empty" style="color: var(--vp-error-color);">加载失败，请刷新页面</div>';
            showToast('error', '缓存加载失败');
        }
    }

    /**
     * 添加缓存事件监听器（IndexedDB版本）
     */
    function attachCacheEventListeners() {
        const cacheGrid = document.getElementById('cache-grid');
        if (!cacheGrid || cacheGrid.dataset.listenerAttached === 'true') return;

        cacheGrid.dataset.listenerAttached = 'true';
        cacheGrid.addEventListener('click', async (e) => {
            const viewTrigger = e.target.closest('.cache-view-btn, .cache-item-image');
            if (viewTrigger && cacheGrid.contains(viewTrigger)) {
                const id = viewTrigger.dataset.id;
                if (!id) return;

                try {
                    const cached = await imageCacheDB.getImage(id);
                    if (cached?.blob) {
                        showImageModal(BlobURLTracker.create(cached.blob));
                    }
                } catch (error) {
                    showToast('error', '图片加载失败');
                }
                return;
            }

            const downloadTrigger = e.target.closest('.cache-download-btn');
            if (downloadTrigger && cacheGrid.contains(downloadTrigger)) {
                const id = downloadTrigger.dataset.id;
                const prompt = downloadTrigger.dataset.prompt || 'image';

                try {
                    const cached = await imageCacheDB.getImage(id);
                    if (cached?.blob) {
                        const url = BlobURLTracker.create(cached.blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${prompt.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, '_')}_${Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);

                        setTimeout(() => BlobURLTracker.revoke(url), 5000);
                        showToast('success', '下载已开始');
                    }
                } catch (error) {
                    console.error('下载失败:', error);
                    showToast('error', '下载失败');
                }
                return;
            }

            const deleteTrigger = e.target.closest('.cache-delete-btn');
            if (deleteTrigger && cacheGrid.contains(deleteTrigger)) {
                const id = deleteTrigger.dataset.id;
                if (!id || !confirm('确定要删除这张图片吗？')) return;

                try {
                    await imageCacheDB.deleteImage(id);
                    await loadImageCache();
                    showToast('success', '图片已删除');
                } catch (error) {
                    showToast('error', '删除失败');
                }
            }
        });
    }

    /**
     * 显示图片模态框
     */
    function showImageModal(imageUrl) {
        let modal = document.getElementById('cache-image-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'cache-image-modal';
            modal.className = 'cache-image-modal';
            modal.innerHTML = `<span class="cache-modal-close">×</span><img src="" alt="查看图片">`;
            document.body.appendChild(modal);
            modal.querySelector('.cache-modal-close').addEventListener('click', () => modal.style.display = 'none');
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
        }
        modal.querySelector('img').src = imageUrl;
        modal.style.display = 'flex';
    }

    // [Phase 4] downloadImage() removed - dead code

    async function deleteImageFromCache(imageId) {
        try {
            await imageCacheDB.deleteImage(imageId);
        } catch (error) {
            console.error('[AI Gen] 删除缓存失败:', error);
            throw error;
        }
    }

    async function clearAllCache() {
        if (confirm('确定要清空所有缓存图片吗？此操作不可撤销。')) {
            try {
                await imageCacheDB.clearAll();
                await loadImageCache();
                showToast('success', '所有缓存已清空');
            } catch (error) {
                console.error('[AI Gen] 清空缓存失败:', error);
                showToast('error', '清空失败');
            }
        }
    }

    // -------------------------------------------------------------------------
    // Section 8: Message Scanning and Button Lifecycle
    // -------------------------------------------------------------------------

    /**
    * 检查是否处于发送状态
    */
    function checkSendingStatus() {
        const sendButton = document.getElementById('send_but');
        const stopButton = document.getElementById('mes_stop');

        const isElementVisible = (el) => {
            if (!el) return false;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            return el.offsetParent !== null || style.position === 'fixed';
        };

        // 用 computedStyle 判断，不再依赖 style.display 内联值
        const isSendButtonVisible = isElementVisible(sendButton);
        const isSendButtonHidden = !isSendButtonVisible;
        const isStopButtonVisible = isElementVisible(stopButton);

        // ST里最可靠的是 stop 按钮可见 => 正在生成
        const isSending = isStopButtonVisible;

        const lastMessage = document.querySelector('.mes.last_mes');
        const hasStreamingClass = !!(lastMessage && (
            lastMessage.classList.contains('streaming') ||
            lastMessage.classList.contains('generating') ||
            lastMessage.dataset.streaming === 'true'
        ));

        const isStreaming = isSending || hasStreamingClass;

        let confidence = 0;
        if (isStopButtonVisible) confidence += 0.7;
        if (hasStreamingClass) confidence += 0.3;
        if (isStopButtonVisible && isSendButtonHidden) confidence += 0.1;

        return {
            isSending,
            isStreaming,
            confidence: Math.min(confidence, 1.0),
            details: {
                sendButtonVisible: isSendButtonVisible,
                sendButtonHidden: isSendButtonHidden,
                stopButtonVisible: isStopButtonVisible,
                hasStreamingClass
            }
        };
    }

    /**
     *  检查消息是否正在编辑
     * @param {HTMLElement} messageNode
     * @returns {boolean}
     */
    function isMessageBeingEdited(messageNode) {
        if (!messageNode) return false;

        // 常见编辑态标记：contenteditable=true
        const editableText = messageNode.querySelector('.mes_text[contenteditable="true"]');
        if (editableText) return true;

        // 兜底：类名包含 editing / edit
        if (
            messageNode.classList.contains('editing') ||
            messageNode.classList.contains('mes_editing') ||
            messageNode.classList.contains('edit')
        ) {
            return true;
        }

        return false;
    }

    /**
     *  检测消息节点是否正在流式输出
     * @param {HTMLElement} messageNode - 消息节点
     * @returns {boolean} 是否正在流式
     */
    function isMessageStreaming(messageNode) {
        if (!messageNode) return false;

        // 方法1：检查是否是最后一条消息且系统处于发送状态
        const isLastMessage = messageNode.classList.contains('last_mes');
        const systemStatus = checkSendingStatus();

        if (isLastMessage && systemStatus.isStreaming) {
            return true;
        }

        // 方法2：检查消息自身的流式标记
        const hasStreamingMarker =
            messageNode.classList.contains('streaming') ||
            messageNode.classList.contains('generating') ||
            messageNode.dataset.streaming === 'true';

        if (hasStreamingMarker) {
            return true;
        }

        // 方法3：检查文本内容是否在变化（通过时间戳对比）
        const messageId = getStableMessageId(messageNode);
        const streamingInfo = streamingState.activeMessages.get(messageId);

        if (streamingInfo) {
            const timeSinceLastUpdate = Date.now() - streamingInfo.lastUpdate;
            // 如果最近1秒内有更新，认为还在流式
            if (timeSinceLastUpdate < 1000) {
                return true;
            }
        }

        return false;
    }

    /**
     *  标记消息开始流式输出
     * @param {HTMLElement} messageNode - 消息节点
     * @param {Array} detectedTags - 检测到的标记
     */
    function markMessageAsStreaming(messageNode, detectedTags = []) {
        const messageId = getStableMessageId(messageNode);

        streamingState.activeMessages.set(messageId, {
            node: messageNode,
            detectedTags,
            lastUpdate: Date.now(),
            startTime: Date.now()
        });

        messageNode.dataset.streaming = 'true';

        console.log(`[AI Gen] 标记消息 ${messageId} 为流式中，检测到 ${detectedTags.length} 个标记`);
    }

    /**
     *  标记消息流式输出完成
     * @param {HTMLElement} messageNode - 消息节点
     */
    function markMessageAsStreamComplete(messageNode) {
        const messageId = getStableMessageId(messageNode);

        if (streamingState.activeMessages.has(messageId)) {
            const info = streamingState.activeMessages.get(messageId);
            const duration = Date.now() - info.startTime;

            console.log(`[AI Gen] 消息 ${messageId} 流式完成，耗时 ${duration}ms`);

            streamingState.activeMessages.delete(messageId);
            delete messageNode.dataset.streaming;

            // 添加到待处理队列
            streamingState.pendingQueue.add(messageId);
        }
    }

    /**
    * 处理消息并添加生成按钮
    * @param {HTMLElement} messageNode - 消息DOM节点
    */
    async function detectTagsInMessage(messageNode) {
        const mesText = messageNode.querySelector('.mes_text');
        if (!mesText) return [];

        const startTag = await GM_getValue('comfyui_start_tag', DEFAULT_SETTINGS.startTag);
        const endTag = await GM_getValue('comfyui_end_tag', DEFAULT_SETTINGS.endTag);
        if (!startTag || !endTag) return [];

        const regex = new RegExp(escapeRegex(startTag) + '([\\s\\S]*?)' + escapeRegex(endTag), 'g');
        const detectedTags = [];
        let match;

        while ((match = regex.exec(mesText.innerHTML)) !== null) {
            const cleanPrompt = match[1].replace(/<[^>]*>/g, "").trim();
            if (cleanPrompt) {
                detectedTags.push({
                    fullMatch: match[0],
                    prompt: cleanPrompt,
                    startIndex: match.index
                });
            }
        }

        return detectedTags;
    }

    /**
     *  处理消息并添加生成按钮（流式感知版）
     * @param {HTMLElement} messageNode - 消息DOM节点
     * @param {boolean} forceReplace - 是否强制替换（即使在流式中）
     */
    async function processMessageForComfyButton(messageNode, forceReplace = false) {
        // 编辑中不处理，避免误判和污染状态
        if (!forceReplace && isMessageBeingEdited(messageNode)) return;

        // 防止重复处理（极短时间内）
        const now = Date.now();
        const lastProcessTime = messageNode.dataset.lastProcessTime ? parseInt(messageNode.dataset.lastProcessTime) : 0;
        if (!forceReplace && now - lastProcessTime < 100) return;

        messageNode.dataset.lastProcessTime = now.toString();

        const mesText = messageNode.querySelector('.mes_text');
        if (!mesText) return;

        const messageId = getStableMessageId(messageNode);

        //  步骤1：检测标记
        const detectedTags = await detectTagsInMessage(messageNode);

        if (detectedTags.length === 0) {
            // 没有标记，清理状态
            if (streamingState.activeMessages.has(messageId)) {
                markMessageAsStreamComplete(messageNode);
            }
            return;
        }

        //  步骤2：判断是否在流式输出
        const isStreaming = !forceReplace && isMessageStreaming(messageNode);

        if (isStreaming) {
            // 流式中：只标记，不替换
            markMessageAsStreaming(messageNode, detectedTags);
            console.log(`[AI Gen] 消息 ${messageId} 流式中，检测到 ${detectedTags.length} 个标记，等待完成...`);
            return;
        }

        //  步骤3：流式完成或强制替换，执行替换
        console.log(`[AI Gen] 消息 ${messageId} 开始替换标记为按钮`);

        const startTag = await GM_getValue('comfyui_start_tag', DEFAULT_SETTINGS.startTag);
        const endTag = await GM_getValue('comfyui_end_tag', DEFAULT_SETTINGS.endTag);
        const regex = new RegExp(escapeRegex(startTag) + '([\\s\\S]*?)' + escapeRegex(endTag), 'g');

        // 替换标记为按钮
        mesText.innerHTML = mesText.innerHTML.replace(regex, (_match, prompt) => {
            const cleanPrompt = prompt.replace(/<[^>]*>/g, "").trim();
            if (!cleanPrompt) return _match;

            const encodedPrompt = escapeHTML(cleanPrompt);
            const generationId = simpleHash(`${cleanPrompt}_${messageId}`);

            return `<span class="comfy-button-group" data-generation-id="${generationId}" data-processed-tag="true"><button class="comfy-button comfy-chat-generate-button" data-prompt="${encodedPrompt}">开始生成</button></span>`;
        });

        //  步骤4：处理按钮逻辑
        const buttonGroups = mesText.querySelectorAll('.comfy-button-group');
        if (buttonGroups.length > 0) {
            const autoGen = await GM_getValue('comfyui_auto_generate', DEFAULT_SETTINGS.autoGenerate);

            for (const group of buttonGroups) {
                if (group.dataset.listenerAttached) continue;
                group.dataset.listenerAttached = 'true';

                const id = group.dataset.generationId;
                const btn = group.querySelector('.comfy-chat-generate-button');
                if (!btn) continue;

                // 检查缓存
                const cached = await imageCacheDB.getImage(id);
                if (cached) {
                    await displayImage(group, id);
                    await setupGeneratedState(btn, id);
                } else {
                    // [Phase 3.1] Direct listener removed - delegation handles clicks

                    // 自动生成（仅当不在发送状态时）
                    const systemStatus = checkSendingStatus();
                    if (autoGen && !systemStatus.isSending && !btn.dataset.autoTriggered) {
                        btn.dataset.autoTriggered = 'true';
                        setTimeout(() => btn.click(), 300);
                    }
                }
            }
        }

        // 清理流式状态
        if (streamingState.activeMessages.has(messageId)) {
            markMessageAsStreamComplete(messageNode);
        }

        // 从待处理队列移除
        streamingState.pendingQueue.delete(messageId);
    }

    /**
     *  处理待处理队列中的消息
     */
    async function processPendingMessages() {
        if (streamingState.pendingQueue.size === 0) return;

        const messageIds = Array.from(streamingState.pendingQueue);
        console.log(`[AI Gen] 处理 ${messageIds.length} 个待处理消息`);

        for (const messageId of messageIds) {
            const messageNode = document.querySelector(`[data-ai-gen-id="${messageId}"]`);
            if (messageNode) {
                await processMessageForComfyButton(messageNode, true); // 强制替换
            } else {
                // 节点不存在，从队列移除
                streamingState.pendingQueue.delete(messageId);
            }
        }
    }

    /**
    * 生成按钮点击处理
    * @param {Event} event - 点击事件
    */
    // -------------------------------------------------------------------------
    // Section 9: Generation Pipeline
    // -------------------------------------------------------------------------
    async function onGenerateButtonClick(event) {
        const button = event.target.closest('.comfy-chat-generate-button');
        const group = button.closest('.comfy-button-group');
        const promptFromChat = button.dataset.prompt;
        const generationId = group.dataset.generationId;

        if (button.disabled || button.dataset.processing === 'true') return;

        const isFirstGeneration = button.textContent === '开始生成';

        //  节流检查
        const lastClick = generateThrottle.get(generationId);
        if (lastClick && Date.now() - lastClick < GENERATE_COOLDOWN) {
            const remaining = Math.ceil((GENERATE_COOLDOWN - (Date.now() - lastClick)) / 1000);
            showToast('warning', `请稍后再试 (${remaining}秒冷却中)`);
            return;
        }
        generateThrottle.set(generationId, Date.now());
        // [Phase 2.2] Periodically prune stale throttle entries
        if (generateThrottle.size > 50) {
            const now = Date.now();
            for (const [key, time] of generateThrottle) {
                if (now - time > 60000) generateThrottle.delete(key);
            }
        }
        button.dataset.processing = 'true';
        button.textContent = '生成中...';
        button.disabled = true;
        button.className = 'comfy-button comfy-chat-generate-button testing';

        // 隐藏按钮模式：非首次生成时隐藏按钮
        const {
            comfyui_hide_buttons: hideButtonsMode,
            comfyui_enable_comparison: comparisonEnabled
        } = await getStoredValues([
            ['comfyui_hide_buttons', DEFAULT_SETTINGS.hideButtons],
            ['comfyui_enable_comparison', DEFAULT_SETTINGS.enableComparison]
        ]);
        if (hideButtonsMode && !isFirstGeneration) {
            group.classList.add('comfy-buttons-hidden');
        }

        // Feature 14: 捕获旧图用于对比（受开关控制）
        if (comparisonEnabled) ComparisonMode.captureOldImage(group);

        // 移除旧图片容器和旧对比组件
        const oldCompare = group.parentElement?.querySelector('.comfy-compare-container');
        if (oldCompare) oldCompare.remove();
        const oldActions = group.parentElement?.querySelector('.comfy-compare-actions');
        if (oldActions) oldActions.remove();
        const oldContainer = group.nextElementSibling;
        if (oldContainer?.classList.contains('comfy-image-container')) oldContainer.remove();

        // Feature 1: 创建进度条
        ProgressTracker.createUI(group);

        try {
            const startTime = Date.now();
            const result = currentMode === MODES.COMFYUI
                ? await generateWithComfyUI(promptFromChat)
                : await generateWithWebUI(promptFromChat);

            const { images } = result;
            const primaryImage = images[0];

            // Feature 5: 更新 seed 显示
            updateSeedDisplay(primaryImage.seed);

            // 构建丰富的元数据
            const metadataSettings = currentMode === MODES.COMFYUI
                ? await getStoredValues([
                    ['comfyui_gen_width', DEFAULT_SETTINGS.genWidth],
                    ['comfyui_gen_height', DEFAULT_SETTINGS.genHeight],
                    ['comfyui_model', ''],
                    ['comfyui_steps', DEFAULT_SETTINGS.steps],
                    ['comfyui_cfg', DEFAULT_SETTINGS.cfg],
                    ['comfyui_sampler', DEFAULT_SETTINGS.sampler]
                ])
                : await getStoredValues([
                    ['comfyui_gen_width', DEFAULT_SETTINGS.genWidth],
                    ['comfyui_gen_height', DEFAULT_SETTINGS.genHeight],
                    ['webui_model', ''],
                    ['webui_steps', DEFAULT_SETTINGS.steps],
                    ['webui_cfg', DEFAULT_SETTINGS.cfg],
                    ['webui_sampler', DEFAULT_SETTINGS.webuiSampler]
                ]);

            const metadata = {
                width: metadataSettings.comfyui_gen_width,
                height: metadataSettings.comfyui_gen_height,
                model: currentMode === MODES.COMFYUI ? metadataSettings.comfyui_model : metadataSettings.webui_model,
                steps: currentMode === MODES.COMFYUI ? metadataSettings.comfyui_steps : metadataSettings.webui_steps,
                cfg: currentMode === MODES.COMFYUI ? metadataSettings.comfyui_cfg : metadataSettings.webui_cfg,
                sampler: currentMode === MODES.COMFYUI ? metadataSettings.comfyui_sampler : metadataSettings.webui_sampler,
                seed: primaryImage.seed,
                generationTime: Date.now() - startTime,
            };

            // 保存第一张图到缓存
            await saveImageToCache(generationId, primaryImage.imageUrl, promptFromChat, metadata);

            // Feature 7: 多图显示或单图显示
            if (images.length > 1) {
                await displayImageGrid(group, images);
            } else {
                await displayImage(group, generationId);
            }

            // Feature 14: 图片对比模式（受开关控制）
            if (comparisonEnabled && ComparisonMode.oldImageSrc) {
                const newImg = group.nextElementSibling?.querySelector('img');
                if (newImg?.src) ComparisonMode.show(group, newImg.src);
            }

            button.className = 'comfy-button comfy-chat-generate-button success';
            button.textContent = '成功';
            setTimeout(() => setupGeneratedState(button, generationId), 2000);

        } catch (error) {
            console.error('生成图片失败:', error);
            showToast('error', error.message || String(error));
            button.className = 'comfy-button comfy-chat-generate-button error';
            button.textContent = '失败';
            setTimeout(() => {
                button.textContent = '重新生成';
                button.disabled = false;
                button.className = 'comfy-button comfy-chat-generate-button';
            }, 3000);
        } finally {
            delete button.dataset.processing;
            ProgressTracker.remove();
        }
    }

    /**
    * 设置按钮的生成后状态
    * @param {HTMLButtonElement} btn - 按钮元素
    * @param {string} id - 生成ID
    */
    async function setupGeneratedState(btn, id) {
        btn.textContent = '重新生成';
        btn.disabled = false;
        btn.className = 'comfy-button comfy-chat-generate-button';

        // [Phase 3.1] Use cloneNode to clear old listeners; delegation handles clicks
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        const group = newBtn.closest('.comfy-button-group');

        if (!group.querySelector('.comfy-delete-button')) {
            const delBtn = document.createElement('button');
            delBtn.textContent = '删除';
            delBtn.className = 'comfy-button error comfy-delete-button';
            delBtn.addEventListener('click', async () => {
                await deleteImageFromCache(id);
                group.classList.remove('comfy-buttons-hidden');
                group.nextElementSibling?.remove(); // 移除图片容器
                newBtn.textContent = '开始生成';
                delBtn.remove();
            });
            newBtn.insertAdjacentElement('afterend', delBtn);
        }

        // 隐藏按钮模式：隐藏按钮，为图片添加双击重新生成
        const hideButtons = await GM_getValue('comfyui_hide_buttons', DEFAULT_SETTINGS.hideButtons);
        if (hideButtons) {
            group.classList.add('comfy-buttons-hidden');
            const imgContainer = group.nextElementSibling;
            if (imgContainer?.classList.contains('comfy-image-container')) {
                imgContainer.querySelectorAll('img').forEach(img => {
                    if (img.dataset.dblClickBound) return;
                    img.dataset.dblClickBound = 'true';
                    img.style.cursor = 'pointer';
                    img.addEventListener('dblclick', () => {
                        // 抖动动画反馈
                        img.classList.add('comfy-shake');
                        img.addEventListener('animationend', () => img.classList.remove('comfy-shake'), { once: true });
                        // 触发重新生成
                        const genBtn = group.querySelector('.comfy-chat-generate-button');
                        if (genBtn) {
                            group.classList.remove('comfy-buttons-hidden');
                            genBtn.click();
                        }
                    });
                });
            }
        } else {
            group.classList.remove('comfy-buttons-hidden');
        }
    }

    /**
    * 递归遍历工作流对象并替换占位符。
    */
    function replacePlaceholdersInWorkflow(obj, params) {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                replacePlaceholdersInWorkflow(obj[key], params);
            } else {
                const placeholderMapping = {
                    '%model%': params.model, '%unet_model%': params.unet_model,
                    '%prompt%': params.positive_prompt, '%negative_prompt%': params.negative_prompt,
                    '%sampler%': params.sampler, '%scheduler%': params.scheduler,
                    '%width%': params.width, '%height%': params.height,
                    '%seed%': params.seed, '%steps%': params.steps, '%cfg%': params.cfg,
                    '%init_image%': params.init_image || '',
                    '%denoise%': params.denoise,
                    '%denoising_strength%': params.denoise,
                };
                if (Object.prototype.hasOwnProperty.call(placeholderMapping, obj[key])) {
                    obj[key] = placeholderMapping[obj[key]];
                }
            }
        }
    }

    /**
    * 使用ComfyUI生成图片
    */
    async function generateWithComfyUI(promptFromChat) {
        if (!validateSettings()) {
            throw new Error('设置验证失败，请检查输入');
        }
        const comfySettings = await getStoredValues([
            ['comfyui_url', ''],
            ['comfyui_workflow', ''],
            ['comfyui_positive_prompt', ''],
            ['comfyui_negative_prompt', ''],
            ['comfyui_model', ''],
            ['comfyui_unet_model', ''],
            ['comfyui_steps', DEFAULT_SETTINGS.steps],
            ['comfyui_cfg', DEFAULT_SETTINGS.cfg],
            ['comfyui_sampler', DEFAULT_SETTINGS.sampler],
            ['comfyui_scheduler', DEFAULT_SETTINGS.scheduler],
            ['comfyui_gen_width', DEFAULT_SETTINGS.genWidth],
            ['comfyui_gen_height', DEFAULT_SETTINGS.genHeight]
        ]);
        const url = comfySettings.comfyui_url.trim();
        const workflowString = comfySettings.comfyui_workflow;
        if (!url || !workflowString) throw new Error('ComfyUI URL或工作流未配置');
        const workflowValidation = validateComfyWorkflow(workflowString);
        if (!workflowValidation.ok) {
            throw new Error(`工作流校验失败: ${workflowValidation.errors.join('；')}`);
        }

        let objectInfo;
        try {
            objectInfo = await getCachedObjectInfo(url);
        } catch (e) {
            throw new Error(`无法从ComfyUI获取节点元数据: ${e.message}`);
        }

        //  优化：使用智能合并函数，顺序为 {固定提示词} + {标记提示词}
        const fixedPositivePrompt = comfySettings.comfyui_positive_prompt;
        const fixedNegativePrompt = comfySettings.comfyui_negative_prompt;

        const finalPositivePrompt = smartMergePrompts(
            fixedPositivePrompt,  // 固定正向提示词（优先级最高）
            promptFromChat        // 从聊天标记中提取的提示词
        );

        const finalNegativePrompt = smartMergePrompts(
            fixedNegativePrompt   // 固定负向提示词
        );

        //  可选：输出最终提示词到控制台（方便调试）
        logFinalPrompts(finalPositivePrompt, finalNegativePrompt, 'ComfyUI');

        const params = {
            model: comfySettings.comfyui_model,
            unet_model: comfySettings.comfyui_unet_model || "",
            positive_prompt: finalPositivePrompt,
            negative_prompt: finalNegativePrompt,
            seed: getSeedForGeneration(),
            steps: comfySettings.comfyui_steps,
            cfg: comfySettings.comfyui_cfg,
            sampler: comfySettings.comfyui_sampler,
            scheduler: comfySettings.comfyui_scheduler,
            width: comfySettings.comfyui_gen_width,
            height: comfySettings.comfyui_gen_height,
            denoise: normalizeNumber(document.getElementById('comfyui-img2img-denoising')?.value, 0.75),
        };
        const comfyImg2ImgState = getImg2ImgState(MODES.COMFYUI);
        const img2imgState = comfyImg2ImgState;
        if (!params.model) throw new Error('ComfyUI Checkpoint模型未选择');
        if (img2imgState.enabled && !img2imgState.imageData) {
            throw new Error('已启用ComfyUI图生图，但还没有上传参考图片');
        }

        // Feature 3: Img2Img - 上传参考图片
        if (img2imgState.enabled && img2imgState.imageData) {
            const uploadResult = await uploadImageToComfyUI(url, comfyImg2ImgState.imageData, comfyImg2ImgState.fileName);
            params.init_image = uploadResult.name;
        }

        const batchSize = Math.min(4, Math.max(1, parseInt(
            document.getElementById('comfyui-batch-size')?.value || '1')));
        const results = [];
        const workflowTemplate = safeJsonParse(workflowString, null, 'ComfyUI workflow');
        if (!workflowTemplate || typeof workflowTemplate !== 'object') {
            throw new Error('ComfyUI 工作流 JSON 无效');
        }

        for (let i = 0; i < batchSize; i++) {
            const batchParams = { ...params };
            if (i > 0) batchParams.seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            const clientId = createClientId();

            ProgressTracker.startComfyUI(url, null, clientId);

            const workflow = JSON.parse(JSON.stringify(workflowTemplate));
            replacePlaceholdersInWorkflow(workflow, batchParams);

            const enabledLoras = getEnabledComfyUISelectedLoras();
            if (!intelligentLoraInjection(workflow, enabledLoras, objectInfo)) {
                throw new Error("智能LoRA注入失败，请检查工作流或LoRA配置。");
            }

            const promptResponse = await makeRequestWithRetry({
                method: 'POST', url: `${url}/prompt`,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ prompt: workflow, client_id: clientId }),
            }, 2);
            const promptResult = safeJsonParse(promptResponse.responseText, null, 'ComfyUI /prompt');
            const promptId = promptResult?.prompt_id;
            if (!promptId) throw new Error('ComfyUI未返回Prompt ID');
            ProgressTracker.activePromptId = promptId;

            const finalHistory = await pollForResult(url, promptId);
            let imageUrl = findImageUrlInHistory(finalHistory, promptId, url);

            if (!imageUrl) {
                imageUrl = await ProgressTracker.waitForPreview();
                if (imageUrl) {
                    console.warn('[AI Gen] /history 未返回图片，已回退到 WebSocket 预览图', summarizeHistoryEntry(finalHistory, promptId));
                }
            }

            if (!imageUrl) {
                console.warn('[AI Gen] ComfyUI history 摘要:', summarizeHistoryEntry(finalHistory, promptId));
                throw new Error('ComfyUI 已完成，但未返回可显示图片；/history 与预览流都没有拿到结果。');
            }
            results.push({ imageUrl, seed: batchParams.seed });
        }

        return { images: results };
    }

    /**
    * 使用WebUI生成图片
    */
    async function generateWithWebUI(promptFromChat) {
        if (!validateSettings()) {
            throw new Error('设置验证失败，请检查输入');
        }
        const webuiSettings = await getStoredValues([
            ['webui_url', ''],
            ['webui_model', ''],
            ['comfyui_positive_prompt', ''],
            ['comfyui_negative_prompt', ''],
            ['webui_steps', DEFAULT_SETTINGS.steps],
            ['webui_cfg', DEFAULT_SETTINGS.cfg],
            ['comfyui_gen_width', DEFAULT_SETTINGS.genWidth],
            ['comfyui_gen_height', DEFAULT_SETTINGS.genHeight],
            ['webui_sampler', DEFAULT_SETTINGS.webuiSampler],
            ['webui_scheduler', DEFAULT_SETTINGS.webuiScheduler],
            ['webui_enable_hires', false],
            ['webui_hires_upscaler', DEFAULT_SETTINGS.hiresUpscaler],
            ['webui_hires_steps', DEFAULT_SETTINGS.hiresSteps],
            ['webui_hires_upscale', DEFAULT_SETTINGS.hiresUpscale],
            ['webui_hires_denoising', DEFAULT_SETTINGS.hiresDenoising]
        ]);
        const url = webuiSettings.webui_url.trim();
        if (!url) throw new Error('WebUI URL未配置');

        const selectedModel = webuiSettings.webui_model;
        if (!selectedModel) throw new Error('WebUI模型未选择');

        // 切换模型
        try {
            const opts = safeJsonParse((await makeRequest({ method: 'GET', url: `${url}/sdapi/v1/options` })).responseText, {}, 'WebUI /options');
            if (opts.sd_model_checkpoint !== selectedModel) {
                showToast('info', `正在切换WebUI模型到: ${selectedModel}`);
                await makeRequest({
                    method: 'POST', url: `${url}/sdapi/v1/options`,
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify({ sd_model_checkpoint: selectedModel }),
                });
                await new Promise(resolve => setTimeout(resolve, 2000)); // 等待模型加载
            }
        } catch (e) { console.warn("模型切换检查失败，将使用当前模型。", e); }

        //  优化：使用智能合并函数，顺序为 {固定提示词} + {Embedding} + {标记提示词}
        const fixedPositivePrompt = webuiSettings.comfyui_positive_prompt;
        const fixedNegativePrompt = webuiSettings.comfyui_negative_prompt;

        const finalPositivePrompt = smartMergePrompts(
            fixedPositivePrompt,              // 固定正向提示词（优先级最高）
            generateEmbeddingPromptString(true), // WebUI Embedding（正向）
            promptFromChat                    // 从聊天标记中提取的提示词
        );

        const finalNegativePrompt = smartMergePrompts(
            fixedNegativePrompt,               // 固定负向提示词（优先级最高）
            generateEmbeddingPromptString(false) // WebUI Embedding（负向）
        );

        //  可选：输出最终提示词到控制台（方便调试）
        logFinalPrompts(finalPositivePrompt, finalNegativePrompt, 'WebUI');

        const params = {
            prompt: finalPositivePrompt,
            negative_prompt: finalNegativePrompt,
            steps: webuiSettings.webui_steps,
            cfg_scale: webuiSettings.webui_cfg,
            width: webuiSettings.comfyui_gen_width,
            height: webuiSettings.comfyui_gen_height,
            sampler_name: webuiSettings.webui_sampler,
            scheduler: webuiSettings.webui_scheduler,
            seed: getSeedForGeneration(),
            n_iter: Math.min(4, Math.max(1, parseInt(document.getElementById('webui-batch-size')?.value || '1'))),
            batch_size: 1,
            enable_hr: webuiSettings.webui_enable_hires,
        };
        const webuiImg2ImgState = getImg2ImgState(MODES.WEBUI);
        if (params.enable_hr) {
            Object.assign(params, {
                hr_upscaler: webuiSettings.webui_hires_upscaler,
                hr_second_pass_steps: webuiSettings.webui_hires_steps,
                hr_scale: webuiSettings.webui_hires_upscale,
                denoising_strength: webuiSettings.webui_hires_denoising,
            });
        }

        // Feature 3: Img2Img
        let apiEndpoint = `${url}/sdapi/v1/txt2img`;
        if (webuiImg2ImgState.enabled && webuiImg2ImgState.imageData) {
            apiEndpoint = `${url}/sdapi/v1/img2img`;
            params.init_images = [webuiImg2ImgState.imageData.split(',')[1]]; // base64 部分
            params.denoising_strength = parseFloat(
                document.getElementById('webui-img2img-denoising')?.value || 0.75
            );
        } else if (webuiImg2ImgState.enabled) {
            throw new Error('已启用WebUI图生图，但还没有上传参考图片');
        }

        showToast('info', 'WebUI正在生成图片...');
        // Feature 1: 启动进度轮询
        ProgressTracker.startWebUI(url);

        const response = await makeRequestWithRetry({
            method: 'POST', url: apiEndpoint,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify(params),
        }, 2);
        const result = safeJsonParse(response.responseText, null, 'WebUI generation');
        if (!result || typeof result !== 'object') {
            throw new Error('WebUI 返回了无效生成结果');
        }
        const images = result.images;
        if (!images || images.length === 0) throw new Error('WebUI未返回图片');

        // WebUI returns seed in `info` (JSON string) or `parameters` (could be string or object)
        let baseSeed = params.seed;
        try {
            const info = typeof result.info === 'string' ? JSON.parse(result.info) : result.info;
            if (info?.seed != null) baseSeed = info.seed;
        } catch { /* fallback to params.seed */ }
        return {
            images: images.map((img, i) => ({
                imageUrl: `data:image/png;base64,${img}`,
                seed: baseSeed + i
            }))
        };
    }

    /**
     *  [增强] 智能 LoRA 注入
     */
    function intelligentLoraInjection(workflow, selectedLoras, objectInfo) {
        if (!selectedLoras || selectedLoras.length === 0) return true;

        //  更详细的错误提示
        if (!objectInfo) {
            console.error("[AI Gen] LoRA注入失败：缺失节点元数据");
            showToast('error', '请先点击"Test"按钮连接ComfyUI以加载节点信息');
            return false;
        }

        const loraLoader = findComfyUILoraLoader(objectInfo);
        if (!loraLoader) {
            showToast('error', 'ComfyUI未提供可用的LoRA加载节点，无法注入LoRA。');
            return false;
        }

        let modelSourceNodeId = null;
        const candidateNodes = []; //  收集候选节点用于调试

        for (const nodeId in workflow) {
            const node = workflow[nodeId];
            const nodeInfo = objectInfo[node.class_type];

            if (!nodeInfo) {
                console.warn(`[AI Gen] 未知节点类型: ${node.class_type} (节点ID: ${nodeId})`);
                continue;
            }

            const outputs = nodeInfo.output;
            const inputs = nodeInfo.input?.required || {};

            if (outputs.includes("MODEL") && outputs.includes("CLIP")) {
                candidateNodes.push({ id: nodeId, type: node.class_type });

                // 找到没有MODEL输入的节点（即模型加载器）
                if (!Object.values(inputs).some(i => Array.isArray(i) && i[0] === "MODEL")) {
                    modelSourceNodeId = nodeId;
                    break;
                }
            }
        }

        //  未找到时提供更多信息
        if (!modelSourceNodeId) {
            console.error("[AI Gen] LoRA注入失败 - 工作流分析:", {
                totalNodes: Object.keys(workflow).length,
                candidateCount: candidateNodes.length,
                candidates: candidateNodes
            });

            const errorMsg = candidateNodes.length > 0
                ? `找到 ${candidateNodes.length} 个可能的模型节点 (${candidateNodes.map(n => n.type).join(', ')})，但无法确定源头。请检查工作流结构。`
                : '工作流中未找到模型加载节点（CheckpointLoader等），无法注入LoRA。请确保工作流包含模型加载器。';

            showToast('error', errorMsg);
            return false;
        }

        //  成功时输出日志
        console.log(`[AI Gen] LoRA注入准备 - 源节点: ${workflow[modelSourceNodeId].class_type} (ID: ${modelSourceNodeId})`);

        let lastModelProvider = { id: modelSourceNodeId, index: objectInfo[workflow[modelSourceNodeId].class_type].output.indexOf("MODEL") };
        let lastClipProvider = { id: modelSourceNodeId, index: objectInfo[workflow[modelSourceNodeId].class_type].output.indexOf("CLIP") };

        const modelConsumers = [], clipConsumers = [];
        for (const nodeId in workflow) {
            const node = workflow[nodeId];
            if (!node.inputs) continue;
            for (const inputKey in node.inputs) {
                const link = node.inputs[inputKey];
                if (Array.isArray(link) && link[0] === lastModelProvider.id && link[1] === lastModelProvider.index) modelConsumers.push({ nodeId, inputKey });
                if (Array.isArray(link) && link[0] === lastClipProvider.id && link[1] === lastClipProvider.index) clipConsumers.push({ nodeId, inputKey });
            }
        }

        let maxId = Math.max(
            0,
            ...Object.keys(workflow)
                .map(Number)
                .filter(Number.isFinite)
        );

        for (const lora of selectedLoras) {
            const newLoraNodeId = (++maxId).toString();
            workflow[newLoraNodeId] = {
                inputs: {
                    lora_name: lora.name,
                    strength_model: lora.modelWeight,
                    strength_clip: lora.clipWeight,
                    model: [lastModelProvider.id, lastModelProvider.index],
                    clip: [lastClipProvider.id, lastClipProvider.index]
                },
                class_type: loraLoader.type
            };
            const loraNodeInfo = loraLoader.nodeInfo;
            lastModelProvider = { id: newLoraNodeId, index: loraNodeInfo.output.indexOf("MODEL") };
            lastClipProvider = { id: newLoraNodeId, index: loraNodeInfo.output.indexOf("CLIP") };
        }

        modelConsumers.forEach(c => { workflow[c.nodeId].inputs[c.inputKey] = [lastModelProvider.id, lastModelProvider.index]; });
        clipConsumers.forEach(c => { workflow[c.nodeId].inputs[c.inputKey] = [lastClipProvider.id, lastClipProvider.index]; });

        return true;
    }


    /**
     *  带指数退避的智能轮询
     */
    function pollForResult(url, promptId) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            let interval = 1000; // 初始1秒
            const maxInterval = 5000; // 最大5秒
            let pollCount = 0;
            let historySeenAt = 0;
            const imageGracePeriodMs = 3000;

            const poll = async () => {
                // 超时检查
                if (Date.now() - startTime > POLLING_TIMEOUT_MS) {
                    reject(new Error('生成超时（可能是复杂工作流，请稍后在ComfyUI中查看）'));
                    return;
                }

                try {
                    const response = await makeRequest({
                        method: 'GET',
                        url: `${url}/history/${promptId}`
                    });
                    const history = safeJsonParse(response.responseText, null, `ComfyUI /history/${promptId}`);
                    if (!history || typeof history !== 'object') {
                        throw new Error('ComfyUI /history 返回了无效数据');
                    }

                    if (history[promptId]) {
                        historySeenAt = historySeenAt || Date.now();

                        const imageUrl = findImageUrlInHistory(history, promptId, url, true);
                        if (imageUrl) {
                            console.log(`[AI Gen] 轮询成功 (${pollCount} 次, 耗时 ${((Date.now() - startTime) / 1000).toFixed(1)}s)`);
                            resolve(history);
                            return;
                        }

                        const completed = history[promptId]?.status?.completed === true ||
                            history[promptId]?.completed === true ||
                            history[promptId]?.status_str === 'success';

                        if (completed && Date.now() - historySeenAt >= imageGracePeriodMs) {
                            resolve(history);
                            return;
                        }

                        pollCount++;
                        interval = Math.min(interval * 1.15, maxInterval);
                        setTimeout(poll, interval);
                    } else {
                        //  指数退避：逐渐增加轮询间隔
                        pollCount++;
                        interval = Math.min(interval * 1.15, maxInterval);
                        setTimeout(poll, interval);
                    }
                } catch (error) {
                    console.error(`[AI Gen] 轮询出错:`, error);
                    reject(error);
                }
            };

            poll(); // 启动轮询
        });
    }

    function getImagesFromHistory(history, promptId) {
        const outputs = history[promptId]?.outputs;
        if (!outputs) {
            return [];
        }

        const images = [];

        for (const nodeOutput of Object.values(outputs)) {
            if (nodeOutput.images?.length) {
                images.push(...nodeOutput.images);
            }
            if (nodeOutput.ui?.images?.length) {
                images.push(...nodeOutput.ui.images);
            }
            if (nodeOutput.gifs?.length) {
                images.push(...nodeOutput.gifs);
            }
        }

        return images.filter(image => image?.filename);
    }

    function summarizeHistoryEntry(history, promptId) {
        const entry = history?.[promptId];
        if (!entry) return null;

        const outputs = entry.outputs || {};
        return {
            completed: entry?.status?.completed ?? entry?.completed ?? null,
            status_str: entry?.status_str ?? null,
            messages: Array.isArray(entry?.status?.messages) ? entry.status.messages.slice(-5) : [],
            outputNodes: Object.entries(outputs).map(([nodeId, nodeOutput]) => ({
                nodeId,
                keys: Object.keys(nodeOutput || {}),
                images: nodeOutput?.images?.length || 0,
                uiImages: nodeOutput?.ui?.images?.length || 0,
                gifs: nodeOutput?.gifs?.length || 0
            }))
        };
    }

    /**
    * 在历史记录中查找图片URL
    * 兼容 SaveImage (type=output) 和 PreviewImage (type=temp)
    * 部分 ComfyUI 版本中 PreviewImage 的图片在 outputs[nodeId].ui.images 下
    */
    function findImageUrlInHistory(history, promptId, baseUrl, silent = false) {
        const outputs = history[promptId]?.outputs;
        if (!outputs) {
            if (!silent) {
                console.warn('[AI Gen] 历史记录中无 outputs:', JSON.stringify(history[promptId]).substring(0, 500));
            }
            return null;
        }

        const images = getImagesFromHistory(history, promptId);
        let fallbackImage = null;

        for (const image of images) {
            if (image.type === 'output') {
                return `${baseUrl}/view?${new URLSearchParams({ filename: image.filename, subfolder: image.subfolder || '', type: image.type })}`;
            }
            if (!fallbackImage) fallbackImage = image;
        }

        if (fallbackImage) {
            return `${baseUrl}/view?${new URLSearchParams({ filename: fallbackImage.filename, subfolder: fallbackImage.subfolder || '', type: fallbackImage.type || 'temp' })}`;
        }

        if (!silent) {
            console.warn('[AI Gen] 未在以下输出中找到图片:', Object.keys(outputs).map(id => ({ id, keys: Object.keys(outputs[id]) })));
        }
        return null;
    }

    /**
     * 显示图片
     * imageDataOrId:
     *   - 如果是 http/data/blob URL：直接用 URL 显示
     *   - 如果是普通字符串（例如 generationId）：从 IndexedDB 按ID读取并显示
     */
    async function displayImage(anchorElement, imageDataOrId) {
        let container = anchorElement.nextElementSibling;
        if (!container || !container.classList.contains('comfy-image-container')) {
            container = document.createElement('span');
            container.className = 'comfy-image-container';
            anchorElement.insertAdjacentElement('afterend', container);
        }
        container.innerHTML = '';
        container.style.display = '';
        container.style.gridTemplateColumns = '';

        const img = document.createElement('img');
        img.alt = 'Generated by AI';

        if (typeof imageDataOrId === 'string') {
            if (imageDataOrId.startsWith('http') ||
                imageDataOrId.startsWith('data:') ||
                imageDataOrId.startsWith('blob:')) {
                img.src = imageDataOrId;
            } else {
                try {
                    const cached = await imageCacheDB.getImage(imageDataOrId);
                    if (cached && cached.blob) {
                        const objectUrl = BlobURLTracker.create(cached.blob);
                        img.src = objectUrl;
                        // Feature 8: 附加元数据用于 tooltip
                        img._aiGenMeta = { prompt: cached.prompt, ...cached.metadata };
                    } else {
                        throw new Error('缓存图片未找到');
                    }
                } catch (e) {
                    console.error('[AI Gen] 加载缓存图片失败:', e);
                    img.alt = '图片加载失败';
                    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20" fill="red">图片丢失</text></svg>';
                }
            }
        } else if (imageDataOrId && imageDataOrId.url) {
            img.src = imageDataOrId.url;
        }

        // Feature 8: 悬浮提示事件
        img.addEventListener('mouseenter', (e) => { if (img._aiGenMeta) ImageTooltip.scheduleShow(e, img._aiGenMeta); });
        img.addEventListener('mousemove', (e) => { if (img._aiGenMeta) ImageTooltip.onMove(e, img._aiGenMeta); });
        img.addEventListener('mouseleave', () => ImageTooltip.hide());

        const displayWidth = await GM_getValue('comfyui_display_width');
        const displayHeight = await GM_getValue('comfyui_display_height');
        img.style.width = '100%';
        img.style.maxWidth = displayWidth > 0 ? `${displayWidth}px` : '100%';
        img.style.maxHeight = displayHeight > 0 ? `${displayHeight}px` : 'none';
        img.style.height = 'auto';

        container.appendChild(img);
    }

    // -------------------------------------------------------------------------
    // Section 10: Initialization and Observers
    // -------------------------------------------------------------------------

    /**
    * 添加主菜单按钮
    */
    function addMainButton(retries = 5) {
        if (document.getElementById(BUTTON_ID) || retries <= 0) return;
        const menuContent = document.querySelector('#options .options-content');
        if (menuContent) {
            const btn = document.createElement('a');
            btn.id = BUTTON_ID;
            btn.className = 'interactable';
            btn.innerHTML = `<i class="fa-lg fa-solid fa-atom"></i><span>图片生成面板</span>`;
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                await activateHelper();
                const panel = document.getElementById(PANEL_ID);
                panel.style.display = 'flex';
                document.getElementById('options').style.display = 'none';
            });
            menuContent.appendChild(btn);
        } else {
            setTimeout(() => addMainButton(retries - 1), 100);
        }
    }

    /**
    * 初始化脚本入口。只添加菜单按钮，不连接后端服务。
    */
    function initialize() {
        addMainButton();
        console.log('[AI Gen] 图片生成助手已加载，等待用户手动打开。');
    }

    /**
    * 用户首次打开面板时才启动完整助手逻辑。
    */
    async function activateHelper() {
        if (helperActivated) return;
        helperActivated = true;

        //  初始化IndexedDB
        imageCacheDB.init().then(() => {
        }).catch(err => {
            console.error('[AI Gen] IndexedDB初始化失败:', err);
            showToast('error', 'IndexedDB初始化失败，缓存功能不可用');
        });

        createComfyUIPanel();
        ConnectionMonitor.init();
        ImageTooltip.init();

        const mainChat = document.querySelector('#chat[data-show-hidden-reasoning="true"]') || document.querySelector('#chat');
        if (!mainChat) {
            console.error("[AI Gen] 无法找到 #chat 元素，脚本无法启动。");
            return;
        }

        //  标记元素，便于后续识别
        if (!mainChat.dataset.aiGenMonitored) {
            mainChat.dataset.aiGenMonitored = 'true';
            console.log("[AI Gen] 已锁定监控目标:", mainChat);
        }

        // [Phase 3.1] Event delegation for generate buttons
        mainChat.addEventListener('click', (e) => {
            const btn = e.target.closest('.comfy-chat-generate-button');
            if (btn && !btn.dataset.delegated) onGenerateButtonClick(e);
        });

        /**
         *  智能持续扫描系统
         */
        const ScanSystem = {
            // 扫描状态
            state: {
                isScanning: false,
                lastScanTime: 0,
                processedMessages: new WeakSet(), // 使用WeakSet避免内存泄漏
                scanCount: 0,
                missedCount: 0
            },

            // 动态配置
            config: {
                idleInterval: 3000,      // 空闲时扫描间隔（3秒）
                activeInterval: 800,     // 活跃时扫描间隔（0.8秒）
                streamingInterval: 300,  // 流式输出时扫描间隔（0.3秒）
                batchSize: 10,           // 每次扫描的最大消息数
                throttleDelay: 50        // 节流延迟
            },

            // 获取当前应该使用的扫描间隔
            getCurrentInterval() {
                const systemStatus = checkSendingStatus();

                if (systemStatus.isStreaming) {
                    return this.config.streamingInterval;
                } else if (streamingState.activeMessages.size > 0 || streamingState.pendingQueue.size > 0) {
                    return this.config.activeInterval;
                } else {
                    return this.config.idleInterval;
                }
            },

            // 增量扫描：只处理未处理的消息
            async incrementalScan(mainChat) {
                if (this.state.isScanning) return;
                this.state.isScanning = true;

                try {
                    const allMessages = Array.from(mainChat.querySelectorAll('.mes'));
                    const unprocessedMessages = allMessages.filter(msg => !this.state.processedMessages.has(msg));

                    if (unprocessedMessages.length > 0) {
                        console.log(`[AI Gen Scan] 发现 ${unprocessedMessages.length} 条未处理消息`);

                        // 分批处理，避免阻塞
                        for (let i = 0; i < unprocessedMessages.length; i += this.config.batchSize) {
                            const batch = unprocessedMessages.slice(i, i + this.config.batchSize);

                            await Promise.all(batch.map(async (msg) => {
                                try {
                                    await processMessageForComfyButton(msg);
                                    this.state.processedMessages.add(msg);
                                } catch (e) {
                                    console.error('[AI Gen Scan] 处理消息失败:', e);
                                }
                            }));

                            // 让出主线程，避免卡顿
                            if (i + this.config.batchSize < unprocessedMessages.length) {
                                await new Promise(resolve => setTimeout(resolve, 10));
                            }
                        }

                        this.state.scanCount++;
                    }

                    // 检查是否有遗漏的标记（兜底机制）
                    await this.checkMissedTags(allMessages);

                    // [Phase 1.4] Merged from periodic check
                    const systemStatus = checkSendingStatus();
                    if (!systemStatus.isSending && streamingState.activeMessages.size > 0) {
                        for (const [messageId, info] of streamingState.activeMessages) {
                            await processMessageForComfyButton(info.node, true);
                        }
                    }
                    if (streamingState.pendingQueue.size > 0) {
                        await processPendingMessages();
                    }

                } finally {
                    this.state.isScanning = false;
                    this.state.lastScanTime = Date.now();
                }
            },

            // 检查遗漏的标记（已有标记但没有按钮）
            async checkMissedTags(messages) {
                const startTag = await GM_getValue('comfyui_start_tag', DEFAULT_SETTINGS.startTag);
                const endTag = await GM_getValue('comfyui_end_tag', DEFAULT_SETTINGS.endTag);

                const missedMessages = messages.filter(msg => {
                    const mesText = msg.querySelector('.mes_text');
                    if (!mesText) return false;

                    const hasTag = mesText.textContent.includes(startTag) && mesText.textContent.includes(endTag);
                    const hasButton = mesText.querySelector('.comfy-button-group');

                    // 不再在这里硬排除 streaming，交给 processMessageForComfyButton 内部判断
                    return hasTag && !hasButton && !isMessageBeingEdited(msg);
                });

                if (missedMessages.length > 0) {
                    console.warn(`[AI Gen Scan] 发现 ${missedMessages.length} 条遗漏标记，正在补救`);
                    this.state.missedCount += missedMessages.length;

                    for (const msg of missedMessages) {
                        await processMessageForComfyButton(msg, true); // 强制处理
                        this.state.processedMessages.add(msg);
                    }
                }
            },

            // [Phase 6.3] Cleanup body removed - WeakSet handles GC automatically
            cleanup() {
            }
        };

        window._AI_Gen_ScanSystem = ScanSystem;

        /**
         *  智能扫描调度器
         */
        let scanScheduler = null;

        function startContinuousScan(mainChat) {
            stopContinuousScan();

            let lastInterval = ScanSystem.getCurrentInterval();

            const scheduleScan = () => {
                const currentInterval = ScanSystem.getCurrentInterval();

                // 如果间隔变化，重新调度
                if (currentInterval !== lastInterval) {
                    console.log(`[AI Gen Scan] 扫描间隔调整: ${lastInterval}ms -> ${currentInterval}ms`);
                    lastInterval = currentInterval;
                    stopContinuousScan();
                    startContinuousScan(mainChat);
                    return;
                }

                // 执行扫描
                ScanSystem.incrementalScan(mainChat).catch(err => {
                    console.error('[AI Gen Scan] 扫描失败:', err);
                });

                // 调度下一次扫描
                scanScheduler = setTimeout(scheduleScan, currentInterval);
            };

            // 立即执行第一次扫描
            scheduleScan();

            console.log(`[AI Gen Scan] 持续扫描已启动，初始间隔: ${lastInterval}ms`);
        }

        function stopContinuousScan() {
            if (scanScheduler) {
                clearTimeout(scanScheduler);
                scanScheduler = null;
            }
        }

        /**
         *  内容稳定性检测器
         */
        let contentStabilityTimer = null;

        function checkContentStability() {
            clearTimeout(contentStabilityTimer);

            contentStabilityTimer = setTimeout(async () => {
                const systemStatus = checkSendingStatus();

                // 如果系统已经不在发送状态，处理所有流式消息
                if (!systemStatus.isSending) {
                    console.log('[AI Gen] 系统停止发送，处理流式消息');

                    // 标记所有流式消息为完成
                    for (const [messageId, info] of streamingState.activeMessages) {
                        markMessageAsStreamComplete(info.node);
                    }

                    // 处理待处理队列
                    await processPendingMessages();
                } else {
                    // 系统仍在发送，但内容已稳定，检查是否有消息超时
                    const now = Date.now();
                    for (const [messageId, info] of streamingState.activeMessages) {
                        const timeSinceStart = now - info.startTime;
                        const timeSinceUpdate = now - info.lastUpdate;

                        // 如果内容停止更新超过稳定延迟，或总时长超过最大等待时间
                        if (timeSinceUpdate > streamingState.config.stabilityDelay ||
                            timeSinceStart > streamingState.config.maxWaitTime) {

                            console.log(`[AI Gen] 消息 ${messageId} 内容稳定，开始替换`);
                            await processMessageForComfyButton(info.node, true);
                        }
                    }
                }
            }, streamingState.config.stabilityDelay);
        }

        /**
         *  优化后的 MutationObserver（仅用于快速响应）
         */
        const chatObserver = new MutationObserver((mutations) => {
            clearTimeout(observerDebounceTimer);

            observerDebounceTimer = setTimeout(async () => {
                let hasNewContent = false;

                for (const mutation of mutations) {
                    // 只关注新增节点和内容变化
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        hasNewContent = true;

                        // 快速处理新增的消息节点
                        mutation.addedNodes.forEach(node => {
                            if (!manualScan.isEnabled()) return;
                            if (node.nodeType === 1) {
                                if (node.matches('.mes')) {
                                    processMessageForComfyButton(node);
                                }
                                node.querySelectorAll('.mes').forEach(msg => {
                                    processMessageForComfyButton(msg);
                                });
                            }
                        });
                    }

                    // 检测流式输出的内容变化
                    if (mutation.type === 'characterData' || mutation.type === 'childList') {
                        if (!manualScan.isEnabled()) continue;
                        let targetNode = mutation.target;
                        while (targetNode && !targetNode.classList?.contains('mes')) {
                            targetNode = targetNode.parentElement;
                        }

                        if (targetNode?.classList?.contains('mes')) {
                            const messageId = getStableMessageId(targetNode);
                            const streamingInfo = streamingState.activeMessages.get(messageId);

                            if (streamingInfo) {
                                streamingInfo.lastUpdate = Date.now();
                            }

                            //  内容变化后，把该消息从“已处理缓存”移除，允许再次识别
                            ScanSystem.state.processedMessages.delete(targetNode);

                            //  轻节流重处理（编辑保存后非常关键）
                            const now = Date.now();
                            const lastDirtyTs = parseInt(targetNode.dataset.aiGenDirtyTs || '0', 10);
                            if (now - lastDirtyTs > 120) {
                                targetNode.dataset.aiGenDirtyTs = String(now);
                                processMessageForComfyButton(targetNode, false);
                            }

                            hasNewContent = true;
                        }
                    }

                    //  监听编辑态切换：退出编辑后强制重新处理该消息
                    if (mutation.type === 'attributes' && mutation.attributeName === 'contenteditable') {
                        if (!manualScan.isEnabled()) continue;
                        const target = mutation.target;
                        if (target?.classList?.contains('mes_text')) {
                            const messageNode = target.closest('.mes');
                            const isEditable = target.getAttribute('contenteditable') === 'true';

                            if (messageNode && !isEditable) {
                                // 清理可能残留的流式标记
                                const messageId = getStableMessageId(messageNode);
                                streamingState.activeMessages.delete(messageId);
                                delete messageNode.dataset.streaming;

                                //  清理“已处理”缓存，确保这条消息可再次识别
                                ScanSystem.state.processedMessages.delete(messageNode);

                                // 退出编辑后强制重扫，重新识别并转按钮
                                setTimeout(() => {
                                    processMessageForComfyButton(messageNode, true);
                                }, 80);
                            }
                        }
                    }
                }

                // 如果有新内容，触发稳定性检查
                if (hasNewContent) {
                    checkContentStability();
                }

            }, ScanSystem.config.throttleDelay);
        });

        // [Phase 1.4] startPeriodicCheck/stopPeriodicCheck removed - merged into incrementalScan

        //  启动优化后的监控系统
        chatObserver.observe(mainChat, {
            childList: true,
            subtree: true,
            characterData: true,
            characterDataOldValue: false,
            attributes: true,
            attributeFilter: ['contenteditable', 'class']
        });

        manualScan.setControls({
            scanNow: async () => {
                ScanSystem.state.processedMessages = new WeakSet();
                await ScanSystem.incrementalScan(mainChat);
            },
            start: () => startContinuousScan(mainChat),
            stop: stopContinuousScan,
        });

        //  页面可见性变化时强制扫描
        document.addEventListener('visibilitychange', async () => {
            if (!document.hidden) {
                if (!manualScan.isEnabled()) return;
                console.log('[AI Gen] 页面重新可见，执行强制扫描');
                ScanSystem.state.processedMessages = new WeakSet(); // 清空缓存
                await ScanSystem.incrementalScan(mainChat);
            }
        });

        // [Phase 1.3] Narrowed optionsObserver scope
        const optionsObserver = new MutationObserver(() => {
            const menu = document.getElementById('options');
            if (menu && menu.style.display !== 'none') {
                addMainButton();
            }
        });
        const optionsTarget = document.getElementById('options');
        if (optionsTarget) {
            optionsObserver.observe(optionsTarget, { attributes: true, attributeFilter: ['style'] });
        } else {
            // Fallback: watch body but only for childList to detect #options being added
            const bodyObserver = new MutationObserver(() => {
                const options = document.getElementById('options');
                if (options) {
                    bodyObserver.disconnect();
                    optionsObserver.observe(options, { attributes: true, attributeFilter: ['style'] });
                }
            });
            bodyObserver.observe(document.body, { childList: true, subtree: true });
        }

        console.log("[AI Gen Optimized] 脚本已成功初始化");
        showToast('info', 'SillyTavern图片生成器已就绪');

        console.log('[AI Gen] 流式输出优化已就绪，等待连接后启动扫描');
        console.log(`[AI Gen] 配置: 稳定延迟=${streamingState.config.stabilityDelay}ms, 检查间隔=${streamingState.config.checkInterval}ms`);
    }

    window.AI_Generator = {

        switchMode,
        currentMode: () => currentMode,
        generateWithComfyUI,
        generateWithWebUI,
        updateModeUI,
        MODES,

        //  强制刷新接口（使用新的扫描系统）
        forceRefreshAll: async () => {
            const mainChat = document.querySelector('#chat[data-show-hidden-reasoning="true"]') || document.querySelector('#chat');
            if (mainChat) {
                // 访问 initialize 函数内部的 ScanSystem（需要暴露）
                if (manualScan.hasControls()) {
                    await manualScan.scanNow();
                    showToast('success', '已触发强制扫描');
                } else {
                    console.error('[AI Gen] ScanSystem 未初始化');
                    showToast('error', '扫描系统未就绪');
                }
            }
        },

        //  扫描统计
        getScanStats: () => {
            if (window._AI_Gen_ScanSystem) {
                return {
                    totalScans: window._AI_Gen_ScanSystem.state.scanCount,
                    missedTags: window._AI_Gen_ScanSystem.state.missedCount,
                    lastScanTime: new Date(window._AI_Gen_ScanSystem.state.lastScanTime).toLocaleTimeString(),
                    currentInterval: window._AI_Gen_ScanSystem.getCurrentInterval(),
                    activeMessages: streamingState.activeMessages.size,
                    pendingQueue: streamingState.pendingQueue.size
                };
            }
            return { error: 'ScanSystem 未初始化' };
        },

        //  调整扫描频率
        setScanInterval: (idle, active, streaming) => {
            if (window._AI_Gen_ScanSystem) {
                window._AI_Gen_ScanSystem.config.idleInterval = idle || window._AI_Gen_ScanSystem.config.idleInterval;
                window._AI_Gen_ScanSystem.config.activeInterval = active || window._AI_Gen_ScanSystem.config.activeInterval;
                window._AI_Gen_ScanSystem.config.streamingInterval = streaming || window._AI_Gen_ScanSystem.config.streamingInterval;
                console.log('[AI Gen] 扫描间隔已更新:', window._AI_Gen_ScanSystem.config);
                showToast('success', '扫描配置已更新');
            } else {
                showToast('error', 'ScanSystem 未初始化');
            }
        }
    };
export function init() {
    if (initialized) return;
    initialized = true;

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
}
