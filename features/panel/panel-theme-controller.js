import {
    DEFAULT_SETTINGS,
    STORAGE_KEY_UI_THEME,
} from '../core/runtime-config.js';

export const PANEL_THEMES = {
    nocturne: '夜间',
    daybreak: '日间',
    glacier: '冰川',
    sakura: '樱雨',
    forest: '森林',
    amber: '琥珀',
    terminal: '终端',
    wine: '酒红',
};

export function createPanelThemeController({
    inputs,
    setValue,
    logger = console,
}) {
    const themeInput = inputs.uiTheme;
    const toggle = document.getElementById('comfyui-theme-toggle');
    const menu = document.getElementById('comfyui-theme-menu');
    const currentLabel = document.getElementById('comfyui-theme-current');

    function normalizeTheme(theme) {
        return PANEL_THEMES[theme] ? theme : DEFAULT_SETTINGS.uiTheme;
    }

    function setMenuOpen(open) {
        if (!toggle || !menu) return;
        menu.hidden = !open;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function persistTheme(theme) {
        setValue?.(STORAGE_KEY_UI_THEME, theme)?.catch?.(error => {
            logger.warn('[AI Gen] 保存界面主题失败:', error);
        });
    }

    function applyTheme(theme, { persist = false } = {}) {
        const normalized = normalizeTheme(theme);
        document.documentElement.dataset.comfyTheme = normalized;
        if (themeInput) themeInput.value = normalized;
        if (currentLabel) currentLabel.textContent = PANEL_THEMES[normalized];
        menu?.querySelectorAll('[data-theme]').forEach(button => {
            button.classList.toggle('active', button.dataset.theme === normalized);
        });
        if (persist) {
            persistTheme(normalized);
        }
    }

    function init() {
        applyTheme(themeInput?.value || DEFAULT_SETTINGS.uiTheme);

        toggle?.addEventListener('click', (event) => {
            event.stopPropagation();
            setMenuOpen(menu?.hidden ?? true);
        });

        menu?.querySelectorAll('[data-theme]').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                applyTheme(button.dataset.theme, { persist: true });
                setMenuOpen(false);
            });
        });

        document.addEventListener('click', (event) => {
            if (!menu || menu.hidden) return;
            if (event.target.closest('#comfyui-theme-switcher')) return;
            setMenuOpen(false);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') setMenuOpen(false);
        });
    }

    return {
        applyTheme,
        init,
    };
}
