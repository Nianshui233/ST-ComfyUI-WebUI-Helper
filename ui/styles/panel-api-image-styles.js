export function getPanelApiImageStyles({ panelId }) {
    return `
        #${panelId} .api-image-hero {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--vp-space-4);
            margin: 0 0 var(--vp-space-4);
            padding: 14px 15px;
            border: 1px solid rgba(156, 199, 255, 0.22);
            border-radius: var(--vp-radius-md);
            background:
                linear-gradient(135deg, rgba(156, 199, 255, 0.12), rgba(102, 215, 199, 0.055)),
                rgba(255, 255, 255, 0.025);
        }

        #${panelId} .api-image-hero strong {
            display: block;
            margin-bottom: 4px;
            color: var(--vp-text-color);
            font-size: 14px;
        }

        #${panelId} .api-image-hero span {
            color: var(--vp-text-muted);
            font-size: 12px;
            line-height: 1.45;
        }

        #${panelId} .api-image-pill {
            flex-shrink: 0;
            padding: 6px 10px;
            color: #dcecff !important;
            font-size: 11px !important;
            font-weight: 700;
            border: 1px solid rgba(156, 199, 255, 0.35);
            border-radius: var(--vp-radius-pill);
            background: rgba(156, 199, 255, 0.12);
        }

        #${panelId} .api-image-key-actions {
            justify-content: flex-start;
            margin: -4px 0 var(--vp-space-3);
        }

        #${panelId} .api-image-reliability-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: var(--vp-space-3);
            margin-bottom: var(--vp-space-4);
        }

        #${panelId} .api-negative-prompt-area {
            margin-top: 0;
            margin-bottom: var(--vp-space-3);
            padding: 0;
            border: 0;
            background: transparent;
            box-shadow: none;
        }

        #${panelId} .api-image-code-textarea,
        #${panelId} #comfyui-api-image-custom-headers {
            min-height: 132px;
            font-family: ui-monospace, SFMono-Regular, Consolas, 'Cascadia Mono', monospace;
            font-size: 12px;
            line-height: 1.5;
            tab-size: 2;
        }

        #${panelId} .api-custom-json-section .comfy-hint code {
            color: var(--vp-accent-strong);
        }

        @media (max-width: 760px) {
            #${panelId} .api-image-reliability-grid {
                grid-template-columns: 1fr;
            }
        }
`;
}
