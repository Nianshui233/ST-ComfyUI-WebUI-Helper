export function getChatImageStyles({ panelId, buttonId }) {
    return `        /* ---------- In-chat: generated image ---------- */
        .comfy-image-container {
            position: relative;
            display: block;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            margin-top: var(--vp-space-3);
            overflow: hidden;
            clear: both;
            contain: layout paint;
            transform: translateZ(0);
        }

        body.comfy-helper-paused .comfy-ai-prompt-panel,
        body.comfy-helper-paused .comfy-button-group,
        body.comfy-helper-paused .comfy-image-container,
        body.comfy-helper-paused .comfy-progress-container,
        body.comfy-helper-paused .comfy-compare-container,
        body.comfy-helper-paused .comfy-compare-actions {
            display: none !important;
            pointer-events: none !important;
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
        .comfy-image-container-updating::after {
            content: '生成中...';
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--vp-accent-color);
            font-size: 12px;
            font-weight: 650;
            letter-spacing: 0;
            background: rgba(0, 0, 0, 0.32);
            border-radius: var(--vp-radius-md);
            pointer-events: none;
        }
        .comfy-image-container-updating img {
            opacity: 0.58;
            filter: saturate(0.82);
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
        .comfy-api-telemetry {
            margin-top: var(--vp-space-2);
            padding: 9px 10px;
            color: var(--vp-text-muted);
            font-size: 11px;
            line-height: 1.35;
            border: 1px solid rgba(156, 199, 255, 0.22);
            border-radius: var(--vp-radius-md);
            background: linear-gradient(135deg, rgba(156, 199, 255, 0.08), rgba(255, 255, 255, 0.025));
        }
        .comfy-api-telemetry[hidden] { display: none !important; }
        .comfy-api-telemetry-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--vp-space-2);
            margin-bottom: 7px;
        }
        .comfy-api-telemetry-head b {
            min-width: 0;
            overflow: hidden;
            color: var(--vp-text-color);
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .comfy-api-telemetry-head span {
            flex-shrink: 0;
            color: var(--vp-api-color, #9cc7ff);
            font-variant-numeric: tabular-nums;
        }
        .comfy-api-telemetry-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
        }
        .comfy-api-telemetry-grid span {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .comfy-api-telemetry-grid em {
            margin-right: 4px;
            color: var(--vp-text-dim);
            font-style: normal;
        }

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
`;
}
