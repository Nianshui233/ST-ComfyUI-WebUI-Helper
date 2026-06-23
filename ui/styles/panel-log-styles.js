export function getPanelLogStyles({ panelId }) {
    return `
        #${panelId} .comfy-log-header {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: var(--vp-space-4);
            align-items: start;
            margin-bottom: var(--vp-space-4);
            padding-bottom: var(--vp-space-4);
            border-bottom: 1px solid var(--vp-border-color);
        }

        #${panelId} .comfy-log-header h4 {
            margin: 0 0 var(--vp-space-2);
            color: var(--vp-text-color);
            font-size: 17px;
            line-height: 1.2;
        }

        #${panelId} .comfy-log-header p {
            margin: 0;
            max-width: 820px;
            color: var(--vp-text-muted);
            font-size: 13px;
            line-height: 1.55;
        }

        #${panelId} .comfy-log-stats {
            display: grid;
            grid-template-columns: repeat(3, minmax(78px, 1fr));
            gap: var(--vp-space-2);
            min-width: 280px;
        }

        #${panelId} .comfy-log-stats span {
            display: grid;
            gap: 3px;
            padding: 10px 12px;
            color: var(--vp-text-muted);
            font-size: 11px;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: var(--vp-surface-1);
        }

        #${panelId} .comfy-log-stats b {
            color: var(--vp-text-color);
            font-size: 18px;
            line-height: 1;
        }

        #${panelId} .comfy-log-stats .warning b { color: var(--vp-warning-color); }
        #${panelId} .comfy-log-stats .error b { color: var(--vp-error-color); }

        #${panelId} .comfy-log-notes {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: var(--vp-space-3);
            margin-bottom: var(--vp-space-4);
        }

        #${panelId} .comfy-log-notes div {
            display: grid;
            grid-template-columns: 18px minmax(0, 1fr);
            gap: var(--vp-space-2);
            align-items: start;
            min-height: 54px;
            padding: 11px 12px;
            color: var(--vp-text-muted);
            font-size: 12px;
            line-height: 1.45;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(255, 255, 255, 0.026);
        }

        #${panelId} .comfy-log-notes i {
            color: var(--vp-accent-color);
            line-height: 1.4;
        }

        #${panelId} .comfy-log-toolbar {
            display: grid;
            grid-template-columns: 150px minmax(220px, 1fr) auto;
            gap: var(--vp-space-3);
            align-items: end;
            margin-bottom: var(--vp-space-4);
        }

        #${panelId} .comfy-log-toolbar label {
            margin: 0;
        }

        #${panelId} .comfy-log-toolbar label span {
            display: block;
            margin-bottom: 6px;
        }

        #${panelId} .comfy-log-actions {
            display: inline-flex;
            gap: var(--vp-space-2);
            justify-content: flex-end;
            flex-wrap: wrap;
        }

        #${panelId} .comfy-log-actions .comfy-button {
            min-width: 76px;
        }

        #${panelId} .comfy-log-list-wrap {
            min-height: 360px;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: rgba(7, 9, 11, 0.36);
            overflow: hidden;
        }

        #${panelId} .comfy-log-empty {
            padding: 30px 18px;
            color: var(--vp-text-muted);
            font-size: 13px;
            text-align: center;
        }

        #${panelId} .comfy-log-list {
            display: grid;
            gap: 1px;
        }

        #${panelId} .comfy-log-entry {
            display: grid;
            gap: 7px;
            padding: 12px 14px;
            border-left: 3px solid rgba(244, 235, 214, 0.18);
            background: rgba(255, 255, 255, 0.025);
        }

        #${panelId} .comfy-log-entry:nth-child(even) {
            background: rgba(255, 255, 255, 0.038);
        }

        #${panelId} .comfy-log-entry.log-success { border-left-color: var(--vp-success-color); }
        #${panelId} .comfy-log-entry.log-warning { border-left-color: var(--vp-warning-color); }
        #${panelId} .comfy-log-entry.log-error { border-left-color: var(--vp-error-color); }
        #${panelId} .comfy-log-entry.log-debug { border-left-color: #9aa0ff; }
        #${panelId} .comfy-log-entry.log-info { border-left-color: var(--vp-accent-color); }
        #${panelId} .comfy-log-entry.log-ai-prompt {
            border-left-color: var(--vp-warning-color);
            background: linear-gradient(90deg, rgba(233, 180, 76, 0.08), rgba(255, 255, 255, 0.03));
        }
        #${panelId} .comfy-log-entry.log-api-image {
            border-left-color: var(--vp-api-color, #9cc7ff);
            background: linear-gradient(90deg, rgba(156, 199, 255, 0.09), rgba(255, 255, 255, 0.03));
        }

        #${panelId} .comfy-log-entry.log-debug {
            opacity: 0.72;
        }

        #${panelId} .comfy-log-entry-head {
            display: flex;
            align-items: center;
            gap: var(--vp-space-2);
            min-width: 0;
            color: var(--vp-text-dim);
            font-size: 11px;
            line-height: 1.2;
        }

        #${panelId} .comfy-log-level {
            min-width: 42px;
            padding: 3px 7px;
            color: var(--vp-text-color);
            text-align: center;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-pill);
            background: rgba(255, 255, 255, 0.06);
        }

        #${panelId} .log-success .comfy-log-level {
            color: #d6ffe3;
            border-color: rgba(115, 212, 143, 0.35);
        }

        #${panelId} .log-warning .comfy-log-level {
            color: #ffe8ad;
            border-color: rgba(233, 180, 76, 0.42);
        }

        #${panelId} .log-error .comfy-log-level {
            color: #ffd8d3;
            border-color: rgba(255, 111, 97, 0.45);
        }

        #${panelId} .comfy-log-source {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        #${panelId} .comfy-log-message {
            min-width: 0;
            color: var(--vp-text-color);
            font-size: 13px;
            line-height: 1.48;
            word-break: break-word;
        }

        #${panelId} .comfy-log-details {
            max-height: 220px;
            margin: 0;
            padding: 10px 11px;
            overflow: auto;
            color: var(--vp-text-muted);
            font: 12px/1.45 Consolas, 'Cascadia Mono', 'SFMono-Regular', monospace;
            white-space: pre-wrap;
            word-break: break-word;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-sm);
            background: rgba(0, 0, 0, 0.26);
        }

        @media (max-width: 920px) {
            #${panelId} .comfy-log-header,
            #${panelId} .comfy-log-toolbar,
            #${panelId} .comfy-log-notes {
                grid-template-columns: 1fr;
            }

            #${panelId} .comfy-log-stats {
                min-width: 0;
            }

            #${panelId} .comfy-log-actions {
                justify-content: stretch;
            }

            #${panelId} .comfy-log-actions .comfy-button {
                flex: 1 1 92px;
            }
        }
`;
}
