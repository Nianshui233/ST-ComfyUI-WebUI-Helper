export function getPanelFoundationStyles({ panelId, buttonId }) {
    return `
        /* =========================================================
           ComfyUI / WebUI Helper — Refined Studio UI
           Single token-driven design system. The --vp-* names are a
           public contract: panel-template.js and index.js reference
           them inline, so the names are preserved (values retuned).
           Element selectors stay scoped to #${panelId} so SillyTavern's
           own UI is never restyled; shared in-chat components (buttons,
           image cards, AI panel, progress, tooltip) remain global.
           ========================================================= */

        :root {
            /* Surfaces */
            --vp-bg-color: rgba(15, 17, 21, 0.97);
            --vp-panel-color: rgba(26, 29, 34, 0.92);
            --vp-panel-color-strong: rgba(32, 36, 42, 0.985);
            --vp-surface-1: rgba(255, 255, 255, 0.035);
            --vp-surface-2: rgba(255, 255, 255, 0.06);
            --vp-surface-sunken: rgba(7, 9, 11, 0.5);
            --vp-rail-bg: rgba(0, 0, 0, 0.22);

            /* Accent (teal / mint) */
            --vp-accent-color: #66d7c7;
            --vp-accent-strong: #8ee6dc;
            --vp-accent-soft: rgba(102, 215, 199, 0.14);
            --vp-accent-border: rgba(102, 215, 199, 0.36);
            --vp-glow-color: rgba(102, 215, 199, 0.24);

            /* Text */
            --vp-text-color: #f3efe6;
            --vp-text-muted: #a6a9a6;
            --vp-text-dim: #767971;

            /* Lines */
            --vp-border-color: rgba(244, 235, 214, 0.12);
            --vp-border-strong: rgba(244, 235, 214, 0.22);

            /* Semantic */
            --vp-error-color: #ff6f61;
            --vp-success-color: #73d48f;
            --vp-warning-color: #e9b44c;
            --vp-comfyui-color: #66d7c7;
            --vp-webui-color: #e9b44c;
            --vp-api-color: #9cc7ff;

            --vp-font: 'Segoe UI Variable', 'Microsoft YaHei UI', 'Segoe UI', 'Roboto', system-ui, sans-serif;

            /* Spacing scale (4px base) */
            --vp-space-1: 4px;
            --vp-space-2: 8px;
            --vp-space-3: 12px;
            --vp-space-4: 16px;
            --vp-space-5: 20px;
            --vp-space-6: 24px;
            --vp-space-8: 32px;

            /* Radius */
            --vp-radius-sm: 6px;
            --vp-radius-md: 8px;
            --vp-radius-lg: 12px;
            --vp-radius-pill: 999px;

            /* Elevation */
            --vp-shadow-1: 0 1px 2px rgba(0, 0, 0, 0.32);
            --vp-shadow-2: 0 10px 28px rgba(0, 0, 0, 0.28);
            --vp-shadow-pop: 0 24px 70px rgba(0, 0, 0, 0.62);

            /* Motion */
            --vp-ease: cubic-bezier(0.2, 0.7, 0.3, 1);
            --vp-dur-fast: 0.14s;
            --vp-dur: 0.22s;

            /* Layout */
            --vp-rail-w: 244px;
            --vp-rail-top: 84px;
        }

        /* ---------- Panel shell ---------- */
        #${panelId} {
            display: none;
            position: fixed;
            top: 18px;
            right: 18px;
            bottom: 18px;
            left: 18px;
            width: calc(100vw - 36px);
            height: calc(100vh - 36px);
            max-width: none;
            max-height: none;
            z-index: 10000;
            box-sizing: border-box;
            flex-direction: column;
            overflow: hidden;
            padding: 0;
            color: var(--vp-text-color);
            font-family: var(--vp-font);
            border: 1px solid var(--vp-border-strong);
            border-radius: var(--vp-radius-lg);
            background:
                linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0) 40%),
                radial-gradient(120% 80% at 0% 0%, rgba(102, 215, 199, 0.05), transparent 60%),
                var(--vp-bg-color);
            box-shadow: var(--vp-shadow-pop);
            backdrop-filter: blur(18px) saturate(1.06);
            -webkit-backdrop-filter: blur(18px) saturate(1.06);
            animation: comfy-panel-in var(--vp-dur) var(--vp-ease);
        }

        /* ---------- Scrollbars (panel-wide) ---------- */
        #${panelId} *::-webkit-scrollbar { width: 10px; height: 10px; }
        #${panelId} *::-webkit-scrollbar-track { background: transparent; }
        #${panelId} *::-webkit-scrollbar-thumb {
            background: rgba(244, 235, 214, 0.14);
            border: 2px solid transparent;
            border-radius: var(--vp-radius-pill);
            background-clip: padding-box;
        }
        #${panelId} *::-webkit-scrollbar-thumb:hover {
            background: var(--vp-accent-border);
            background-clip: padding-box;
        }
        #${panelId} { scrollbar-width: thin; scrollbar-color: rgba(244, 235, 214, 0.18) transparent; }

        /* ---------- Header / control bar ---------- */
        #${panelId} .panel-control-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--vp-space-4);
            min-height: 64px;
            margin: 0;
            padding: 14px 18px 13px;
            flex-shrink: 0;
            position: relative;
            border-bottom: 1px solid var(--vp-border-color);
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01));
        }

        #${panelId} .panel-title-group {
            display: inline-flex;
            align-items: center;
            gap: var(--vp-space-3);
            min-width: 0;
        }

        #${panelId} .panel-title-copy {
            display: grid;
            gap: 2px;
            min-width: 0;
        }

        #${panelId} .panel-control-bar b {
            margin: 0;
            color: var(--vp-text-color);
            font-size: 17px;
            font-weight: 700;
            line-height: 1.2;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        #${panelId} .panel-title-copy span {
            color: var(--vp-text-muted);
            font-size: 11px;
            letter-spacing: 0.2px;
            text-transform: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        #${panelId} .panel-header-actions {
            display: inline-flex;
            align-items: center;
            gap: var(--vp-space-2);
            flex-shrink: 0;
        }

        #${panelId} .helper-master-toggle {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            min-width: 174px;
            height: 38px;
            padding: 5px 11px 5px 8px;
            cursor: pointer;
            color: var(--vp-text-muted);
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(255, 255, 255, 0.035);
            transition: color var(--vp-dur-fast), border-color var(--vp-dur-fast), background var(--vp-dur-fast), box-shadow var(--vp-dur-fast);
        }

        #${panelId} .helper-master-toggle:hover {
            color: var(--vp-text-color);
            border-color: var(--vp-border-strong);
            background: rgba(255, 255, 255, 0.055);
        }

        #${panelId} .helper-master-toggle:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px var(--vp-glow-color);
        }

        #${panelId} .helper-toggle-track {
            position: relative;
            width: 34px;
            height: 18px;
            flex: 0 0 auto;
            border-radius: var(--vp-radius-pill);
            background: rgba(255, 111, 97, 0.22);
            border: 1px solid rgba(255, 111, 97, 0.35);
            transition: background var(--vp-dur-fast), border-color var(--vp-dur-fast);
        }

        #${panelId} .helper-toggle-knob {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 12px;
            height: 12px;
            border-radius: var(--vp-radius-pill);
            background: #f5d3ce;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.42);
            transition: transform var(--vp-dur-fast) var(--vp-ease), background var(--vp-dur-fast);
        }

        #${panelId} .helper-master-toggle.is-on .helper-toggle-track {
            background: rgba(102, 215, 199, 0.24);
            border-color: var(--vp-accent-border);
        }

        #${panelId} .helper-master-toggle.is-on .helper-toggle-knob {
            transform: translateX(16px);
            background: var(--vp-accent-strong);
        }

        #${panelId} .helper-toggle-copy {
            display: grid;
            gap: 1px;
            min-width: 0;
            text-align: left;
        }

        #${panelId} .helper-toggle-copy b {
            font-size: 12px;
            line-height: 1.05;
            font-weight: 750;
            color: var(--vp-text-color);
        }

        #${panelId} .helper-toggle-copy small {
            font-size: 10px;
            line-height: 1.1;
            color: var(--vp-text-dim);
            white-space: nowrap;
        }

        #${panelId} .floating_panel_close {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            flex-shrink: 0;
            padding: 0;
            cursor: pointer;
            color: var(--vp-text-muted);
            font-size: 18px;
            line-height: 1;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(255, 255, 255, 0.035);
            transition: color var(--vp-dur-fast), border-color var(--vp-dur-fast), background var(--vp-dur-fast);
        }

        #${panelId} .floating_panel_close:hover {
            color: #fff;
            border-color: rgba(255, 111, 97, 0.5);
            background: rgba(255, 111, 97, 0.14);
        }

        #${panelId} .floating_panel_close:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px rgba(255, 111, 97, 0.25);
        }

        /* ---------- Content grid + sidebar layout ---------- */
        #${panelId} .comfyui-panel-content {
            display: grid;
            grid-template-columns: var(--vp-rail-w) minmax(0, 1fr);
            grid-template-rows: auto minmax(0, 1fr);
            gap: 0;
            flex-grow: 1;
            min-height: 0;
            padding: 0;
            overflow: hidden;
        }

        #${panelId} .mode-switch-container {
            grid-column: 1;
            grid-row: 1;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: var(--vp-space-3);
            margin: 0;
            padding: 16px 16px 12px;
            border: 0;
            border-right: 1px solid var(--vp-border-color);
            border-radius: 0;
            background: var(--vp-rail-bg);
        }

        #${panelId} .mode-switch {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 3px;
            width: 100%;
            padding: 3px;
            overflow: hidden;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(255, 255, 255, 0.035);
        }

        #${panelId} .mode-switch-option {
            min-width: 0;
            padding: 9px 10px;
            cursor: pointer;
            border: none;
            border-radius: var(--vp-radius-sm);
            background: transparent;
            color: var(--vp-text-muted);
            font: 600 12px/1 var(--vp-font);
            transition: color var(--vp-dur-fast), background var(--vp-dur-fast), box-shadow var(--vp-dur-fast);
        }

        #${panelId} .mode-switch-option:hover:not(.active) {
            color: var(--vp-text-color);
            background: rgba(255, 255, 255, 0.06);
        }

        #${panelId} .mode-switch-option.active.comfyui {
            color: #0c1310;
            background: var(--vp-accent-color);
            box-shadow: 0 4px 16px rgba(102, 215, 199, 0.24);
        }

        #${panelId} .mode-switch-option.active.webui {
            color: #171207;
            background: var(--vp-warning-color);
            box-shadow: 0 4px 16px rgba(233, 180, 76, 0.22);
        }

        #${panelId} .mode-switch-option.active.api {
            color: #07111e;
            background: var(--vp-api-color);
            box-shadow: 0 4px 16px rgba(156, 199, 255, 0.22);
        }

        #${panelId} .mode-status {
            width: 100%;
            color: var(--vp-text-muted);
            font-size: 12px;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* Tab container overlays the content grid so the left rail (tab
           buttons) sits under the mode switch while tab panels fill the
           right column. pointer-events lets clicks through the inert grid. */
        #${panelId} .tab-container {
            grid-column: 1 / -1;
            grid-row: 1 / -1;
            display: grid;
            grid-template-columns: var(--vp-rail-w) minmax(0, 1fr);
            min-height: 0;
            margin: 0;
            pointer-events: none;
        }

        #${panelId} .tab-buttons {
            grid-column: 1;
            align-self: stretch;
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin: var(--vp-rail-top) 0 0;
            padding: 0 12px 16px;
            border: 0;
            border-right: 1px solid var(--vp-border-color);
            background: var(--vp-rail-bg);
            overflow-y: auto;
            pointer-events: auto;
        }

        #${panelId} .tab-button {
            display: flex !important;
            align-items: center;
            gap: 10px;
            width: 100%;
            min-height: 40px;
            padding: 9px 11px;
            cursor: pointer;
            text-align: left;
            white-space: normal;
            color: var(--vp-text-muted);
            font: 600 13px/1.2 var(--vp-font);
            border: 1px solid transparent;
            border-radius: var(--vp-radius-md);
            background: transparent;
            transition: color var(--vp-dur-fast), background var(--vp-dur-fast), border-color var(--vp-dur-fast), box-shadow var(--vp-dur-fast);
        }

        #${panelId} .tab-button[style*="display: none"] { display: none !important; }

        #${panelId} .tab-button i {
            width: 16px;
            text-align: center;
            opacity: 0.82;
            color: var(--vp-text-muted);
            transition: color var(--vp-dur-fast);
        }

        #${panelId} .tab-button:hover:not(.active) {
            color: var(--vp-text-color);
            border-color: rgba(255, 255, 255, 0.09);
            background: rgba(255, 255, 255, 0.05);
        }

        #${panelId} .tab-button.active {
            color: var(--vp-text-color);
            border-color: var(--vp-border-strong);
            background: linear-gradient(135deg, rgba(102, 215, 199, 0.18), rgba(255, 255, 255, 0.035));
            box-shadow: inset 3px 0 0 var(--vp-accent-color);
        }

        #${panelId} .tab-button.active i { color: var(--vp-accent-color); }

        #${panelId} .tab-button:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px var(--vp-glow-color);
        }

        #${panelId} .tab-content {
            grid-column: 2;
            min-width: 0;
            min-height: 0;
            padding: 20px 22px 28px;
            overflow-y: auto;
            pointer-events: auto;
        }

        #${panelId} .tab-content { display: none; }
        #${panelId} .tab-content.active {
            display: block !important;
            animation: comfy-fade-in var(--vp-dur) var(--vp-ease);
        }
        #${panelId} .tab-content:not(.active) { display: none !important; }
        #${panelId} .tab-content.comfyui-settings.hidden { display: none !important; }
        #${panelId} .tab-content.webui-settings:not(.active) { display: none !important; }
        #${panelId} .tab-content.api-settings:not(.active) { display: none !important; }

        /* ---------- Form controls ---------- */
        #${panelId} input[type="text"],
        #${panelId} input[type="password"],
        #${panelId} input[type="number"],
        #${panelId} select,
        #${panelId} textarea {
            width: 100%;
            box-sizing: border-box;
            min-height: 38px;
            padding: 9px 12px;
            color: var(--vp-text-color);
            font-family: var(--vp-font);
            font-size: 13px;
            border: 1px solid var(--vp-border-strong);
            border-radius: var(--vp-radius-md);
            background: var(--vp-surface-sunken);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
            transition: border-color var(--vp-dur-fast), box-shadow var(--vp-dur-fast), background var(--vp-dur-fast);
        }

        #${panelId} input[type="text"]:hover,
        #${panelId} input[type="password"]:hover,
        #${panelId} input[type="number"]:hover,
        #${panelId} select:hover,
        #${panelId} textarea:hover {
            border-color: rgba(244, 235, 214, 0.3);
        }

        #${panelId} input:focus,
        #${panelId} select:focus,
        #${panelId} textarea:focus {
            outline: none;
            border-color: var(--vp-accent-color);
            box-shadow: 0 0 0 3px var(--vp-glow-color), inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        #${panelId} input::placeholder,
        #${panelId} textarea::placeholder { color: var(--vp-text-dim); }

        #${panelId} select option { background: #1a1d22; color: var(--vp-text-color); }

        #${panelId} textarea {
            min-height: 84px;
            line-height: 1.52;
            resize: vertical;
            margin-top: var(--vp-space-1);
        }

        #${panelId} input[type="checkbox"] {
            width: auto;
            min-height: 0;
            accent-color: var(--vp-accent-color);
            cursor: pointer;
        }

        #${panelId} label {
            display: block;
            margin-bottom: 6px;
            color: var(--vp-text-muted);
            font-size: 11px;
            font-weight: 650;
            letter-spacing: 0.2px;
            text-transform: none;
        }
`;
}
