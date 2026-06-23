export function createImg2ImgController({
    showToast,
}) {
    const states = {
        comfyui: { enabled: false, imageData: null, fileName: null },
        webui: { enabled: false, imageData: null, fileName: null },
    };

    function getState(modeOrPrefix = 'comfyui') {
        const key = modeOrPrefix === 'webui' ? 'webui' : 'comfyui';
        return states[key];
    }

    function initListeners() {
        ['comfyui', 'webui'].forEach(prefix => {
            const enableCheckbox = document.getElementById(`${prefix}-img2img-enable`);
            const area = document.getElementById(`${prefix}-img2img-area`);
            const dropzone = document.getElementById(`${prefix}-img2img-dropzone`);
            const fileInput = document.getElementById(`${prefix}-img2img-file`);
            const preview = document.getElementById(`${prefix}-img2img-preview`);
            const clearButton = document.getElementById(`${prefix}-img2img-clear`);
            const img2imgState = getState(prefix);

            enableCheckbox?.addEventListener('change', () => {
                if (area) area.style.display = enableCheckbox.checked ? 'block' : 'none';
                img2imgState.enabled = enableCheckbox.checked;
            });

            dropzone?.addEventListener('click', () => fileInput?.click());
            dropzone?.addEventListener('dragover', e => {
                e.preventDefault();
                dropzone.style.borderColor = 'var(--vp-accent-color)';
            });
            dropzone?.addEventListener('dragleave', () => {
                dropzone.style.borderColor = 'var(--vp-border-color)';
            });
            dropzone?.addEventListener('drop', e => {
                e.preventDefault();
                dropzone.style.borderColor = 'var(--vp-border-color)';
                const file = e.dataTransfer.files[0];
                if (file) handleFile(prefix, file, preview);
            });
            fileInput?.addEventListener('change', (e) => {
                if (e.target.files[0]) handleFile(prefix, e.target.files[0], preview);
            });
            clearButton?.addEventListener('click', () => clearState(prefix));
        });
    }

    function syncEnabledFromInputs() {
        ['comfyui', 'webui'].forEach(prefix => {
            const enabled = document.getElementById(`${prefix}-img2img-enable`)?.checked || false;
            const area = document.getElementById(`${prefix}-img2img-area`);
            const state = getState(prefix);
            state.enabled = enabled;
            if (area) area.style.display = enabled ? 'block' : 'none';
        });
    }

    function handleFile(prefix, file, previewEl) {
        if (!file.type.startsWith('image/')) {
            showToast('error', '请上传图片文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img2imgState = getState(prefix);
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
                    renderPreview(prefix);
                };
                renderPreview(prefix);
            }
            showToast('success', '参考图片已加载');
        };
        reader.readAsDataURL(file);
    }

    function clearState(prefix) {
        const img2imgState = getState(prefix);
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

    function renderPreview(prefix) {
        const previewEl = document.getElementById(`${prefix}-img2img-preview`);
        const img2imgState = getState(prefix);
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

    return {
        clearState,
        getState,
        initListeners,
        renderPreview,
        syncEnabledFromInputs,
    };
}
