export function getChatImageStyles({ panelId, buttonId }) {
    return `        /* ---------- In-chat: generated image ---------- */
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
`;
}
