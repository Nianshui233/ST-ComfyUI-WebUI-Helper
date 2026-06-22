export function getPanelStyles({ panelId, buttonId }) {
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
            grid-template-columns: 1fr 1fr;
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

        /* ---------- Buttons (shared: panel + in-chat) ---------- */
        .comfy-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            min-height: 36px;
            padding: 8px 14px;
            flex-shrink: 0;
            cursor: pointer;
            color: var(--vp-accent-strong);
            font: 600 13px/1 var(--vp-font);
            text-shadow: none;
            border: 1px solid var(--vp-accent-border);
            border-radius: var(--vp-radius-md);
            background: var(--vp-accent-soft);
            transition: color var(--vp-dur-fast) var(--vp-ease),
                        background var(--vp-dur-fast) var(--vp-ease),
                        border-color var(--vp-dur-fast) var(--vp-ease),
                        box-shadow var(--vp-dur-fast) var(--vp-ease),
                        transform var(--vp-dur-fast) var(--vp-ease);
            -webkit-user-select: none;
            user-select: none;
        }

        .comfy-button:hover:not(:disabled) {
            color: #0c1310;
            border-color: var(--vp-accent-color);
            background: var(--vp-accent-color);
            box-shadow: 0 6px 18px var(--vp-glow-color);
            transform: translateY(-1px);
        }

        .comfy-button:active:not(:disabled) {
            transform: translateY(0);
            box-shadow: none;
        }

        .comfy-button:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px var(--vp-glow-color);
        }

        .comfy-button:disabled { opacity: 0.45; cursor: not-allowed; }

        .comfy-button.testing {
            color: #fff;
            border-color: rgba(243, 156, 18, 0.55);
            background: rgba(243, 156, 18, 0.2);
        }

        .comfy-button.success {
            color: #d6ffe3;
            border-color: rgba(115, 212, 143, 0.45);
            background: rgba(115, 212, 143, 0.12);
        }
        .comfy-button.success:hover:not(:disabled) { color: #07140c; background: var(--vp-success-color); box-shadow: 0 6px 18px rgba(115, 212, 143, 0.2); }

        .comfy-button.error {
            color: #ffd8d3;
            border-color: rgba(255, 111, 97, 0.45);
            background: rgba(255, 111, 97, 0.12);
        }
        .comfy-button.error:hover:not(:disabled) { color: #1a0f0e; background: var(--vp-error-color); box-shadow: 0 6px 18px rgba(255, 111, 97, 0.22); }

        .comfy-button.warning {
            color: #ffe8ad;
            border-color: rgba(233, 180, 76, 0.46);
            background: rgba(233, 180, 76, 0.12);
        }
        .comfy-button.warning:hover:not(:disabled) { color: #171207; background: var(--vp-warning-color); box-shadow: 0 6px 18px rgba(233, 180, 76, 0.2); }

        #comfyui-refresh-models,
        #comfyui-refresh-unets,
        #webui-refresh-models,
        #webui-refresh-loras {
            min-width: 40px;
            padding: 8px;
            line-height: 1;
        }

        .comfy-button-group {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin: 5px 4px;
        }

        /* ---------- Layout helpers ---------- */
        .comfy-input-group {
            display: flex;
            gap: var(--vp-space-2);
            align-items: center;
        }

        #${panelId} .comfy-inline-actions {
            display: flex;
            align-items: end;
            gap: var(--vp-space-2);
            flex-wrap: wrap;
        }

        #${panelId} .comfy-inline-actions .comfy-button { min-width: 74px; }

        .comfy-settings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 14px;
            margin-bottom: var(--vp-space-4);
        }

        .comfy-prompt-area { margin-bottom: var(--vp-space-4); }

        /* ---------- Cards (fieldset / tool / prompt / selection) ---------- */
        #${panelId} fieldset,
        #${panelId} .workflow-tools,
        #${panelId} .comfy-prompt-area,
        #${panelId} .selected-loras,
        #${panelId} .selected-embeddings,
        #${panelId} .prompt-preset-container {
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        #${panelId} fieldset,
        #${panelId} .workflow-tools,
        #${panelId} .comfy-prompt-area {
            padding: var(--vp-space-4);
            margin-bottom: var(--vp-space-4);
        }

        #${panelId} legend {
            padding: 0 var(--vp-space-2);
            color: var(--vp-text-color);
            font-size: 13px;
            font-weight: 700;
        }

        #${panelId} .workflow-tools h4,
        #${panelId} .selected-loras h4,
        #${panelId} .selected-embeddings h4,
        #${panelId} .cache-toolbar h4 {
            margin: 0 0 var(--vp-space-3);
            color: var(--vp-text-color);
            font-size: 13px;
            font-weight: 700;
        }

        #${panelId} .workflow-info,
        #${panelId} .comfy-hint,
        #${panelId} .cache-stats {
            color: var(--vp-text-muted);
        }

        #${panelId} .workflow-info {
            margin: var(--vp-space-1) 0 var(--vp-space-4);
            padding-left: var(--vp-space-2);
            font-size: 0.9em;
            border-left: 2px solid var(--vp-accent-border);
        }

        /* ---------- Toggle / checkbox rows ---------- */
        #${panelId} .comfy-auto-generate-container { margin: var(--vp-space-4) 0; }

        #${panelId} .comfy-auto-generate-label {
            display: flex;
            align-items: center;
            gap: var(--vp-space-3);
            padding: 11px 12px;
            cursor: pointer;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(255, 255, 255, 0.028);
            transition: border-color var(--vp-dur-fast), background var(--vp-dur-fast);
        }

        #${panelId} .comfy-auto-generate-label:hover {
            border-color: var(--vp-accent-border);
            background: var(--vp-accent-soft);
        }

        #${panelId} .comfy-auto-generate-label input[type="checkbox"] { transform: scale(1.25); }

        #${panelId} .comfy-auto-generate-label b {
            color: var(--vp-text-color);
            font-size: 13px;
            text-transform: none;
            letter-spacing: 0;
        }

        #${panelId} .comfy-auto-generate-label span {
            color: var(--vp-text-muted);
            font-size: 0.9em;
            font-weight: normal;
            text-transform: none;
            letter-spacing: 0;
        }

        /* ---------- Size presets / img2img ---------- */
        .comfy-size-preset-btn { min-width: auto; padding: 4px 9px; font-size: 11px; }

        .img2img-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: var(--vp-space-3);
        }

        .comfy-dropzone {
            margin-top: var(--vp-space-3);
            padding: 20px;
            text-align: center;
            cursor: pointer;
            color: var(--vp-text-muted);
            border: 2px dashed var(--vp-border-strong);
            border-radius: var(--vp-radius-md);
            background: rgba(255, 255, 255, 0.018);
            transition: border-color var(--vp-dur-fast), background var(--vp-dur-fast), color var(--vp-dur-fast);
        }
        .comfy-dropzone:hover {
            color: var(--vp-text-color);
            border-color: var(--vp-accent-border);
            background: var(--vp-accent-soft);
        }

        .img2img-preview-card {
            display: grid;
            grid-template-columns: 120px minmax(0, 1fr);
            gap: var(--vp-space-3);
            align-items: center;
            padding: var(--vp-space-3);
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(7, 9, 11, 0.42);
        }

        .img2img-preview-card img {
            width: 120px;
            height: 120px;
            object-fit: contain;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-sm);
            background: rgba(0, 0, 0, 0.25);
        }

        .img2img-preview-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 600;
        }

        .img2img-preview-meta {
            margin-top: var(--vp-space-1);
            color: var(--vp-text-muted);
            font-size: 0.85em;
        }

        /* ---------- Workflow tab ---------- */
        .workflow-action-row {
            display: flex;
            flex-wrap: wrap;
            gap: var(--vp-space-2);
            margin: var(--vp-space-3) 0 14px;
        }
        .workflow-action-row .comfy-button { flex: 1 1 150px; }

        .placeholder-toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: var(--vp-space-2);
            margin: var(--vp-space-2) 0 var(--vp-space-3);
        }
        .placeholder-toolbar .comfy-button { padding: 6px 9px; font-size: 12px; min-height: 30px; }

        .workflow-analysis-result {
            margin-top: var(--vp-space-3);
            padding: var(--vp-space-3);
            font-size: 0.86em;
            line-height: 1.5;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(7, 9, 11, 0.42);
        }
        .workflow-analysis-title { margin-bottom: 6px; color: var(--vp-accent-color); font-weight: 700; }
        .workflow-analysis-lines {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 4px 14px;
        }
        .workflow-analysis-warnings { margin-top: var(--vp-space-2); color: var(--vp-warning-color); }

        .workflow-selector-container { display: flex; flex-direction: column; margin-bottom: var(--vp-space-5); }
        .workflow-search-container { margin-bottom: var(--vp-space-4); }
        #${panelId} .workflow-search-input { width: 100%; }

        .workflow-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--vp-space-3);
            margin-bottom: var(--vp-space-2);
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(7, 9, 11, 0.42);
            transition: border-color var(--vp-dur-fast), background var(--vp-dur-fast);
        }
        .workflow-item:hover { border-color: var(--vp-accent-border); background: var(--vp-accent-soft); }
        .workflow-item.active { border-color: rgba(102, 215, 199, 0.5); background: rgba(102, 215, 199, 0.1); }

        .workflow-item-title {
            flex: 1;
            padding-right: var(--vp-space-3);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: pointer;
        }
        .workflow-item-title:hover { color: var(--vp-accent-color); }
        .workflow-item-actions { display: flex; gap: var(--vp-space-2); }
        .workflow-item-actions button { padding: 5px 10px; font-size: 12px; min-height: 30px; }
        .workflow-item.editing .workflow-item-title { display: none; }
        .workflow-item.editing .workflow-edit-input { display: block; }
        .workflow-edit-input { display: none; flex: 1; margin-right: var(--vp-space-3); }

        .empty-workflows-message { padding: var(--vp-space-5); text-align: center; font-style: italic; color: var(--vp-text-dim); }

        .edit-mode-toolbar {
            display: none;
            margin-bottom: var(--vp-space-4);
            padding: var(--vp-space-3);
            border: 1px solid var(--vp-accent-border);
            border-radius: var(--vp-radius-md);
            background: var(--vp-accent-soft);
        }
        .edit-mode-toolbar.active { display: block; }
        .edit-mode-toolbar .toolbar-title { margin-bottom: var(--vp-space-3); color: var(--vp-accent-color); font-weight: 700; }

        /* ---------- Modals (rendered outside the panel: keep self-contained) ---------- */
        .workflow-save-modal {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10001;
            width: min(440px, calc(100vw - 32px));
            padding: var(--vp-space-5);
            color: var(--vp-text-color);
            font-family: var(--vp-font);
            border: 1px solid var(--vp-border-strong);
            border-radius: var(--vp-radius-lg);
            background: var(--vp-panel-color-strong);
            box-shadow: var(--vp-shadow-pop), 0 0 0 100vmax rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
            animation: comfy-pop-in var(--vp-dur) var(--vp-ease);
        }
        .workflow-save-modal h3 { margin-top: 0; color: var(--vp-text-color); }
        .workflow-save-modal label { display: block; margin-bottom: 6px; color: var(--vp-text-muted); font-size: 11px; font-weight: 650; }
        .workflow-save-modal input {
            width: 100%;
            box-sizing: border-box;
            min-height: 38px;
            margin-bottom: var(--vp-space-3);
            padding: 9px 12px;
            color: var(--vp-text-color);
            font-family: var(--vp-font);
            font-size: 13px;
            border: 1px solid var(--vp-border-strong);
            border-radius: var(--vp-radius-md);
            background: var(--vp-surface-sunken);
            transition: border-color var(--vp-dur-fast), box-shadow var(--vp-dur-fast);
        }
        .workflow-save-modal input:focus { outline: none; border-color: var(--vp-accent-color); box-shadow: 0 0 0 3px var(--vp-glow-color); }
        .workflow-save-modal .modal-actions { display: flex; gap: var(--vp-space-2); margin-top: var(--vp-space-5); justify-content: flex-end; }
        .workflow-save-modal .overwrite-warning {
            margin: var(--vp-space-3) 0;
            padding: var(--vp-space-3);
            color: var(--vp-warning-color);
            border: 1px solid rgba(233, 180, 76, 0.42);
            border-radius: var(--vp-radius-md);
            background: rgba(233, 180, 76, 0.09);
        }

        /* ---------- Mode-scoped show/hide ---------- */
        .webui-settings { display: none; }
        .webui-settings.active { display: block; }
        .comfyui-settings { display: block; }
        .comfyui-settings.hidden { display: none; }

        /* ---------- LoRA selector ---------- */
        .lora-selector { margin-bottom: var(--vp-space-5); }

        .comfy-lora-toolbar {
            display: grid;
            grid-template-columns: minmax(180px, 1fr) 160px auto;
            gap: var(--vp-space-2);
            align-items: center;
            margin-bottom: var(--vp-space-3);
        }

        .lora-bulk-panel {
            display: grid;
            grid-template-columns: 120px 120px repeat(3, auto);
            gap: var(--vp-space-2);
            align-items: end;
            margin-bottom: var(--vp-space-3);
            padding: var(--vp-space-3);
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(7, 9, 11, 0.42);
        }
        .lora-bulk-panel label { font-size: 0.78em; color: var(--vp-text-muted); }

        .lora-action-row { display: flex; flex-wrap: wrap; gap: var(--vp-space-2); margin-bottom: var(--vp-space-3); }

        .lora-options-row {
            display: flex;
            flex-wrap: wrap;
            gap: var(--vp-space-2) var(--vp-space-3);
            align-items: center;
            margin-bottom: var(--vp-space-3);
            padding: 9px 10px;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(7, 9, 11, 0.38);
        }
        .lora-options-row label { display: inline-flex; align-items: center; gap: 5px; margin: 0; font-size: 0.84em; color: var(--vp-text-color); }
        #${panelId} .lora-options-row select {
            width: auto !important;
            min-width: 108px;
            min-height: 32px !important;
            padding: 5px 8px !important;
            font-size: 0.84em !important;
        }

        .lora-list,
        .embedding-list {
            overflow-y: auto;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(7, 9, 11, 0.38);
        }
        .lora-list { max-height: 42vh; }
        .embedding-list { max-height: 200px; }

        .lora-group-header {
            position: sticky;
            top: 0;
            z-index: 1;
            padding: 6px 12px;
            color: var(--vp-accent-strong);
            font-size: 0.78em;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            background: rgba(102, 215, 199, 0.14);
            border-bottom: 1px solid var(--vp-border-color);
            -webkit-backdrop-filter: blur(6px);
            backdrop-filter: blur(6px);
        }

        .lora-item,
        .embedding-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--vp-space-2) var(--vp-space-3);
            border-bottom: 1px solid var(--vp-border-color);
            transition: background var(--vp-dur-fast);
        }
        .lora-item:last-child,
        .embedding-item:last-child { border-bottom: none; }
        .lora-item:hover,
        .embedding-item:hover { background: var(--vp-accent-soft); }

        .lora-info,
        .embedding-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .lora-name,
        .embedding-name { font-size: 0.9em; font-weight: 600; }
        .lora-alias { font-size: 0.8em; color: var(--vp-text-muted); }
        .lora-controls,
        .embedding-controls { display: flex; align-items: center; gap: var(--vp-space-3); }
        .lora-weight,
        .embedding-weight { width: 64px; padding: 4px 6px; font-size: 0.8em; }
        .lora-checkbox,
        .embedding-checkbox { transform: scale(1.2); accent-color: var(--vp-accent-color); }

        .selected-loras,
        .selected-embeddings { margin-top: var(--vp-space-3); padding: var(--vp-space-3); }
        .selected-loras h4,
        .selected-embeddings h4 { margin: 0 0 var(--vp-space-3); font-size: 0.9em; color: var(--vp-text-color); }
        .selected-loras h4 span { color: var(--vp-text-muted); font-weight: 500; }

        .selected-lora-row {
            display: grid;
            grid-template-columns: 1fr;
            gap: 6px;
            padding: var(--vp-space-2) 0;
            border-bottom: 1px solid var(--vp-border-color);
        }
        .selected-lora-row:last-child { border-bottom: none; }
        .selected-lora-row.disabled { opacity: 0.55; }
        .selected-lora-main {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) 70px 70px auto auto;
            gap: var(--vp-space-2);
            align-items: center;
        }
        .selected-lora-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.88em; font-weight: 600; }
        .selected-lora-remove { padding: 4px 8px; min-height: 28px; font-size: 0.8em; }
        .selected-lora-order { display: inline-flex; gap: 4px; }
        .selected-lora-order-btn { width: 28px; min-height: 28px; padding: 0; font-size: 12px; }
        .selected-lora-triggers {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: var(--vp-space-2);
            align-items: center;
            padding-left: 26px;
        }
        #${panelId} .selected-lora-trigger-input { min-height: 30px !important; padding: 5px 8px !important; font-size: 12px !important; }
        .selected-lora-trigger-toggle { display: inline-flex; align-items: center; gap: 4px; color: var(--vp-text-muted); font-size: 0.78em; white-space: nowrap; }

        .selected-lora-tag,
        .selected-embedding-tag {
            display: inline-block;
            margin: 2px;
            padding: 4px 8px;
            color: #101417;
            font-size: 0.8em;
            border-radius: var(--vp-radius-sm);
            background: var(--vp-accent-color);
        }
        .selected-embedding-tag { background: var(--vp-warning-color); }
        .selected-lora-tag .remove,
        .selected-embedding-tag .remove { margin-left: 5px; cursor: pointer; font-weight: bold; }
        .selected-lora-tag .remove:hover,
        .selected-embedding-tag .remove:hover { color: var(--vp-error-color); }

        .embedding-selector { margin-bottom: var(--vp-space-5); }

        /* ---------- Image cache ---------- */
        .cache-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
            gap: var(--vp-space-4);
            max-height: 60vh;
            overflow-y: auto;
            padding: var(--vp-space-3);
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(7, 9, 11, 0.34);
        }

        .cache-item {
            overflow: hidden;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: var(--vp-surface-1);
            transition: transform var(--vp-dur) var(--vp-ease), box-shadow var(--vp-dur), border-color var(--vp-dur);
        }
        .cache-item:hover {
            transform: translateY(-3px);
            border-color: var(--vp-accent-border);
            box-shadow: var(--vp-shadow-2);
        }
        .cache-item-image { width: 100%; height: 150px; object-fit: cover; cursor: pointer; }
        .cache-item-info { padding: var(--vp-space-3); }
        .cache-item-prompt {
            margin-bottom: var(--vp-space-2);
            max-height: 40px;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--vp-text-color);
            font-size: 0.8em;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
        .cache-item-meta { margin-bottom: var(--vp-space-3); color: var(--vp-text-dim); font-size: 0.7em; }
        .cache-item-actions { display: flex; gap: var(--vp-space-2); }
        .cache-item-actions .comfy-button { flex: 1; min-height: 30px; padding: 5px 8px; font-size: 0.75em; }
        .cache-empty { padding: 40px 20px; text-align: center; color: var(--vp-text-dim); font-style: italic; }

        .cache-image-modal {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 10002;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 0, 0.9);
            -webkit-backdrop-filter: blur(6px);
            backdrop-filter: blur(6px);
        }
        .cache-image-modal img { max-width: 90%; max-height: 90%; border-radius: var(--vp-radius-md); box-shadow: var(--vp-shadow-pop); }
        .cache-modal-close { position: absolute; top: 20px; right: 30px; z-index: 10003; color: #fff; font-size: 2em; cursor: pointer; }

        .prompt-preset-container { margin-bottom: var(--vp-space-4); padding: var(--vp-space-4); }
        .prompt-preset-controls { display: flex; gap: var(--vp-space-2); align-items: center; margin-bottom: var(--vp-space-3); }
        .prompt-preset-controls select { flex: 1; }
        .prompt-preset-controls button { flex-shrink: 0; min-width: 80px; }

        /* ---------- Connection status dot ---------- */
        .comfy-conn-status {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            vertical-align: middle;
            border: 2px solid rgba(255, 255, 255, 0.18);
            transition: background-color var(--vp-dur), box-shadow var(--vp-dur);
        }
        .comfy-conn-status.connected { background: var(--vp-success-color); box-shadow: 0 0 0 4px rgba(115, 212, 143, 0.14); }
        .comfy-conn-status.disconnected { background: var(--vp-error-color); box-shadow: 0 0 0 4px rgba(255, 111, 97, 0.13); }
        .comfy-conn-status.checking { background: var(--vp-warning-color); box-shadow: 0 0 0 4px rgba(233, 180, 76, 0.14); animation: comfy-ai-pulse 0.9s ease-in-out infinite; }

        /* ---------- In-chat: generated image ---------- */
        .comfy-image-container {
            display: block;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            margin-top: var(--vp-space-3);
            overflow: hidden;
            clear: both;
        }
        .comfy-image-container img {
            display: block;
            width: 100%;
            max-width: 100%;
            height: auto;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(0, 0, 0, 0.2);
            box-shadow: var(--vp-shadow-1);
        }

        /* ---------- In-chat: progress ---------- */
        .comfy-progress-container {
            width: 100%;
            height: 6px;
            margin-top: var(--vp-space-1);
            overflow: hidden;
            border-radius: var(--vp-radius-pill);
            background: rgba(255, 255, 255, 0.1);
        }
        .comfy-progress-bar {
            height: 100%;
            width: 0%;
            border-radius: var(--vp-radius-pill);
            background: linear-gradient(90deg, var(--vp-accent-color), var(--vp-warning-color));
            transition: width var(--vp-dur) ease;
        }
        .comfy-progress-text { margin-top: 2px; text-align: center; color: var(--vp-text-muted); font-size: 11px; }
        .comfy-cancel-button { display: block; margin: 6px auto 0; padding: 2px 12px; font-size: 12px; min-height: 0; }

        /* ---------- In-chat: metadata tooltip ---------- */
        .comfy-image-tooltip {
            position: fixed;
            z-index: 100001;
            pointer-events: none;
            max-width: 320px;
            padding: 10px 14px;
            color: #fff;
            font-size: 12px;
            line-height: 1.6;
            white-space: pre-line;
            border: 1px solid var(--vp-border-strong);
            border-radius: var(--vp-radius-md);
            background: rgba(15, 17, 21, 0.96);
            box-shadow: var(--vp-shadow-2);
            -webkit-backdrop-filter: blur(8px);
            backdrop-filter: blur(8px);
            transition: opacity 0.15s;
        }

        /* ---------- In-chat: before/after compare ---------- */
        .comfy-compare-container {
            position: relative;
            width: 100%;
            margin-top: var(--vp-space-2);
            overflow: hidden;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
        }
        .comfy-compare-container img { display: block; width: 100%; height: auto; }
        .comfy-compare-old { position: absolute; top: 0; left: 0; width: 100%; clip-path: inset(0 50% 0 0); }
        .comfy-compare-slider {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 50%;
            width: 3px;
            z-index: 2;
            cursor: ew-resize;
            background: #fff;
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
        }
        .comfy-compare-slider::after {
            content: '\\2039\\203A';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
            background: #fff;
            border-radius: 50%;
            font-size: 14px;
            line-height: 24px;
            text-align: center;
        }
        .comfy-compare-actions { display: flex; gap: var(--vp-space-2); justify-content: center; margin-top: var(--vp-space-2); }

        /* ---------- Hidden-button mode ---------- */
        .comfy-buttons-hidden .comfy-chat-generate-button,
        .comfy-buttons-hidden .comfy-delete-button { display: none !important; }
        .comfy-buttons-hidden .comfy-image-container img { cursor: pointer; }

        /* ---------- In-chat: AI prompt panel ---------- */
        .comfy-ai-prompt-panel {
            display: block;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            margin-top: var(--vp-space-2);
            padding: var(--vp-space-2);
            border: 1px solid rgba(102, 215, 199, 0.26);
            border-radius: var(--vp-radius-md);
            background: linear-gradient(180deg, rgba(102, 215, 199, 0.085), rgba(255, 255, 255, 0.03));
        }
        .comfy-ai-prompt-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--vp-space-2);
            margin-bottom: 6px;
            color: var(--vp-text-color);
            font-size: 12px;
            font-weight: 600;
        }
        .comfy-ai-prompt-status { color: var(--vp-text-muted); font-size: 11px; font-weight: 500; }
        .comfy-ai-prompt-panel.is-busy .comfy-ai-prompt-status::before {
            content: '';
            display: inline-block;
            width: 7px;
            height: 7px;
            margin-right: 6px;
            border-radius: 50%;
            background: var(--vp-accent-color);
            box-shadow: 0 0 8px var(--vp-accent-color);
            animation: comfy-ai-pulse 0.9s ease-in-out infinite;
        }
        .comfy-ai-prompt-summary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            max-width: 100%;
            box-sizing: border-box;
            padding: 6px 9px;
            cursor: pointer;
            text-align: left;
            white-space: normal;
            color: var(--vp-text-muted);
            font-family: inherit;
            font-size: 12px;
            line-height: 1.35;
            appearance: none;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(7, 9, 11, 0.36);
            transition: color var(--vp-dur-fast), border-color var(--vp-dur-fast), background var(--vp-dur-fast);
        }
        .comfy-ai-prompt-summary::before {
            content: '\\f023';
            margin-right: 6px;
            font-family: 'Font Awesome 6 Free', 'Font Awesome 5 Free', FontAwesome, sans-serif;
            font-weight: 900;
            font-size: 10px;
            opacity: 0.76;
        }
        .comfy-ai-prompt-summary:hover:not(:disabled),
        .comfy-ai-prompt-summary[aria-expanded="true"] {
            color: var(--vp-text-color);
            border-color: var(--vp-accent-border);
            background: var(--vp-accent-soft);
        }
        .comfy-ai-prompt-editor { margin-top: 6px; }
        .comfy-ai-prompt-editor[hidden] { display: none !important; }
        .comfy-ai-prompt-editor[hidden] + .comfy-ai-prompt-actions [data-action="save"] { display: none; }
        .comfy-ai-prompt-textarea {
            width: 100%;
            min-height: 76px;
            box-sizing: border-box;
            padding: 8px 10px;
            color: var(--vp-text-color);
            font-family: var(--vp-font);
            font-size: 13px;
            line-height: 1.45;
            resize: vertical;
            border: 1px solid var(--vp-border-strong);
            border-radius: var(--vp-radius-md);
            background: rgba(0, 0, 0, 0.28);
        }
        .comfy-ai-prompt-textarea:focus { outline: none; border-color: var(--vp-accent-color); box-shadow: 0 0 0 3px var(--vp-glow-color); }
        .comfy-ai-prompt-actions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 6px; }
        .comfy-ai-prompt-actions .comfy-button,
        .comfy-ai-prompt-actions .comfy-chat-generate-button { padding: 6px 10px; font-size: 12px; min-height: 32px; }
        .comfy-ai-prompt-panel.is-busy .comfy-ai-prompt-actions .comfy-button:disabled,
        .comfy-ai-prompt-panel.is-busy .comfy-ai-prompt-actions .comfy-chat-generate-button:disabled { opacity: 0.58; }
        .comfy-ai-prompt-actions .comfy-ai-prompt-action.primary {
            color: #101417;
            border-color: var(--vp-accent-color);
            background: var(--vp-accent-color);
            text-shadow: none;
        }
        .comfy-ai-prompt-actions .comfy-ai-prompt-action.primary:hover:not(:disabled) { filter: brightness(1.08); }

        #${panelId} .comfy-ai-prompt-options { display: grid; gap: var(--vp-space-2); margin-bottom: 14px; }
        #${panelId} .comfy-ai-prompt-options .comfy-auto-generate-label { margin: 0; }
        #${panelId} .comfy-hint { margin-top: var(--vp-space-2); color: var(--vp-text-muted); font-size: 12px; line-height: 1.45; }
        #${panelId} .comfy-hint code { color: var(--vp-accent-color); font-family: var(--vp-font); }
        #${panelId} #comfyui-ai-prompt-api-settings.is-disabled { opacity: 0.55; }
        #${panelId} .comfy-ai-prompt-instruction { min-height: 220px; }

        /* ---------- Toolbar menu entry ---------- */
        #options > .options-content > a#${buttonId} {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        /* ---------- Animations ---------- */
        @keyframes comfy-ai-pulse {
            0%, 100% { opacity: 0.45; transform: scale(0.82); }
            50% { opacity: 1; transform: scale(1); }
        }
        @keyframes comfy-shake {
            0%, 100% { transform: translateX(0); }
            10%, 50%, 90% { transform: translateX(-4px); }
            30%, 70% { transform: translateX(4px); }
        }
        .comfy-shake { animation: comfy-shake 0.4s ease-in-out; }
        @keyframes comfy-panel-in {
            from { opacity: 0; transform: translateY(8px) scale(0.992); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes comfy-fade-in {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes comfy-pop-in {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.96); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
            #${panelId},
            #${panelId} *,
            .comfy-ai-prompt-panel,
            .workflow-save-modal {
                animation-duration: 0.001s !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.001s !important;
            }
        }

        /* ---------- Responsive: tablet / collapsed rail ---------- */
        @media (max-width: 920px) {
            #${panelId} .comfyui-panel-content,
            #${panelId} .tab-container {
                grid-template-columns: 1fr;
                grid-template-rows: auto auto minmax(0, 1fr);
            }
            #${panelId} .mode-switch-container {
                grid-column: 1;
                grid-row: 1;
                flex-direction: row;
                align-items: center;
                flex-wrap: wrap;
                gap: var(--vp-space-3);
                border-right: 0;
                border-bottom: 1px solid var(--vp-border-color);
            }
            #${panelId} .mode-switch { width: auto; min-width: 220px; }
            #${panelId} .mode-status { width: auto; flex: 1; }
            #${panelId} .tab-container { grid-row: 2 / 4; }
            #${panelId} .tab-buttons {
                grid-column: 1;
                flex-direction: row;
                margin: 0;
                padding: 10px 12px;
                border-right: 0;
                border-bottom: 1px solid var(--vp-border-color);
                overflow-x: auto;
            }
            #${panelId} .tab-button { width: auto; min-width: max-content; }
            #${panelId} .tab-content { grid-column: 1; padding: 16px; }
        }

        /* ---------- Responsive: phone ---------- */
        @media (max-width: 768px) {
            #${panelId} {
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                max-width: none !important;
                max-height: none !important;
                transform: none !important;
                border-radius: 0;
            }
            #${panelId} .panel-control-bar {
                position: sticky;
                top: 0;
                z-index: 2;
                padding: 10px 12px;
                background: var(--vp-bg-color);
            }
            #${panelId} .panel-title-copy span { display: none; }
            #${panelId} .mode-switch-container { padding: 12px; }
            #${panelId} .tab-buttons { margin-top: 0; padding: 8px 10px; }
            #${panelId} .tab-button { min-height: 36px; padding: 8px 10px; font-size: 12px; }
            #${panelId} .comfy-settings-grid,
            #${panelId} .comfy-ai-key-list-grid,
            #${panelId} .comfy-ai-rule-preset-grid { grid-template-columns: 1fr !important; }
            #${panelId} .comfy-inline-actions,
            #${panelId} .workflow-action-row,
            #${panelId} .lora-action-row { display: grid; grid-template-columns: 1fr 1fr; }
            #${panelId} .comfy-inline-actions .comfy-button,
            #${panelId} .workflow-action-row .comfy-button,
            #${panelId} .lora-action-row .comfy-button { width: 100%; }
            #${panelId} .comfy-lora-toolbar { grid-template-columns: 1fr; }
            #${panelId} .lora-bulk-panel { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            #${panelId} .lora-bulk-panel .comfy-button { width: 100%; }
            #${panelId} .selected-lora-main { grid-template-columns: auto minmax(0, 1fr) 64px 64px auto auto; }
            #${panelId} .selected-lora-triggers { grid-template-columns: 1fr; padding-left: 0; }
            #${panelId} .img2img-preview-card { grid-template-columns: 1fr; }
            #${panelId} .img2img-preview-card img { width: 100%; height: auto; max-height: 180px; }
            #${panelId} .cache-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); max-height: 52vh; }
            #${panelId} .tab-content { padding: 14px 14px env(safe-area-inset-bottom, 20px); }
        }

        @media (max-width: 480px) {
            #${panelId} .tab-button { padding: 6px 9px; font-size: 11.5px; }
            #${panelId} fieldset,
            #${panelId} .workflow-tools,
            #${panelId} .comfy-prompt-area { padding: 12px; margin-bottom: 12px; }
            #${panelId} .comfy-settings-grid { gap: 10px; margin-bottom: 12px; }
            #${panelId} .cache-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) and (orientation: landscape) {
            #${panelId} .panel-control-bar { min-height: 0; padding: 6px 12px; }
            #${panelId} .cache-grid { max-height: 40vh; }
        }
    `;
}
