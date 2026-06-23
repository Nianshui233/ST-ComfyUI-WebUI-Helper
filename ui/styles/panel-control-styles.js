export function getPanelControlStyles({ panelId, buttonId }) {
    return `        /* ---------- Buttons (shared: panel + in-chat) ---------- */
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
`;
}
