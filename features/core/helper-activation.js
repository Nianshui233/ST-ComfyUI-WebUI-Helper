import {
    DEFAULT_SETTINGS,
    STORAGE_KEY_HELPER_ENABLED,
} from './runtime-config.js';

export function createHelperActivationController({
    getValue,
    setValue,
    manualScan,
    showToast,
    logger = console,
}) {
    let enabled = DEFAULT_SETTINGS.helperEnabled;
    let activated = false;
    let activateCallback = null;
    let scanTimer = null;

    function getToggle() {
        return document.getElementById('comfyui-helper-toggle');
    }

    function setToggleVisual(isEnabled) {
        const toggle = getToggle();
        document.body?.classList.toggle('comfy-helper-paused', !isEnabled);
        if (!toggle) return;

        toggle.dataset.settingType = 'boolean-button';
        toggle.dataset.storageKey = STORAGE_KEY_HELPER_ENABLED;
        toggle.setAttribute('aria-pressed', isEnabled ? 'true' : 'false');
        toggle.classList.toggle('is-on', isEnabled);
        toggle.classList.toggle('is-off', !isEnabled);
        toggle.title = isEnabled ? '点击后暂停聊天区绘图插件' : '点击后启用聊天区绘图插件';

        const label = toggle.querySelector('.helper-toggle-copy b');
        const hint = toggle.querySelector('.helper-toggle-copy small');
        if (label) label.textContent = isEnabled ? '插件已启用' : '插件已暂停';
        if (hint) hint.textContent = isEnabled ? '聊天区绘图控件开启' : '聊天区绘图控件隐藏';
    }

    function clearChatImageControls() {
        document.body?.classList.add('comfy-helper-paused');
    }

    function scheduleScan(delay = 80) {
        clearTimeout(scanTimer);
        scanTimer = setTimeout(async () => {
            scanTimer = null;
            if (!enabled || !manualScan.hasControls()) return;

            try {
                await manualScan.scanNow();
            } catch (error) {
                logger.error('[AI Gen] 插件启用后扫描聊天失败:', error);
            }
        }, delay);
    }

    async function setEnabled(nextEnabled, { silent = false, persist = true } = {}) {
        enabled = Boolean(nextEnabled);
        setToggleVisual(enabled);

        if (persist) {
            await setValue(STORAGE_KEY_HELPER_ENABLED, enabled);
        }

        if (!enabled) {
            clearTimeout(scanTimer);
            scanTimer = null;
            manualScan.stop();
            clearChatImageControls();
            if (!silent) showToast('info', '绘图插件已暂停，聊天区绘图控件已隐藏');
            return false;
        }

        const ok = await activateCallback?.();
        if (ok !== false && manualScan.hasControls()) {
            manualScan.start();
            scheduleScan();
        }

        if (!silent) showToast('success', '绘图插件已启用，正在扫描当前聊天');
        return ok !== false;
    }

    async function load() {
        enabled = await getValue(STORAGE_KEY_HELPER_ENABLED, DEFAULT_SETTINGS.helperEnabled);
        setToggleVisual(enabled);
        return enabled;
    }

    function bindToggle(button) {
        if (!button) return;
        button.dataset.settingType = 'boolean-button';
        button.dataset.storageKey = STORAGE_KEY_HELPER_ENABLED;
        setToggleVisual(enabled);
        button.addEventListener('click', () => {
            setEnabled(!enabled).catch(error => {
                logger.error('[AI Gen] 切换插件总开关失败:', error);
                showToast('error', error.message || String(error));
            });
        });
    }

    function setActivateCallback(callback) {
        activateCallback = callback;
    }

    function markActivated() {
        activated = true;
    }

    return {
        bindToggle,
        clearChatImageControls,
        isActivated: () => activated,
        isEnabled: () => enabled,
        load,
        markActivated,
        scheduleScan,
        setActivateCallback,
        setEnabled,
        setToggleVisual,
    };
}
