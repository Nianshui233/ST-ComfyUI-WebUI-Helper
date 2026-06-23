export function getPanelWorkflowStyles({ panelId, buttonId }) {
    return `        /* ---------- Workflow tab ---------- */
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
`;
}
