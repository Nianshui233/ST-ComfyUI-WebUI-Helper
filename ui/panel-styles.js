export function getPanelStyles({ panelId, buttonId }) {
    return `        :root {
            --vp-bg-color: rgba(10, 15, 25, 0.9);
            --vp-accent-color: #00d1ff;
            --vp-text-color: #e0e5f0;
            --vp-border-color: rgba(0, 209, 255, 0.3);
            --vp-glow-color: rgba(0, 209, 255, 0.6);
            --vp-error-color: #ff4747;
            --vp-success-color: #00ff9c;
            --vp-font: 'Segoe UI', 'Roboto', system-ui, sans-serif;
            --vp-warning-color: #ffa500;
            --vp-comfyui-color: #00d1ff;
            --vp-webui-color: #ff6b35;
        }

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
            color: var(--vp-text-color);
            background: var(--vp-bg-color);
            border: 1px solid var(--vp-border-color);
            border-radius: 8px;
            box-shadow: 0 0 25px rgba(0,0,0,0.5), 0 0 15px var(--vp-glow-color) inset;
            padding: 20px;
            box-sizing: border-box;
            backdrop-filter: blur(12px);
            font-family: var(--vp-font);
            flex-direction: column;
            overflow: hidden;
        }

        #${panelId} .panel-control-bar {
            padding-bottom: 15px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--vp-border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-shrink: 0;
            text-shadow: 0 0 5px var(--vp-accent-color);
            position: relative;
        }

        #${panelId} .panel-title-group {
            display: inline-flex;
            align-items: center;
            min-width: 0;
        }

        #${panelId} .panel-control-bar b {
            font-size: 1.4em;
            margin-left: 10px;
            font-weight: 600;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        #${panelId} .floating_panel_close {
            border: 0;
            background: transparent;
            color: var(--vp-text-color);
            cursor: pointer;
            font-size: 1.6em;
            line-height: 1;
            padding: 4px;
            transition: color 0.3s, text-shadow 0.3s;
        }

        #${panelId} .floating_panel_close:hover {
            color: var(--vp-accent-color);
            text-shadow: 0 0 8px var(--vp-accent-color);
        }

        #${panelId} .comfyui-panel-content {
            overflow-y: auto;
            flex-grow: 1;
            padding-right: 10px;
            min-height: 0;
        }

        #${panelId} input[type="text"],
        #${panelId} input[type="number"],
        #${panelId} select,
        #${panelId} textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 10px 12px;
            border-radius: 6px;
            border: 1px solid var(--vp-border-color);
            background-color: rgba(0,0,0,0.3);
            color: var(--vp-text-color);
            font-family: var(--vp-font);
            transition: border-color 0.3s, box-shadow 0.3s;
        }

        #${panelId} input:focus,
        #${panelId} select:focus,
        #${panelId} textarea:focus {
            outline: none;
            border-color: var(--vp-accent-color);
            box-shadow: 0 0 10px var(--vp-glow-color);
        }

        #${panelId} textarea {
            min-height: 80px;
            resize: vertical;
            margin-top: 5px;
        }

        #${panelId} .workflow-info {
            font-size: 0.9em;
            color: #aaa;
            margin-top: 5px;
            margin-bottom: 15px;
            padding-left: 5px;
            border-left: 2px solid var(--vp-border-color);
        }

        .comfy-button {
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            flex-shrink: 0;
            font-size: 14px;
            background: transparent;
            color: var(--vp-accent-color);
            border: 1px solid var(--vp-accent-color);
            text-shadow: 0 0 2px var(--vp-accent-color);
        }

        .comfy-button:hover:not(:disabled) {
            background: var(--vp-accent-color);
            color: var(--vp-bg-color);
            box-shadow: 0 0 12px var(--vp-glow-color);
            text-shadow: none;
        }

        .comfy-button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .comfy-button.testing {
            color: #fff;
            border-color: #f39c12;
            background: rgba(243, 156, 18, 0.2);
        }

        .comfy-button.success {
            color: #fff;
            border-color: var(--vp-success-color);
            background: rgba(0, 255, 156, 0.2);
        }

        .comfy-button.error {
            color: #fff;
            border-color: var(--vp-error-color);
            background: rgba(255, 71, 71, 0.2);
        }

        .comfy-button.warning {
            color: #fff;
            border-color: var(--vp-warning-color);
            background: rgba(255, 165, 0, 0.2);
        }

        .comfy-input-group {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        #${panelId} input[type="password"] {
            width: 100%;
            box-sizing: border-box;
            padding: 10px 12px;
            border-radius: 6px;
            border: 1px solid var(--vp-border-color);
            background-color: rgba(0,0,0,0.3);
            color: var(--vp-text-color);
            font-family: var(--vp-font);
            transition: border-color 0.3s, box-shadow 0.3s;
        }

        #${panelId} input[type="password"]:focus {
            outline: none;
            border-color: var(--vp-accent-color);
            box-shadow: 0 0 10px var(--vp-glow-color);
        }

        #${panelId} .comfy-inline-actions {
            display: flex;
            align-items: end;
            gap: 8px;
            flex-wrap: wrap;
        }

        #${panelId} .comfy-inline-actions .comfy-button {
            min-width: 74px;
        }

        #${panelId} label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--vp-accent-color);
            opacity: 0.8;
        }

        #options > .options-content > a#${buttonId} {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        #${panelId} .comfy-auto-generate-container {
            margin: 20px 0;
        }

        #${panelId} .comfy-auto-generate-label {
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            padding: 10px;
            border-radius: 6px;
            border: 1px dashed var(--vp-border-color);
            transition: background-color 0.3s, border-color 0.3s;
        }

        #${panelId} .comfy-auto-generate-label:hover {
            background-color: rgba(0, 209, 255, 0.05);
            border-color: var(--vp-accent-color);
        }

        #${panelId} .comfy-auto-generate-label input[type="checkbox"] {
            transform: scale(1.3);
        }

        #${panelId} .comfy-auto-generate-label span {
            font-weight: normal;
            font-size: 0.9em;
            text-transform: none;
            letter-spacing: 0;
        }

        #${panelId} .comfy-auto-generate-label b {
            color: var(--vp-text-color);
            text-transform: none;
            letter-spacing: 0;
            font-size: 1.1em;
        }

        .comfy-settings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 15px 20px;
            margin-bottom: 20px;
        }

        .comfy-prompt-area {
            margin-bottom: 20px;
        }

        .img2img-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
        }

        .img2img-preview-card {
            display: grid;
            grid-template-columns: 120px minmax(0, 1fr);
            gap: 12px;
            align-items: center;
            padding: 10px;
            border: 1px solid var(--vp-border-color);
            border-radius: 6px;
            background: rgba(0,0,0,0.22);
        }

        .img2img-preview-card img {
            width: 120px;
            height: 120px;
            object-fit: contain;
            border-radius: 6px;
            border: 1px solid var(--vp-border-color);
            background: rgba(0,0,0,0.25);
        }

        .img2img-preview-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 600;
        }

        .img2img-preview-meta {
            margin-top: 4px;
            color: #aaa;
            font-size: 0.85em;
        }

        #comfyui-refresh-models,
        #comfyui-refresh-unets,
        #webui-refresh-models,
        #webui-refresh-loras {
            padding: 8px;
            line-height: 1;
            min-width: 40px;
        }

        .comfy-button-group {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin: 5px 4px;
        }

.comfy-image-container {
    display: block;
    width: 100%;
    max-width: 100%;
            box-sizing: border-box;
            margin-top: 10px;
            overflow: hidden;
            clear: both;
        }

.comfy-image-container img {
    display: block;
    max-width: 100%;
    width: 100%;
    height: auto;
    border-radius: 8px;
    border: 1px solid var(--vp-border-color);
            background: rgba(0,0,0,0.2);
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }

        .workflow-action-row {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 15px;
            margin-bottom: 25px;
        }

        .workflow-action-row .comfy-button {
            flex: 1 1 180px;
        }

        .placeholder-toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin: 8px 0 10px;
        }

        .placeholder-toolbar .comfy-button {
            padding: 6px 8px;
            font-size: 12px;
        }

        .workflow-analysis-result {
            margin-top: 10px;
            padding: 10px 12px;
            border: 1px solid var(--vp-border-color);
            border-radius: 6px;
            background: rgba(0,0,0,0.24);
            font-size: 0.86em;
            line-height: 1.5;
        }

        .workflow-analysis-title {
            color: var(--vp-accent-color);
            font-weight: 700;
            margin-bottom: 6px;
        }

        .workflow-analysis-lines {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 4px 14px;
        }

        .workflow-analysis-warnings {
            margin-top: 8px;
            color: var(--vp-warning-color);
        }

        .workflow-selector-container {
            display: flex;
            flex-direction: column;
            margin-bottom: 20px;
        }

        .workflow-search-container {
            margin-bottom: 15px;
        }

        .workflow-search-input {
            width: 100%;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid var(--vp-border-color);
            background-color: rgba(0,0,0,0.3);
            color: var(--vp-text-color);
        }

        .workflow-item {
            display: flex;
            padding: 10px;
            border-radius: 6px;
            margin-bottom: 8px;
            justify-content: space-between;
            align-items: center;
            background: rgba(0,0,0,0.2);
            border: 1px solid var(--vp-border-color);
            transition: all 0.3s;
        }

        .workflow-item:hover {
            background: rgba(0, 209, 255, 0.05);
        }

        .workflow-item-title {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            padding-right: 10px;
            cursor: pointer;
        }

        .workflow-item-title:hover {
            color: var(--vp-accent-color);
        }

        .workflow-item-actions {
            display: flex;
            gap: 8px;
        }

        .workflow-item-actions button {
            padding: 5px 10px;
            font-size: 12px;
        }

        .workflow-item.active {
            background: rgba(0, 209, 255, 0.1);
            border-color: var(--vp-accent-color);
        }

        .workflow-item.editing .workflow-item-title {
            display: none;
        }

        .workflow-item.editing .workflow-edit-input {
            display: block;
        }

        .workflow-edit-input {
            display: none;
            flex: 1;
            margin-right: 10px;
        }

        .workflow-save-modal {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            background: var(--vp-bg-color);
            border: 1px solid var(--vp-border-color);
            border-radius: 12px;
            padding: 20px;
            width: 400px;
            box-shadow: 0 0 25px rgba(0,0,0,0.5);
        }

        .workflow-save-modal h3 {
            margin-top: 0;
            color: var(--vp-accent-color);
        }

        .workflow-save-modal .modal-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            justify-content: flex-end;
        }

        .workflow-save-modal input {
            margin-bottom: 10px;
        }

        .workflow-save-modal .overwrite-warning {
            background: rgba(255, 165, 0, 0.1);
            border: 1px solid var(--vp-warning-color);
            border-radius: 6px;
            padding: 10px;
            margin: 10px 0;
            color: var(--vp-warning-color);
        }

        .empty-workflows-message {
            text-align: center;
            padding: 20px;
            font-style: italic;
            color: #888;
        }

        .tab-container {
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            min-height: 0;
        }

        .tab-buttons {
            display: flex;
            border-bottom: 1px solid var(--vp-border-color);
            margin-bottom: 15px;
            flex-wrap: wrap;
        }

        .tab-button {
            padding: 10px 15px;
            cursor: pointer;
            background: transparent;
            border: none;
            color: var(--vp-text-color);
            font-weight: 600;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
            white-space: nowrap;
        }

        .tab-button.active {
            color: var(--vp-accent-color);
            border-bottom-color: var(--vp-accent-color);
        }

        .tab-button:hover:not(.active) {
            border-bottom-color: rgba(0, 209, 255, 0.3);
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block !important;
        }

        .tab-content:not(.active) {
            display: none !important;
        }

        .tab-content.comfyui-settings.hidden {
            display: none !important;
        }

        .tab-content.webui-settings:not(.active) {
            display: none !important;
        }

        .workflow-tools {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid var(--vp-border-color);
            border-radius: 6px;
            background: rgba(0,0,0,0.1);
        }

        .workflow-tools h4 {
            margin: 0 0 15px 0;
            color: var(--vp-accent-color);
            font-size: 1.1em;
        }

        .edit-mode-toolbar {
            display: none;
            margin-bottom: 15px;
            padding: 10px;
            background: rgba(0, 209, 255, 0.1);
            border: 1px solid var(--vp-accent-color);
            border-radius: 6px;
        }

        .edit-mode-toolbar.active {
            display: block;
        }

        .edit-mode-toolbar .toolbar-title {
            font-weight: 600;
            color: var(--vp-accent-color);
            margin-bottom: 10px;
        }

        /* 模式切换相关样式 */
        .mode-switch-container {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid var(--vp-border-color);
            border-radius: 6px;
            background: rgba(0,0,0,0.1);
        }

        .mode-switch {
            display: flex;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid var(--vp-border-color);
        }

        .mode-switch-option {
            padding: 10px 20px;
            cursor: pointer;
            background: rgba(0,0,0,0.3);
            color: var(--vp-text-color);
            border: none;
            font-weight: 600;
            transition: all 0.3s;
            font-size: 14px;
            min-width: 100px;
        }

        .mode-switch-option.active.comfyui {
            background: var(--vp-comfyui-color);
            color: white;
        }

        .mode-switch-option.active.webui {
            background: var(--vp-webui-color);
            color: white;
        }

        .mode-switch-option:hover:not(.active) {
            background: rgba(255,255,255,0.1);
        }

        .mode-status {
            font-size: 0.9em;
            color: #aaa;
            flex: 1;
        }

        /* LoRA选择器样式 */
        .lora-selector {
            margin-bottom: 20px;
        }

        .comfy-lora-toolbar {
            display: grid;
            grid-template-columns: minmax(180px, 1fr) 160px auto;
            gap: 10px;
            align-items: center;
            margin-bottom: 12px;
        }

        .lora-bulk-panel {
            display: grid;
            grid-template-columns: 120px 120px repeat(3, auto);
            gap: 10px;
            align-items: end;
            margin-bottom: 10px;
            padding: 10px;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 6px;
            background: rgba(0,0,0,0.18);
        }

        .lora-bulk-panel label {
            font-size: 0.78em;
            color: #aaa;
        }

        .lora-action-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 12px;
        }

        .lora-options-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px 12px;
            align-items: center;
            margin-bottom: 12px;
            padding: 9px 10px;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 6px;
            background: rgba(0,0,0,0.16);
        }

        .lora-options-row label {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 0.84em;
            color: #c8d3e2;
        }

        .lora-options-row select {
            width: auto !important;
            min-width: 108px;
            min-height: 30px !important;
            padding: 4px 8px !important;
            font-size: 0.84em !important;
        }

        .lora-list {
            max-height: 42vh;
            overflow-y: auto;
            border: 1px solid var(--vp-border-color);
            border-radius: 6px;
            background: rgba(0,0,0,0.3);
        }

        .lora-group-header {
            position: sticky;
            top: 0;
            z-index: 1;
            padding: 6px 12px;
            background: rgba(0, 209, 255, 0.16);
            color: var(--vp-accent-color);
            border-bottom: 1px solid var(--vp-border-color);
            font-size: 0.78em;
            font-weight: 700;
            text-transform: uppercase;
        }

        .lora-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid var(--vp-border-color);
        }

        .lora-item:last-child {
            border-bottom: none;
        }

        .lora-item:hover {
            background: rgba(255,255,255,0.05);
        }

        .lora-info {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .lora-name {
            font-weight: 600;
            font-size: 0.9em;
        }

        .lora-alias {
            font-size: 0.8em;
            color: #aaa;
        }

        .lora-controls {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .lora-weight {
            width: 64px;
            padding: 4px 6px;
            font-size: 0.8em;
        }

        .lora-checkbox {
            transform: scale(1.2);
        }

        .selected-loras {
            margin-top: 10px;
            padding: 10px;
            border: 1px solid var(--vp-border-color);
            border-radius: 6px;
            background: rgba(0,0,0,0.2);
        }

        .selected-loras h4 {
            margin: 0 0 10px 0;
            font-size: 0.9em;
            color: var(--vp-accent-color);
        }

        .selected-loras h4 span {
            color: #aaa;
            font-weight: 500;
        }

        .selected-lora-row {
            display: grid;
            grid-template-columns: 1fr;
            gap: 6px;
            padding: 6px 0;
            border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .selected-lora-main {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) 70px 70px auto auto;
            gap: 8px;
            align-items: center;
        }

        .selected-lora-row:last-child {
            border-bottom: none;
        }

        .selected-lora-row.disabled {
            opacity: 0.55;
        }

        .selected-lora-name {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 0.88em;
            font-weight: 600;
        }

        .selected-lora-remove {
            padding: 4px 8px;
            min-height: 28px;
            font-size: 0.8em;
        }

        .selected-lora-order {
            display: inline-flex;
            gap: 4px;
        }

        .selected-lora-order-btn {
            width: 28px;
            min-height: 28px;
            padding: 0;
            font-size: 12px;
        }

        .selected-lora-triggers {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 8px;
            align-items: center;
            padding-left: 26px;
        }

        .selected-lora-trigger-input {
            min-height: 30px !important;
            padding: 5px 8px !important;
            font-size: 12px !important;
        }

        .selected-lora-trigger-toggle {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #aaa;
            font-size: 0.78em;
            white-space: nowrap;
        }

        .selected-lora-tag {
            display: inline-block;
            background: var(--vp-accent-color);
            color: white;
            padding: 4px 8px;
            margin: 2px;
            border-radius: 4px;
            font-size: 0.8em;
        }

        .selected-lora-tag .remove {
            margin-left: 5px;
            cursor: pointer;
            font-weight: bold;
        }

        .selected-lora-tag .remove:hover {
            color: var(--vp-error-color);
        }

        /* Embedding选择器样式 */
        .embedding-selector {
            margin-bottom: 20px;
        }

        .embedding-list {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid var(--vp-border-color);
            border-radius: 6px;
            background: rgba(0,0,0,0.3);
        }

        .embedding-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-bottom: 1px solid var(--vp-border-color);
        }

        .embedding-item:last-child {
            border-bottom: none;
        }

        .embedding-item:hover {
            background: rgba(255,255,255,0.05);
        }

        .embedding-info {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .embedding-name {
            font-weight: 600;
            font-size: 0.9em;
        }

        .embedding-controls {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .embedding-weight {
            width: 60px;
            padding: 4px 6px;
            font-size: 0.8em;
        }

        .embedding-checkbox {
            transform: scale(1.2);
        }

        .selected-embeddings {
            margin-top: 10px;
            padding: 10px;
            border: 1px solid var(--vp-border-color);
            border-radius: 6px;
            background: rgba(0,0,0,0.2);
        }

        .selected-embeddings h4 {
            margin: 0 0 10px 0;
            font-size: 0.9em;
            color: var(--vp-accent-color);
        }

        .selected-embedding-tag {
            display: inline-block;
            background: #ff6b35;
            color: white;
            padding: 4px 8px;
            margin: 2px;
            border-radius: 4px;
            font-size: 0.8em;
        }

        .selected-embedding-tag .remove {
            margin-left: 5px;
            cursor: pointer;
            font-weight: bold;
        }

        .selected-embedding-tag .remove:hover {
            color: var(--vp-error-color);
        }

        /* WebUI专用设置样式 */
        .webui-settings {
            display: none;
        }

        .webui-settings.active {
            display: block;
        }

        .comfyui-settings {
            display: block;
        }

        .comfyui-settings.hidden {
            display: none;
        }

        /* 在现有CSS的 @media (max-width: 768px) 部分，修改以下规则： */

@media (max-width: 768px) {
    #${panelId} {
        position: fixed !important;
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
        padding: 5px; /* 减少padding */
        z-index: 10000;
        overflow: hidden; /* 防止面板本身滚动 */
    }

    #${panelId} .panel-control-bar {
        padding: 10px 5px; /* 减少padding */
        margin-bottom: 10px; /* 减少margin */
        position: sticky;
        top: 0;
        background: var(--vp-bg-color);
        z-index: 1;
        flex-shrink: 0; /* 防止压缩 */
    }

    #${panelId} .comfyui-panel-content {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 5px;
        padding-bottom: 20px; /* 底部留出更多空间 */
        box-sizing: border-box;
    }

    /* 减少各种元素的margin和padding */
    fieldset {
        margin-bottom: 15px; /* 减少 */
        padding: 10px; /* 减少 */
    }

    .tab-buttons {
        margin-bottom: 10px; /* 减少 */
        padding-bottom: 5px;
    }

    .tab-button {
        padding: 8px 12px; /* 减少 */
        font-size: 0.85em;
        margin: 2px; /* 添加小的margin */
    }

    .comfy-settings-grid {
        gap: 10px; /* 减少gap */
        margin-bottom: 15px; /* 减少 */
    }

    /* 优化工作流相关元素 */
    .workflow-tools {
        margin-bottom: 15px; /* 减少 */
        padding: 10px; /* 减少 */
    }

    .workflow-action-row {
        margin-top: 10px; /* 减少 */
        margin-bottom: 15px; /* 减少 */
    }

    .workflow-selector-container {
        margin-bottom: 15px; /* 减少 */
    }

    /* 优化缓存网格 */
    .cache-grid {
        max-height: 50vh; /* 限制最大高度 */
        margin-bottom: 20px; /* 确保底部空间 */
    }

    /* 优化LoRA选择器 */
    .lora-selector,
    .embedding-selector {
        margin-bottom: 15px; /* 减少 */
    }

    .lora-list,
    .embedding-list,
    .comfyui-lora-list {
        max-height: 250px; /* 减少最大高度 */
    }

    .comfy-lora-toolbar {
        grid-template-columns: 1fr;
    }

    .lora-bulk-panel {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .lora-bulk-panel .comfy-button {
        width: 100%;
    }

    .selected-lora-main {
        grid-template-columns: auto minmax(0, 1fr) 64px 64px auto auto;
    }

    .selected-lora-triggers {
        grid-template-columns: 1fr;
        padding-left: 0;
    }

    /* 确保表单元素不会过大 */
    #${panelId} input[type="text"],
    #${panelId} input[type="number"],
    #${panelId} select,
    #${panelId} textarea {
        padding: 8px 10px; /* 减少padding */
        font-size: 14px; /* 减少字体大小 */
        min-height: 36px; /* 减少最小高度 */
    }

    #${panelId} textarea {
        min-height: 60px; /* 减少textarea最小高度 */
    }

    .img2img-preview-card {
        grid-template-columns: 1fr;
    }

    .img2img-preview-card img {
        width: 100%;
        height: auto;
        max-height: 180px;
    }

    /* 优化按钮尺寸 */
    .comfy-button {
        padding: 8px 12px; /* 减少padding */
        font-size: 0.9em;
        min-height: 36px; /* 减少最小高度 */
    }

    /* 添加底部安全区域 */
    .tab-content {
        padding-bottom: env(safe-area-inset-bottom, 20px);
    }
}

/* 增加对小屏幕的额外优化 */
@media (max-width: 480px) {
    #${panelId} {
        padding: 3px; /* 进一步减少 */
    }

    #${panelId} .panel-control-bar {
        padding: 8px 3px;
        margin-bottom: 8px;
    }

    #${panelId} .comfyui-panel-content {
        padding-bottom: 30px; /* 更多底部空间 */
    }

    .tab-button {
        padding: 6px 8px;
        font-size: 0.8em;
        margin: 1px;
    }

    fieldset {
        margin-bottom: 10px;
        padding: 8px;
    }

    .comfy-settings-grid {
        gap: 8px;
        margin-bottom: 10px;
    }
}

/* 添加对横屏模式的优化 */
@media (max-width: 768px) and (orientation: landscape) {
    #${panelId} .panel-control-bar {
        padding: 5px;
        margin-bottom: 5px;
    }

    .cache-grid {
        max-height: 40vh; /* 横屏时进一步限制高度 */
    }
}

        /* 图片缓存样式 */
.cache-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
    max-height: 60vh;
    overflow-y: auto;
    padding: 10px 0;
}

.cache-item {
    border: 1px solid var(--vp-border-color);
    border-radius: 8px;
    background: rgba(0,0,0,0.2);
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;
}

.cache-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.cache-item-image {
    width: 100%;
    height: 150px;
    object-fit: cover;
    cursor: pointer;
}

.cache-item-info {
    padding: 10px;
}

.cache-item-prompt {
    font-size: 0.8em;
    color: var(--vp-text-color);
    margin-bottom: 8px;
    max-height: 40px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.cache-item-meta {
    font-size: 0.7em;
    color: #888;
    margin-bottom: 10px;
}

.cache-item-actions {
    display: flex;
    gap: 5px;
}

.cache-item-actions .comfy-button {
    flex: 1;
    padding: 5px 8px;
    font-size: 0.75em;
}

.cache-empty {
    text-align: center;
    padding: 40px 20px;
    color: #888;
    font-style: italic;
}

.cache-image-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.9);
    z-index: 10001;
    justify-content: center;
    align-items: center;
}

.cache-image-modal img {
    max-width: 90%;
    max-height: 90%;
    border-radius: 8px;
}

.cache-modal-close {
    position: absolute;
    top: 20px;
    right: 30px;
    color: white;
    font-size: 2em;
    cursor: pointer;
    z-index: 10002;
}
.prompt-preset-container {
    margin-bottom: 15px;
    padding: 15px;
    border: 1px solid var(--vp-border-color);
    border-radius: 8px;
    background: rgba(0,0,0,0.1);
}

.prompt-preset-controls {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 10px;
}

.prompt-preset-controls select {
    flex: 1;
}

.prompt-preset-controls button {
    flex-shrink: 0;
    min-width: 80px;
}

/* Feature 15: 连接状态指示器 */
.comfy-conn-status {
    display: inline-block; width: 10px; height: 10px;
    border-radius: 50%; margin-right: 6px; vertical-align: middle;
    transition: background-color 0.3s;
}
.comfy-conn-status.connected { background: #4caf50; box-shadow: 0 0 4px #4caf50; }
.comfy-conn-status.disconnected { background: #f44336; box-shadow: 0 0 4px #f44336; }
.comfy-conn-status.checking { background: #ff9800; box-shadow: 0 0 4px #ff9800; }

/* Feature 2: 尺寸预设按钮 */
.comfy-size-preset-btn { font-size: 11px; padding: 3px 8px; min-width: auto; }

/* Feature 8: 图片元数据悬浮提示 */
.comfy-image-tooltip {
    position: fixed; z-index: 100001; pointer-events: none;
    background: rgba(0,0,0,0.9); color: #fff; padding: 10px 14px;
    border-radius: 8px; font-size: 12px; max-width: 320px;
    line-height: 1.6; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    transition: opacity 0.15s; white-space: pre-line;
}

/* Feature 1: 生成进度条 */
.comfy-progress-container {
    width: 100%; height: 6px; background: rgba(255,255,255,0.1);
    border-radius: 3px; overflow: hidden; margin-top: 4px;
}
.comfy-progress-bar {
    height: 100%; background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 3px; width: 0%; transition: width 0.3s ease;
}
.comfy-progress-text {
    font-size: 11px; color: var(--vp-text-muted); margin-top: 2px; text-align: center;
}
.comfy-cancel-button {
    margin-top: 6px; padding: 2px 12px; font-size: 12px; display: block; margin-left: auto; margin-right: auto;
}

/* Feature 14: 图片对比模式 */
.comfy-compare-container {
    position: relative; width: 100%; overflow: hidden;
    border: 1px solid var(--vp-border-color); border-radius: 8px; margin-top: 8px;
}
.comfy-compare-container img {
    display: block; width: 100%; height: auto;
}
.comfy-compare-old {
    position: absolute; top: 0; left: 0; width: 100%;
    clip-path: inset(0 50% 0 0);
}
.comfy-compare-slider {
    position: absolute; top: 0; bottom: 0; width: 3px;
    background: #fff; cursor: ew-resize; left: 50%; z-index: 2;
    box-shadow: 0 0 6px rgba(0,0,0,0.5);
}
.comfy-compare-slider::after {
    content: '\\2039\\203A'; position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%); background: #fff; color: #333;
    border-radius: 50%; width: 24px; height: 24px;
    display: flex; align-items: center; justify-content: center; font-size: 14px;
    line-height: 24px; text-align: center;
}
.comfy-compare-actions {
    display: flex; gap: 8px; justify-content: center; margin-top: 8px;
}

/* 隐藏按钮模式 */
.comfy-buttons-hidden .comfy-chat-generate-button,
.comfy-buttons-hidden .comfy-delete-button {
    display: none !important;
}
.comfy-buttons-hidden .comfy-image-container img {
    cursor: pointer;
}

.comfy-ai-prompt-panel {
    margin-top: 8px;
    display: block;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding: 8px;
    border: 1px solid rgba(0, 209, 255, 0.28);
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.14);
}

.comfy-ai-prompt-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
    color: var(--vp-accent-color);
    font-size: 12px;
    font-weight: 600;
}

.comfy-ai-prompt-status {
    color: #9fb5c7;
    font-size: 11px;
    font-weight: 500;
}

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
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.08);
    color: #c9d6e2;
    background: rgba(255,255,255,0.04);
    font-size: 12px;
    line-height: 1.35;
    cursor: pointer;
    text-align: left;
    white-space: normal;
    appearance: none;
    font-family: inherit;
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
    border-color: rgba(0, 209, 255, 0.32);
    background: rgba(0, 209, 255, 0.08);
    color: var(--vp-text-color);
}

.comfy-ai-prompt-editor[hidden] {
    display: none !important;
}

.comfy-ai-prompt-editor {
    margin-top: 6px;
}

.comfy-ai-prompt-editor[hidden] + .comfy-ai-prompt-actions [data-action="save"] {
    display: none;
}

.comfy-ai-prompt-textarea {
    width: 100%;
    min-height: 76px;
    box-sizing: border-box;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid var(--vp-border-color);
    background: rgba(0, 0, 0, 0.28);
    color: var(--vp-text-color);
    font-family: var(--vp-font);
    font-size: 13px;
    line-height: 1.45;
    resize: vertical;
}

.comfy-ai-prompt-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-top: 6px;
}

.comfy-ai-prompt-actions .comfy-button,
.comfy-ai-prompt-actions .comfy-chat-generate-button {
    padding: 6px 10px;
    font-size: 12px;
}

.comfy-ai-prompt-panel.is-busy .comfy-ai-prompt-actions .comfy-button:disabled,
.comfy-ai-prompt-panel.is-busy .comfy-ai-prompt-actions .comfy-chat-generate-button:disabled {
    opacity: 0.58;
}

.comfy-ai-prompt-actions .comfy-ai-prompt-action.primary {
    color: #101820;
    background: var(--vp-accent-color);
    border-color: var(--vp-accent-color);
    text-shadow: none;
}

.comfy-ai-prompt-actions .comfy-ai-prompt-action.primary:hover:not(:disabled) {
    filter: brightness(1.08);
}

#${panelId} .comfy-ai-prompt-options {
    display: grid;
    gap: 8px;
    margin-bottom: 14px;
}

#${panelId} .comfy-ai-prompt-options .comfy-auto-generate-label {
    margin: 0;
}

#${panelId} .comfy-hint {
    margin-top: 8px;
    color: var(--vp-text-muted);
    font-size: 12px;
    line-height: 1.45;
}

#${panelId} .comfy-hint code {
    color: var(--vp-accent-color);
    font-family: var(--vp-font);
}

#${panelId} #comfyui-ai-prompt-api-settings.is-disabled {
    opacity: 0.55;
}

#${panelId} .comfy-ai-prompt-instruction {
    min-height: 220px;
}

@keyframes comfy-ai-pulse {
    0%, 100% { opacity: 0.45; transform: scale(0.82); }
    50% { opacity: 1; transform: scale(1); }
}

/* 双击抖动动画 */
@keyframes comfy-shake {
    0%, 100% { transform: translateX(0); }
    10%, 50%, 90% { transform: translateX(-4px); }
    30%, 70% { transform: translateX(4px); }
}
.comfy-shake {
    animation: comfy-shake 0.4s ease-in-out;
}

/* Studio UI refresh */
:root {
    --vp-bg-color: rgba(13, 15, 18, 0.96);
    --vp-panel-color: rgba(26, 29, 34, 0.92);
    --vp-panel-color-strong: rgba(32, 36, 42, 0.98);
    --vp-accent-color: #66d7c7;
    --vp-accent-soft: rgba(102, 215, 199, 0.13);
    --vp-accent-strong: #8ee6dc;
    --vp-text-color: #f3efe6;
    --vp-text-muted: #a8aaa7;
    --vp-border-color: rgba(244, 235, 214, 0.14);
    --vp-border-strong: rgba(244, 235, 214, 0.24);
    --vp-glow-color: rgba(102, 215, 199, 0.22);
    --vp-error-color: #ff6f61;
    --vp-success-color: #73d48f;
    --vp-warning-color: #e9b44c;
    --vp-comfyui-color: #66d7c7;
    --vp-webui-color: #e9b44c;
    --vp-font: 'Segoe UI Variable', 'Microsoft YaHei UI', 'Segoe UI', system-ui, sans-serif;
}

#${panelId} {
    padding: 0;
    border: 1px solid var(--vp-border-strong);
    border-radius: 12px;
    background:
        linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0) 38%),
        repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 72px),
        var(--vp-bg-color);
    box-shadow: 0 22px 60px rgba(0,0,0,0.58);
    backdrop-filter: blur(18px) saturate(1.05);
}

#${panelId} .panel-control-bar {
    min-height: 64px;
    margin: 0;
    padding: 14px 18px 13px;
    border-bottom: 1px solid var(--vp-border-color);
    background: linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.012));
    text-shadow: none;
}

#${panelId} .panel-title-group {
    gap: 12px;
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
    letter-spacing: 0;
    line-height: 1.2;
}

#${panelId} .panel-title-copy span {
    color: var(--vp-text-muted);
    font-size: 11px;
    letter-spacing: 0;
    text-transform: none;
}

#${panelId} .floating_panel_close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: 1px solid var(--vp-border-color);
    border-radius: 8px;
    background: rgba(255,255,255,0.035);
    color: var(--vp-text-muted);
    font-size: 18px;
}

#${panelId} .floating_panel_close:hover {
    color: var(--vp-text-color);
    border-color: rgba(255, 111, 97, 0.45);
    background: rgba(255, 111, 97, 0.12);
    text-shadow: none;
}

#${panelId} .comfyui-panel-content {
    display: grid;
    grid-template-columns: 244px minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0;
    padding: 0;
    overflow: hidden;
}

#${panelId} .mode-switch-container {
    grid-column: 1;
    grid-row: 1;
    margin: 0;
    padding: 18px 16px 12px;
    border: 0;
    border-right: 1px solid var(--vp-border-color);
    border-radius: 0;
    background: rgba(0,0,0,0.16);
    gap: 10px;
}

#${panelId} .mode-switch {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
    border: 1px solid var(--vp-border-color);
    border-radius: 8px;
    background: rgba(255,255,255,0.035);
    padding: 3px;
    gap: 3px;
}

#${panelId} .mode-switch-option {
    min-width: 0;
    padding: 9px 10px;
    border-radius: 7px;
    background: transparent;
    color: var(--vp-text-muted);
    font-size: 12px;
    letter-spacing: 0;
}

#${panelId} .mode-switch-option.active.comfyui,
#${panelId} .mode-switch-option.active.webui {
    color: #111417;
    background: var(--vp-accent-color);
    box-shadow: 0 4px 16px rgba(102, 215, 199, 0.22);
}

#${panelId} .mode-switch-option.active.webui {
    background: var(--vp-warning-color);
    box-shadow: 0 4px 16px rgba(233, 180, 76, 0.2);
}

#${panelId} .mode-status {
    width: 100%;
    color: var(--vp-text-muted);
    font-size: 12px;
}

#${panelId} .tab-container {
    grid-column: 1 / -1;
    grid-row: 1 / -1;
    display: grid;
    grid-template-columns: 244px minmax(0, 1fr);
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
    margin: 84px 0 0;
    padding: 0 12px 16px;
    border: 0;
    border-right: 1px solid var(--vp-border-color);
    background: rgba(0,0,0,0.16);
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
    border: 1px solid transparent;
    border-radius: 8px;
    color: var(--vp-text-muted);
    background: transparent;
    text-align: left;
    white-space: normal;
    letter-spacing: 0;
    font-size: 13px;
    line-height: 1.2;
}

#${panelId} .tab-button[style*="display: none"] {
    display: none !important;
}

#${panelId} .tab-button i {
    width: 16px;
    text-align: center;
    color: var(--vp-text-muted);
    opacity: 0.82;
}

#${panelId} .tab-button.active {
    color: var(--vp-text-color);
    border-color: var(--vp-border-strong);
    background: linear-gradient(135deg, rgba(102,215,199,0.18), rgba(255,255,255,0.035));
    box-shadow: inset 3px 0 0 var(--vp-accent-color);
}

#${panelId} .tab-button.active i {
    color: var(--vp-accent-color);
}

#${panelId} .tab-button:hover:not(.active) {
    color: var(--vp-text-color);
    border-color: rgba(255,255,255,0.09);
    background: rgba(255,255,255,0.045);
}

#${panelId} .tab-content {
    grid-column: 2;
    min-width: 0;
    min-height: 0;
    padding: 20px 22px 28px;
    overflow-y: auto;
    pointer-events: auto;
}

#${panelId} .tab-content.active {
    display: block !important;
}

#${panelId} fieldset,
#${panelId} .workflow-tools,
#${panelId} .selected-loras,
#${panelId} .selected-embeddings,
#${panelId} .prompt-preset-container,
#${panelId} .comfy-prompt-area {
    border: 1px solid var(--vp-border-color) !important;
    border-radius: 8px !important;
    background: linear-gradient(180deg, rgba(255,255,255,0.052), rgba(255,255,255,0.022)) !important;
    box-shadow: 0 1px 0 rgba(255,255,255,0.05) inset;
}

#${panelId} fieldset,
#${panelId} .workflow-tools,
#${panelId} .comfy-prompt-area {
    padding: 16px !important;
    margin-bottom: 16px !important;
}

#${panelId} legend,
#${panelId} .workflow-tools h4,
#${panelId} .selected-loras h4,
#${panelId} .selected-embeddings h4,
#${panelId} .cache-toolbar h4 {
    color: var(--vp-text-color) !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    letter-spacing: 0;
}

#${panelId} legend {
    padding: 0 8px !important;
}

#${panelId} label {
    margin-bottom: 6px;
    color: var(--vp-text-muted);
    opacity: 1;
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0;
    text-transform: none;
}

#${panelId} input[type="text"],
#${panelId} input[type="password"],
#${panelId} input[type="number"],
#${panelId} select,
#${panelId} textarea {
    min-height: 38px;
    border: 1px solid rgba(244, 235, 214, 0.16);
    border-radius: 8px;
    background: rgba(7, 9, 11, 0.55);
    color: var(--vp-text-color);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.035);
}

#${panelId} textarea {
    line-height: 1.52;
}

#${panelId} input:focus,
#${panelId} select:focus,
#${panelId} textarea:focus {
    border-color: rgba(102, 215, 199, 0.62);
    box-shadow: 0 0 0 3px rgba(102,215,199,0.12), inset 0 1px 0 rgba(255,255,255,0.04);
}

#${panelId} .comfy-settings-grid {
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 14px;
    margin-bottom: 14px;
}

#${panelId} .comfy-input-group {
    gap: 8px;
}

#${panelId} .comfy-button {
    min-height: 36px;
    padding: 8px 12px;
    border: 1px solid rgba(102, 215, 199, 0.35);
    border-radius: 8px;
    color: var(--vp-accent-strong);
    background: rgba(102, 215, 199, 0.075);
    box-shadow: none;
    text-shadow: none;
}

#${panelId} .comfy-button:hover:not(:disabled) {
    color: #101417;
    border-color: var(--vp-accent-color);
    background: var(--vp-accent-color);
    box-shadow: 0 8px 22px rgba(102, 215, 199, 0.18);
}

#${panelId} .comfy-button.error {
    color: #ffd8d3;
    border-color: rgba(255,111,97,0.4);
    background: rgba(255,111,97,0.1);
}

#${panelId} .comfy-button.error:hover:not(:disabled) {
    color: #1a0f0e;
    background: var(--vp-error-color);
}

#${panelId} .comfy-button.warning {
    color: #ffe8ad;
    border-color: rgba(233,180,76,0.42);
    background: rgba(233,180,76,0.1);
}

#${panelId} .comfy-button.warning:hover:not(:disabled) {
    color: #171207;
    background: var(--vp-warning-color);
}

#${panelId} .comfy-button.success {
    color: #d6ffe3;
    border-color: rgba(115,212,143,0.42);
    background: rgba(115,212,143,0.1);
}

#${panelId} .comfy-button.success:hover:not(:disabled) {
    color: #07140c;
    background: var(--vp-success-color);
}

#${panelId} .comfy-auto-generate-label {
    border: 1px solid var(--vp-border-color);
    border-radius: 8px;
    background: rgba(255,255,255,0.028);
    padding: 11px 12px;
}

#${panelId} .comfy-auto-generate-label:hover {
    border-color: rgba(102,215,199,0.38);
    background: rgba(102,215,199,0.06);
}

#${panelId} .comfy-auto-generate-label b {
    color: var(--vp-text-color);
    font-size: 13px;
}

#${panelId} .comfy-auto-generate-label span {
    color: var(--vp-text-muted);
}

#${panelId} input[type="checkbox"] {
    accent-color: var(--vp-accent-color);
}

#${panelId} .workflow-action-row,
#${panelId} .lora-action-row,
#${panelId} .placeholder-toolbar,
#${panelId} .cache-item-actions,
#${panelId} .comfy-ai-prompt-actions {
    gap: 8px;
}

#${panelId} .workflow-action-row {
    margin: 12px 0 14px;
}

#${panelId} .workflow-action-row .comfy-button {
    flex: 1 1 150px;
}

#${panelId} .workflow-info,
#${panelId} .comfy-hint,
#${panelId} .cache-stats {
    color: var(--vp-text-muted) !important;
}

#${panelId} .workflow-item,
#${panelId} .lora-item,
#${panelId} .embedding-item,
#${panelId} .workflow-analysis-result,
#${panelId} .img2img-preview-card,
#${panelId} .lora-bulk-panel,
#${panelId} .lora-options-row {
    border-color: var(--vp-border-color);
    border-radius: 8px;
    background: rgba(7, 9, 11, 0.42);
}

#${panelId} .workflow-item:hover,
#${panelId} .lora-item:hover,
#${panelId} .embedding-item:hover {
    background: rgba(102,215,199,0.06);
}

#${panelId} .workflow-item.active {
    border-color: rgba(102,215,199,0.48);
    background: rgba(102,215,199,0.1);
}

#${panelId} .lora-list,
#${panelId} .embedding-list,
#${panelId} .cache-grid {
    border-color: var(--vp-border-color);
    border-radius: 8px;
    background: rgba(7, 9, 11, 0.38);
}

#${panelId} .lora-group-header {
    background: rgba(102,215,199,0.14);
    color: var(--vp-accent-strong);
    border-bottom-color: var(--vp-border-color);
}

#${panelId} .selected-lora-tag,
#${panelId} .selected-embedding-tag {
    border-radius: 7px;
    color: #101417;
    background: var(--vp-accent-color);
}

#${panelId} .selected-embedding-tag {
    background: var(--vp-warning-color);
}

#${panelId} .cache-grid {
    padding: 12px;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
}

#${panelId} .cache-item {
    border-color: var(--vp-border-color);
    border-radius: 8px;
    background: rgba(255,255,255,0.035);
}

#${panelId} .cache-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 32px rgba(0,0,0,0.26);
}

.workflow-save-modal {
    width: min(440px, calc(100vw - 32px));
    border: 1px solid var(--vp-border-strong);
    border-radius: 8px;
    background: var(--vp-panel-color-strong);
    box-shadow: 0 24px 80px rgba(0,0,0,0.62);
}

.workflow-save-modal h3 {
    color: var(--vp-text-color);
    letter-spacing: 0;
}

.workflow-save-modal .overwrite-warning {
    color: var(--vp-warning-color);
    border-color: rgba(233,180,76,0.42);
    background: rgba(233,180,76,0.09);
}

.comfy-conn-status {
    width: 12px;
    height: 12px;
    margin-right: 0;
    border: 2px solid rgba(255,255,255,0.18);
}

.comfy-conn-status.connected {
    background: var(--vp-success-color);
    box-shadow: 0 0 0 4px rgba(115,212,143,0.13);
}

.comfy-conn-status.disconnected {
    background: var(--vp-error-color);
    box-shadow: 0 0 0 4px rgba(255,111,97,0.12);
}

.comfy-conn-status.checking {
    background: var(--vp-warning-color);
    box-shadow: 0 0 0 4px rgba(233,180,76,0.13);
}

.comfy-ai-prompt-panel {
    border-color: rgba(102,215,199,0.26);
    border-radius: 8px;
    background: linear-gradient(180deg, rgba(102,215,199,0.085), rgba(255,255,255,0.03));
}

.comfy-ai-prompt-header {
    color: var(--vp-text-color);
}

.comfy-ai-prompt-summary {
    border-color: var(--vp-border-color);
    border-radius: 8px;
    color: var(--vp-text-muted);
    background: rgba(7,9,11,0.36);
}

.comfy-ai-prompt-summary:hover:not(:disabled),
.comfy-ai-prompt-summary[aria-expanded="true"] {
    border-color: rgba(102,215,199,0.42);
    background: rgba(102,215,199,0.08);
}

.comfy-ai-prompt-actions .comfy-ai-prompt-action.primary {
    color: #101417;
    background: var(--vp-accent-color);
    border-color: var(--vp-accent-color);
}

.comfy-progress-bar {
    background: linear-gradient(90deg, var(--vp-accent-color), var(--vp-warning-color));
}

@media (max-width: 920px) {
    #${panelId} .comfyui-panel-content,
    #${panelId} .tab-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto minmax(0, 1fr);
    }

    #${panelId} .mode-switch-container {
        grid-column: 1;
        grid-row: 1;
        border-right: 0;
        border-bottom: 1px solid var(--vp-border-color);
    }

    #${panelId} .tab-container {
        grid-row: 2 / 4;
    }

    #${panelId} .tab-buttons {
        grid-column: 1;
        flex-direction: row;
        margin: 78px 0 0;
        padding: 10px 12px;
        border-right: 0;
        border-bottom: 1px solid var(--vp-border-color);
        overflow-x: auto;
    }

    #${panelId} .tab-button {
        width: auto;
        min-width: max-content;
    }

    #${panelId} .tab-content {
        grid-column: 1;
        padding: 16px;
    }
}

@media (max-width: 768px) {
    #${panelId} {
        border-radius: 0;
    }

    #${panelId} .panel-control-bar {
        padding: 10px 12px;
    }

    #${panelId} .panel-title-copy span {
        display: none;
    }

    #${panelId} .mode-switch-container {
        padding: 12px;
    }

    #${panelId} .tab-buttons {
        margin-top: 68px;
        padding: 8px 10px;
    }

    #${panelId} .tab-button {
        min-height: 36px;
        padding: 8px 10px;
        font-size: 12px;
    }

    #${panelId} .comfy-settings-grid,
    #${panelId} .comfy-ai-key-list-grid,
    #${panelId} .comfy-ai-rule-preset-grid {
        grid-template-columns: 1fr !important;
    }

    #${panelId} .comfy-inline-actions,
    #${panelId} .workflow-action-row,
    #${panelId} .lora-action-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }

    #${panelId} .comfy-inline-actions .comfy-button,
    #${panelId} .workflow-action-row .comfy-button,
    #${panelId} .lora-action-row .comfy-button {
        width: 100%;
    }

    #${panelId} .cache-grid {
        grid-template-columns: 1fr;
    }
}
    `;
}
