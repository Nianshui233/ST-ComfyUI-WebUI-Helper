export function getPanelLoraCacheStyles({ panelId, buttonId }) {
    return `        /* ---------- LoRA selector ---------- */
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
`;
}
