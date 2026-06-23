export function getAiPromptPanelStyles({ panelId, buttonId }) {
    return `        /* ---------- In-chat: AI prompt panel ---------- */
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
            justify-content: flex-start;
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
        .comfy-ai-prompt-image-slot {
            display: block;
            width: 100%;
            clear: both;
        }
        .comfy-ai-prompt-image-slot:empty { display: none; }
        .comfy-ai-prompt-drawer {
            box-sizing: border-box;
            width: 100%;
            margin-top: 8px;
            padding: 8px;
            border: 1px solid rgba(102, 215, 199, 0.18);
            border-radius: var(--vp-radius-md);
            background: rgba(7, 9, 11, 0.22);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
        }
        .comfy-ai-prompt-drawer[hidden] { display: none !important; }
        .comfy-ai-prompt-drawer .comfy-ai-prompt-summary { width: 100%; }
        .comfy-ai-prompt-editor { margin-top: 6px; }
        .comfy-ai-prompt-editor[hidden] { display: none !important; }
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
        .comfy-ai-prompt-actions > .comfy-button-group {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin: 0;
        }
        .comfy-ai-prompt-actions .comfy-button,
        .comfy-ai-prompt-actions .comfy-chat-generate-button,
        .comfy-ai-prompt-tools .comfy-button { padding: 6px 10px; font-size: 12px; min-height: 32px; }
        .comfy-ai-prompt-actions .comfy-button,
        .comfy-ai-prompt-actions .comfy-chat-generate-button { white-space: nowrap; }
        .comfy-ai-prompt-actions .comfy-delete-button { order: 2; }
        .comfy-ai-prompt-actions [data-action="toggle-edit"] { order: 3; }
        .comfy-ai-prompt-tools {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            align-items: center;
            margin-top: 8px;
        }
        .comfy-ai-prompt-panel.is-busy .comfy-ai-prompt-actions .comfy-button:disabled,
        .comfy-ai-prompt-panel.is-busy .comfy-ai-prompt-actions .comfy-chat-generate-button:disabled,
        .comfy-ai-prompt-panel.is-busy .comfy-ai-prompt-tools .comfy-button:disabled { opacity: 0.58; }
        .comfy-ai-prompt-actions .comfy-ai-prompt-action.primary {
            color: #101417;
            border-color: var(--vp-accent-color);
            background: var(--vp-accent-color);
            text-shadow: none;
        }
        .comfy-ai-prompt-actions .comfy-ai-prompt-action.primary:hover:not(:disabled) { filter: brightness(1.08); }
        .comfy-ai-prompt-progress {
            display: grid;
            grid-template-columns: 72px minmax(0, 1fr);
            gap: 6px 8px;
            align-items: center;
            margin-top: 6px;
            padding: 6px 8px;
            border: 1px solid rgba(102, 215, 199, 0.18);
            border-radius: var(--vp-radius-md);
            background: rgba(7, 9, 11, 0.26);
        }
        .comfy-ai-prompt-progress[hidden] { display: none !important; }
        .comfy-ai-prompt-progress-bar {
            position: relative;
            grid-column: 1;
            grid-row: 1;
            height: 5px;
            overflow: hidden;
            border-radius: var(--vp-radius-pill);
            background: rgba(255, 255, 255, 0.08);
        }
        .comfy-ai-prompt-progress-bar span {
            position: absolute;
            inset: 0 auto 0 0;
            width: 42%;
            border-radius: inherit;
            background: linear-gradient(90deg, rgba(102, 215, 199, 0.2), var(--vp-accent-color), rgba(102, 215, 199, 0.2));
            animation: comfy-ai-progress-sweep 1.15s ease-in-out infinite;
        }
        .comfy-ai-prompt-progress[data-phase="done"] .comfy-ai-prompt-progress-bar span {
            width: 100%;
            animation: none;
            background: var(--vp-success-color);
        }
        .comfy-ai-prompt-progress[data-phase="error"] .comfy-ai-prompt-progress-bar span {
            width: 100%;
            animation: none;
            background: var(--vp-error-color);
        }
        .comfy-ai-prompt-progress-meta {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            grid-column: 2;
            grid-row: 1;
            min-width: 0;
            color: var(--vp-text-muted);
            font-size: 11px;
            line-height: 1.35;
        }
        .comfy-ai-prompt-progress-detail {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .comfy-ai-prompt-progress-time {
            flex: 0 0 auto;
            color: var(--vp-accent-color);
            font-variant-numeric: tabular-nums;
        }

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
        @keyframes comfy-ai-progress-sweep {
            0% { transform: translateX(-80%); }
            50% { transform: translateX(62%); }
            100% { transform: translateX(180%); }
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
            .comfy-ai-prompt-actions { display: grid; grid-template-columns: 1fr; align-items: stretch; }
            .comfy-ai-prompt-actions > .comfy-button-group { display: grid; grid-template-columns: 1fr; }
            .comfy-ai-prompt-actions .comfy-button,
            .comfy-ai-prompt-actions .comfy-chat-generate-button { width: 100%; }
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
