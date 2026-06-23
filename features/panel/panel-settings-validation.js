export function validatePanelSettings({ inputValidators, showToast }) {
    const errors = [];

    const comfyUrl = document.getElementById('comfyui-url').value.trim();
    const webuiUrl = document.getElementById('webui-url').value.trim();

    if (comfyUrl && !inputValidators.url(comfyUrl)) {
        errors.push('ComfyUI URL格式错误');
    }
    if (webuiUrl && !inputValidators.url(webuiUrl)) {
        errors.push('WebUI URL格式错误');
    }

    const apiImageUrl = document.getElementById('comfyui-api-image-url')?.value.trim();
    if (apiImageUrl && !inputValidators.url(apiImageUrl)) {
        errors.push('API 生图 Base URL格式错误');
    }

    const width = document.getElementById('comfyui-gen-width').value;
    const height = document.getElementById('comfyui-gen-height').value;

    if (width && !inputValidators.dimension(width)) {
        errors.push('生成宽度必须是64-8192之间且能被8整除的数字');
    }
    if (height && !inputValidators.dimension(height)) {
        errors.push('生成高度必须是64-8192之间且能被8整除的数字');
    }

    const cfg = document.getElementById('comfyui-cfg').value;
    if (cfg && !inputValidators.cfg(cfg)) {
        errors.push('CFG值应在1-30之间');
    }

    const steps = document.getElementById('comfyui-steps').value;
    if (steps && !inputValidators.steps(steps)) {
        errors.push('步数应在1-150之间');
    }

    if (errors.length > 0) {
        showToast('error', errors.join('\n'));
        return false;
    }

    return true;
}
