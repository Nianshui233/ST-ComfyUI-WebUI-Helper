export function getPanelLogStyles({ panelId }) {
    return `
        #${panelId} #tab-logs {
            --log-bg: #0d1014;
            --log-bar: #171b21;
            --log-bar-raised: #1d2229;
            --log-border: #2a3038;
            --log-border-strong: #3a424d;
            --log-text: #d7dee7;
            --log-meta: #828c98;
            --log-muted: #9aa4af;
            --log-info: #6fb5e8;
            --log-success: #76c995;
            --log-warning: #e2b55f;
            --log-error: #ee746c;
            --log-debug: #9b91cf;
            box-sizing: border-box;
            color: var(--log-text);
            font-family: 'Cascadia Mono', Consolas, ui-monospace, monospace;
            letter-spacing: 0;
            background: var(--log-bg);
        }

        #${panelId} #tab-logs.active {
            display: grid !important;
            grid-template-rows: auto minmax(0, 1fr);
            padding: 0;
            overflow: hidden;
        }

        #${panelId} #tab-logs *,
        #${panelId} #tab-logs *::before,
        #${panelId} #tab-logs *::after {
            box-sizing: border-box;
        }

        #${panelId} .comfy-log-sr-only {
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        }

        #${panelId} .comfy-log-command-bar {
            display: grid;
            grid-template-columns: auto minmax(260px, 1fr) auto;
            align-items: center;
            gap: 12px;
            min-width: 0;
            min-height: 54px;
            padding: 9px 12px;
            border-bottom: 1px solid var(--log-border);
            background: var(--log-bar);
        }

        #${panelId} .comfy-log-title {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            min-width: max-content;
            color: var(--log-text);
        }

        #${panelId} .comfy-log-title i {
            color: var(--log-info);
            font-size: 14px;
        }

        #${panelId} .comfy-log-title h4 {
            margin: 0;
            color: inherit;
            font: 600 13px/1.2 'Cascadia Mono', Consolas, ui-monospace, monospace;
            letter-spacing: 0;
        }

        #${panelId} .comfy-log-filters {
            display: grid;
            grid-template-columns: 154px minmax(160px, 440px);
            justify-content: end;
            gap: 8px;
            min-width: 0;
        }

        #${panelId} .comfy-log-level-field,
        #${panelId} .comfy-log-search-field {
            position: relative;
            min-width: 0;
            margin: 0;
        }

        #${panelId} #comfyui-log-level,
        #${panelId} #comfyui-log-search {
            width: 100%;
            min-width: 0;
            min-height: 34px;
            height: 34px;
            margin: 0;
            color: var(--log-text);
            font: 12px/1.2 'Cascadia Mono', Consolas, ui-monospace, monospace;
            letter-spacing: 0;
            border: 1px solid var(--log-border);
            border-radius: 4px;
            background: #101419;
            box-shadow: none;
        }

        #${panelId} #comfyui-log-level {
            padding: 6px 28px 6px 9px;
            color-scheme: dark;
        }

        #${panelId} #comfyui-log-level option {
            color: var(--log-text) !important;
            background: #101419 !important;
        }

        #${panelId} #comfyui-log-search {
            padding: 6px 10px 6px 31px;
            -webkit-appearance: none;
            appearance: none;
        }

        #${panelId} #comfyui-log-search::-webkit-search-cancel-button {
            filter: invert(0.75);
        }

        #${panelId} #comfyui-log-search::placeholder {
            color: var(--log-meta);
            opacity: 1;
        }

        #${panelId} .comfy-log-search-field > i {
            position: absolute;
            top: 50%;
            left: 10px;
            z-index: 1;
            color: var(--log-meta);
            font-size: 11px;
            transform: translateY(-50%);
            pointer-events: none;
        }

        #${panelId} #comfyui-log-level:hover,
        #${panelId} #comfyui-log-search:hover {
            border-color: var(--log-border-strong);
            background: #13181e;
        }

        #${panelId} #comfyui-log-level:focus,
        #${panelId} #comfyui-log-search:focus {
            border-color: var(--log-info);
            outline: none;
            box-shadow: 0 0 0 2px rgba(111, 181, 232, 0.24);
        }

        #${panelId} .comfy-log-actions {
            display: inline-flex;
            align-items: center;
            justify-content: flex-end;
            gap: 4px;
            min-width: 0;
        }

        #${panelId} .comfy-log-icon-button {
            display: inline-grid;
            place-items: center;
            flex: 0 0 34px;
            width: 34px;
            min-width: 34px;
            height: 34px;
            min-height: 34px;
            margin: 0;
            padding: 0;
            cursor: pointer;
            color: var(--log-muted);
            font: 13px/1 'Cascadia Mono', Consolas, ui-monospace, monospace;
            border: 1px solid transparent;
            border-radius: 4px;
            background-color: transparent !important;
            box-shadow: none;
        }

        #${panelId} .comfy-log-icon-button:hover {
            color: var(--log-text);
            border-color: var(--log-border);
            background-color: var(--log-bar-raised) !important;
        }

        #${panelId} .comfy-log-icon-button[aria-pressed="true"] {
            color: var(--log-info);
            border-color: rgba(111, 181, 232, 0.28);
            background-color: rgba(111, 181, 232, 0.1) !important;
        }

        #${panelId} .comfy-log-clear-button:hover {
            color: var(--log-error);
            border-color: rgba(238, 116, 108, 0.38);
            background-color: rgba(238, 116, 108, 0.1) !important;
        }

        #${panelId} .comfy-log-icon-button:focus-visible,
        #${panelId} .comfy-log-new-button:focus-visible,
        #${panelId} .comfy-log-viewport:focus-visible {
            outline: 2px solid var(--log-info);
            outline-offset: -2px;
        }

        #${panelId} .comfy-log-action-divider {
            width: 1px;
            height: 20px;
            margin: 0 3px;
            background: var(--log-border);
        }

        #${panelId} .comfy-log-console {
            display: grid;
            grid-template-rows: minmax(0, 1fr) auto;
            min-width: 0;
            min-height: 0;
            overflow: hidden;
            background: var(--log-bg);
        }

        #${panelId} .comfy-log-viewport-shell {
            position: relative;
            display: grid;
            grid-template-rows: minmax(0, 1fr) auto;
            min-width: 0;
            min-height: 0;
            overflow: hidden;
        }

        #${panelId} .comfy-log-viewport {
            position: relative;
            width: 100%;
            height: auto;
            min-width: 0;
            min-height: 0;
            overflow: auto;
            overscroll-behavior: contain;
            scrollbar-color: #414a55 #101419;
            scrollbar-width: thin;
            background: var(--log-bg);
        }

        #${panelId} .comfy-log-viewport::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }

        #${panelId} .comfy-log-viewport::-webkit-scrollbar-track {
            background: #101419;
        }

        #${panelId} .comfy-log-viewport::-webkit-scrollbar-thumb {
            border: 2px solid #101419;
            border-radius: 6px;
            background: #414a55;
            background-clip: padding-box;
        }

        #${panelId} .comfy-log-empty {
            position: absolute;
            inset: 0;
            z-index: 1;
            display: grid;
            place-content: center;
            justify-items: center;
            gap: 12px;
            min-height: 180px;
            padding: 24px;
            color: var(--log-meta);
            font-size: 12px;
            text-align: center;
            background: var(--log-bg);
        }

        #${panelId} .comfy-log-empty[hidden],
        #${panelId} .comfy-log-details[hidden],
        #${panelId} .comfy-log-new[hidden],
        #${panelId} .comfy-log-new-button[hidden] {
            display: none !important;
        }

        #${panelId} .comfy-log-empty i {
            color: #4c5662;
            font-size: 21px;
        }

        #${panelId} .comfy-log-list {
            display: block;
            min-width: min-content;
        }

        #${panelId} .comfy-log-entry {
            position: relative;
            display: grid;
            grid-template-columns: 18px 82px 48px minmax(110px, 150px) minmax(240px, 1fr);
            column-gap: 10px;
            row-gap: 7px;
            min-width: 680px;
            padding: 9px 14px 10px 17px;
            color: var(--log-text);
            border: 0;
            border-bottom: 1px solid #1d2229;
            border-radius: 0;
            background: transparent;
        }

        #${panelId} .comfy-log-entry::before {
            content: '';
            position: absolute;
            inset: 0 auto 0 0;
            width: 3px;
            background: var(--log-info);
            opacity: 0.85;
        }

        #${panelId} .comfy-log-entry:hover {
            background: #12161b;
        }

        #${panelId} .comfy-log-entry.log-success::before { background: var(--log-success); }
        #${panelId} .comfy-log-entry.log-warning::before { background: var(--log-warning); }
        #${panelId} .comfy-log-entry.log-error::before { background: var(--log-error); }
        #${panelId} .comfy-log-entry.log-debug::before { background: var(--log-debug); }
        #${panelId} .comfy-log-entry.log-info::before { background: var(--log-info); }

        #${panelId} .comfy-log-entry.log-warning {
            background: rgba(226, 181, 95, 0.035);
        }

        #${panelId} .comfy-log-entry.log-error {
            background: rgba(238, 116, 108, 0.05);
        }

        #${panelId} .comfy-log-entry.log-ai-prompt {
            background: rgba(226, 181, 95, 0.035);
        }

        #${panelId} .comfy-log-entry.log-api-image {
            background: rgba(111, 181, 232, 0.04);
        }

        #${panelId} .comfy-log-detail-toggle,
        #${panelId} .comfy-log-detail-spacer {
            align-self: start;
            width: 18px;
            min-width: 18px;
            height: 18px;
            margin: 0;
        }

        #${panelId} .comfy-log-detail-toggle {
            display: grid;
            place-items: center;
            padding: 0;
            cursor: pointer;
            color: var(--log-meta);
            font-size: 9px;
            line-height: 1;
            border: 1px solid transparent;
            border-radius: 3px;
            background: transparent;
            box-shadow: none;
        }

        #${panelId} .comfy-log-detail-toggle:hover {
            color: var(--log-text);
            border-color: var(--log-border-strong);
            background: var(--log-bar-raised);
        }

        #${panelId} .comfy-log-detail-toggle:focus-visible {
            color: var(--log-text);
            outline: 2px solid var(--log-info);
            outline-offset: 1px;
        }

        #${panelId} .comfy-log-level {
            min-width: 0;
            padding: 0;
            color: var(--log-info);
            font-weight: 700;
            text-align: left;
            border: 0;
            border-radius: 0;
            background: transparent;
        }

        #${panelId} .log-success .comfy-log-level { color: var(--log-success); }
        #${panelId} .log-warning .comfy-log-level { color: var(--log-warning); }
        #${panelId} .log-error .comfy-log-level { color: var(--log-error); }
        #${panelId} .log-debug .comfy-log-level { color: var(--log-debug); }

        #${panelId} .comfy-log-time {
            min-width: 0;
            color: var(--log-meta);
            font-size: 11px;
            line-height: 1.55;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }

        #${panelId} .comfy-log-source {
            min-width: 0;
            overflow: hidden;
            color: var(--log-muted);
            font-size: 11px;
            line-height: 1.55;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        #${panelId} .comfy-log-message {
            min-width: 0;
            color: var(--log-text);
            font-size: 12px;
            line-height: 1.55;
            overflow-wrap: anywhere;
            white-space: pre-wrap;
        }

        #${panelId} .comfy-log-details {
            grid-column: 2 / -1;
            margin: 0;
            padding: 4px 0 4px 13px;
            overflow: visible;
            color: #aab4bf;
            font: 11px/1.55 'Cascadia Mono', Consolas, ui-monospace, monospace;
            letter-spacing: 0;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            border: 0;
            border-left: 1px solid var(--log-border-strong);
            border-radius: 0;
            background: transparent;
        }

        #${panelId} .comfy-log-viewport.is-nowrap .comfy-log-entry {
            grid-template-columns: 18px 82px 48px 180px max-content;
        }

        #${panelId} .comfy-log-viewport.is-nowrap .comfy-log-message,
        #${panelId} .comfy-log-viewport.is-nowrap .comfy-log-details {
            white-space: pre;
            overflow-wrap: normal;
        }

        #${panelId} .comfy-log-new-button {
            position: relative;
            z-index: 2;
            display: inline-flex;
            align-items: center;
            justify-self: end;
            gap: 7px;
            min-height: 32px;
            margin: 8px 12px;
            padding: 6px 10px;
            cursor: pointer;
            color: #0d1014;
            font: 700 11px/1 'Cascadia Mono', Consolas, ui-monospace, monospace;
            letter-spacing: 0;
            border: 1px solid #89c5ee;
            border-color: #89c5ee !important;
            border-radius: 4px;
            color: #0d1014 !important;
            background-color: var(--log-info) !important;
            box-shadow: 0 5px 18px rgba(0, 0, 0, 0.32);
        }

        #${panelId} .comfy-log-status-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            min-width: 0;
            min-height: 30px;
            padding: 6px 12px;
            color: var(--log-meta);
            font-size: 10px;
            line-height: 1.3;
            border-top: 1px solid var(--log-border);
            background: var(--log-bar);
        }

        #${panelId} .comfy-log-status-primary,
        #${panelId} .comfy-log-status-meta {
            display: inline-flex;
            align-items: center;
            gap: 13px;
            min-width: 0;
            white-space: nowrap;
        }

        #${panelId} .comfy-log-status-bar b {
            color: var(--log-text);
            font-weight: 600;
            font-variant-numeric: tabular-nums;
        }

        #${panelId} .comfy-log-warning-stat b { color: var(--log-warning); }
        #${panelId} .comfy-log-error-stat b { color: var(--log-error); }

        #${panelId} .comfy-log-status-meta span {
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }

        #${panelId} .comfy-log-status-meta i {
            color: #68737f;
            font-size: 9px;
        }

        #${panelId} .comfy-log-live-state.is-live,
        #${panelId} .comfy-log-live-state:not(.is-paused) {
            color: var(--log-success);
            font-weight: 700;
        }

        #${panelId} .comfy-log-live-indicator {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--log-success);
            box-shadow: 0 0 0 2px rgba(118, 201, 149, 0.13);
        }

        #${panelId} .comfy-log-live-state.is-paused {
            color: var(--log-warning);
            font-weight: 700;
        }

        #${panelId} .comfy-log-status-primary:has(.comfy-log-live-state.is-paused) .comfy-log-live-indicator {
            background: var(--log-warning);
            box-shadow: 0 0 0 2px rgba(226, 181, 95, 0.13);
        }

        #${panelId} .comfy-log-console:has(.comfy-log-viewport.is-nowrap) #comfyui-log-wrap-state {
            color: var(--log-warning);
        }

        @media (max-width: 980px) {
            #${panelId} .comfy-log-command-bar {
                grid-template-columns: auto minmax(220px, 1fr);
            }

            #${panelId} .comfy-log-actions {
                grid-column: 1 / -1;
                justify-content: flex-end;
            }
        }

        @media (max-width: 920px) {
            #${panelId} #tab-logs.active {
                grid-row: 2 / -1;
            }
        }

        @media (max-width: 700px) {
            #${panelId} .comfy-log-command-bar {
                grid-template-columns: minmax(0, 1fr) auto;
                gap: 8px;
                padding: 8px;
            }

            #${panelId} .comfy-log-title {
                grid-column: 1;
            }

            #${panelId} .comfy-log-actions {
                grid-column: 2;
                grid-row: 1;
            }

            #${panelId} .comfy-log-filters {
                grid-column: 1 / -1;
                grid-row: 2;
                grid-template-columns: minmax(116px, 0.42fr) minmax(150px, 1fr);
                justify-content: stretch;
            }

            #${panelId} .comfy-log-action-divider {
                display: none;
            }

            #${panelId} .comfy-log-entry {
                grid-template-columns: 18px 74px 46px minmax(0, 1fr);
                gap: 4px;
                min-width: 0;
                padding: 9px 10px 10px 14px;
            }

            #${panelId} .comfy-log-message {
                grid-column: 2 / -1;
            }

            #${panelId} .comfy-log-details {
                grid-column: 2 / -1;
                margin-left: 0;
            }

            #${panelId} .comfy-log-viewport.is-nowrap .comfy-log-entry {
                grid-template-columns: 18px 74px 46px 180px max-content;
                min-width: 620px;
            }

            #${panelId} .comfy-log-viewport.is-nowrap .comfy-log-message {
                grid-column: auto;
            }

            #${panelId} .comfy-log-status-bar {
                display: grid;
                gap: 5px;
                padding-block: 6px;
            }

            #${panelId} .comfy-log-status-primary,
            #${panelId} .comfy-log-status-meta {
                justify-content: space-between;
                gap: 8px;
                width: 100%;
            }
        }

        @media (max-width: 430px) {
            #${panelId} .comfy-log-title h4 {
                font-size: 12px;
            }

            #${panelId} .comfy-log-icon-button {
                flex-basis: 30px;
                width: 30px;
                min-width: 30px;
                height: 30px;
                min-height: 30px;
            }

            #${panelId} #comfyui-log-level,
            #${panelId} #comfyui-log-search {
                font-size: 11px;
            }

            #${panelId} .comfy-log-status-meta > span:nth-child(2) {
                display: none;
            }
        }
    `;
}
