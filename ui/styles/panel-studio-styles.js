export function getPanelStudioStyles({ panelId }) {
    return `
        .comfy-studio-layout { display: grid; gap: var(--vp-space-5); }
        .comfy-studio-section {
            padding: 0 0 var(--vp-space-5);
            border-bottom: 1px solid var(--vp-border-color);
        }
        .comfy-studio-section:last-child { border-bottom: 0; }
        .comfy-studio-heading,
        .comfy-task-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: var(--vp-space-3);
            margin-bottom: var(--vp-space-4);
        }
        .comfy-studio-heading h4,
        .comfy-task-toolbar h4 { margin: 0 0 3px; color: var(--vp-text-color); font-size: 15px; letter-spacing: 0; }
        .comfy-studio-heading span,
        .comfy-task-toolbar span { color: var(--vp-text-muted); font-size: 12px; }
        .comfy-studio-heading-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--vp-space-2); }
        .comfy-profile-selector-row,
        .comfy-profile-binding,
        .comfy-studio-footer { display: flex; align-items: end; gap: var(--vp-space-2); margin-bottom: var(--vp-space-3); }
        .comfy-profile-selector-row select { flex: 1; }
        .comfy-profile-binding label { flex: 1; }
        .comfy-profile-binding button { flex: 0 0 auto; }
        .comfy-studio-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--vp-space-3); }
        .comfy-studio-form-grid.compact { grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: end; }
        .comfy-studio-form-grid label,
        .comfy-profile-binding label { min-width: 0; }
        .comfy-profile-outfits {
            margin: var(--vp-space-4) 0;
            padding: var(--vp-space-3) 0;
            border-top: 1px solid var(--vp-border-color);
            border-bottom: 1px solid var(--vp-border-color);
        }
        .comfy-section-label { margin-bottom: var(--vp-space-2); color: var(--vp-accent-color); font-size: 12px; font-weight: 700; }
        .comfy-inline-check { display: inline-flex !important; align-items: center; gap: 6px; white-space: nowrap; }
        .comfy-inline-check input { width: auto !important; }
        .comfy-file-button { position: relative; cursor: pointer; }
        .comfy-studio-footer { justify-content: space-between; margin-top: var(--vp-space-3); }
        #${panelId} .comfy-tag-action-button {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            width: auto;
            min-height: 34px;
            margin: 0;
            padding: 7px 10px;
            font-size: 11px;
        }
        #${panelId} .comfy-tag-controls {
            display: grid;
            grid-template-columns: minmax(220px, 0.38fr) minmax(320px, 1fr);
            gap: var(--vp-space-3);
            margin-bottom: var(--vp-space-4);
            padding: 12px;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-md);
            background: var(--vp-surface-1);
        }
        #${panelId} .comfy-tag-control { min-width: 0; }
        #${panelId} .comfy-tag-control > label {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            align-items: baseline;
            gap: 8px;
            margin: 0 0 7px;
        }
        #${panelId} .comfy-tag-control > label b { color: var(--vp-text-color); font-size: 12px; }
        #${panelId} .comfy-tag-control > label small {
            overflow: hidden;
            color: var(--vp-text-dim);
            font-weight: 400;
            text-align: right;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        #${panelId} .comfy-tag-control select,
        #${panelId} #danbooru-tag-search {
            width: 100%;
            min-width: 0;
            min-height: 38px;
            height: 38px;
            margin: 0;
            box-sizing: border-box;
        }
        #${panelId} .comfy-tag-search-field {
            position: relative;
            display: block;
            min-width: 0;
            margin: 0;
        }
        #${panelId} #danbooru-tag-search {
            padding: 8px 12px 8px 34px;
            color: var(--vp-text-color);
            font: 12px/1.2 var(--vp-font-mono);
            border: 1px solid var(--vp-border-strong);
            border-radius: var(--vp-radius-md);
            background: var(--vp-surface-sunken);
            appearance: none;
        }
        #${panelId} #danbooru-tag-search:focus {
            outline: none;
            border-color: var(--vp-accent-color);
            box-shadow: 0 0 0 3px var(--vp-glow-color);
        }
        #${panelId} #danbooru-tag-search:disabled {
            color: var(--vp-text-dim);
            border-color: var(--vp-border-color);
            background: var(--vp-surface-2);
            cursor: not-allowed;
            opacity: 0.72;
        }
        #${panelId} .comfy-tag-search-field > i {
            position: absolute;
            top: 50%;
            left: 12px;
            z-index: 1;
            color: var(--vp-text-dim);
            font-size: 11px;
            transform: translateY(-50%);
            pointer-events: none;
        }
        .comfy-tag-preset-section { margin-bottom: var(--vp-space-4); }
        .comfy-tag-library-section { padding-top: var(--vp-space-3); border-top: 1px solid var(--vp-border-color); }
        .comfy-tag-subheading {
            display: flex;
            justify-content: space-between;
            align-items: end;
            gap: var(--vp-space-3);
            margin-bottom: var(--vp-space-2);
        }
        .comfy-tag-subheading > div { display: flex; align-items: baseline; gap: 9px; min-width: 0; }
        .comfy-tag-subheading b { color: var(--vp-text-color); font-size: 12px; }
        .comfy-tag-subheading span,
        .comfy-tag-subheading small { color: var(--vp-text-dim); font-size: 10px; }
        .comfy-tag-preset-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 6px;
        }
        #${panelId} .comfy-tag-preset {
            display: grid;
            grid-template-columns: minmax(88px, 0.42fr) minmax(0, 1fr);
            align-items: center;
            gap: 10px;
            min-width: 0;
            min-height: 54px;
            padding: 8px 10px;
            color: var(--vp-text-color);
            text-align: left;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-sm);
            background: var(--vp-surface-1);
            cursor: pointer;
        }
        #${panelId} .comfy-tag-preset:hover,
        #${panelId} .comfy-tag-preset:focus-visible {
            outline: none;
            border-color: var(--vp-accent-border);
            background: var(--vp-accent-soft);
        }
        .comfy-tag-preset > span { display: grid; gap: 2px; min-width: 0; }
        .comfy-tag-preset b { color: var(--vp-text-color); font-size: 12px; }
        .comfy-tag-preset small { color: var(--vp-text-muted); font-size: 10px; }
        .comfy-tag-preset code {
            overflow: hidden;
            color: var(--vp-accent-color);
            font: 10px/1.35 var(--vp-font-mono);
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .comfy-tag-results {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
            gap: 6px;
            max-height: 360px;
            overflow-y: auto;
            min-height: 90px;
            padding: 0;
        }
        #${panelId} .comfy-tag-result {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: center;
            min-width: 0;
            min-height: 48px;
            padding: 8px 10px;
            color: var(--vp-text-color);
            text-align: left;
            border: 1px solid var(--vp-border-color);
            border-radius: var(--vp-radius-sm);
            background: var(--vp-surface-1);
            cursor: pointer;
        }
        .comfy-tag-result:hover { border-color: var(--vp-accent-border); background: var(--vp-accent-soft); }
        .comfy-tag-result b { max-width: 100%; overflow: hidden; text-overflow: ellipsis; font-size: 12px; }
        .comfy-tag-result span { color: var(--vp-text-dim); font-size: 10px; }
        .comfy-tag-empty {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: 28px minmax(0, 1fr) auto;
            align-items: center;
            gap: 12px;
            min-height: 90px;
            padding: 12px 14px;
            border: 1px dashed var(--vp-border-strong);
            border-radius: var(--vp-radius-md);
            background: var(--vp-surface-1);
        }
        .comfy-tag-empty > i { color: var(--vp-accent-color); font-size: 17px; text-align: center; }
        .comfy-tag-empty > div { display: grid; gap: 3px; min-width: 0; }
        .comfy-tag-empty b { color: var(--vp-text-color); font-size: 12px; }
        .comfy-tag-empty span { color: var(--vp-text-muted); font-size: 11px; line-height: 1.45; }
        #${panelId} .comfy-tag-empty .comfy-button {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            width: auto;
            white-space: nowrap;
        }
        .comfy-tag-format-example { margin-top: var(--vp-space-2); border-top: 1px solid var(--vp-border-color); }
        .comfy-tag-format-example summary {
            padding: 9px 2px 4px;
            color: var(--vp-text-muted);
            font-size: 11px;
            cursor: pointer;
        }
        .comfy-tag-format-example summary i { margin-right: 6px; color: var(--vp-accent-color); }
        .comfy-tag-format-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--vp-space-2);
            padding-top: var(--vp-space-2);
        }
        .comfy-tag-format-grid > div { display: grid; gap: 5px; min-width: 0; }
        .comfy-tag-format-grid b { color: var(--vp-text-muted); font-size: 10px; }
        .comfy-tag-format-grid code {
            display: block;
            overflow-x: auto;
            padding: 8px 10px;
            color: var(--vp-text-muted);
            font: 10px/1.5 var(--vp-font-mono);
            border: 1px solid var(--vp-border-color);
            background: var(--vp-surface-sunken);
            white-space: nowrap;
        }

        .comfy-task-list { display: grid; gap: 1px; overflow: hidden; border: 1px solid var(--vp-border-color); border-radius: var(--vp-radius-md); }
        .comfy-task-row {
            display: grid;
            grid-template-columns: 18px minmax(0, 1fr) auto;
            gap: var(--vp-space-3);
            align-items: center;
            min-height: 68px;
            padding: 10px 12px;
            background: var(--vp-surface-1);
        }
        .comfy-task-state span { display: block; width: 9px; height: 9px; border-radius: 50%; background: var(--vp-text-dim); }
        .comfy-task-row.is-running .comfy-task-state span { background: var(--vp-accent-color); box-shadow: 0 0 0 4px var(--vp-accent-soft); }
        .comfy-task-row.is-success .comfy-task-state span { background: var(--vp-success-color); }
        .comfy-task-row.is-error .comfy-task-state span { background: var(--vp-error-color); }
        .comfy-task-heading { display: flex; justify-content: space-between; gap: var(--vp-space-3); }
        .comfy-task-heading b { color: var(--vp-text-color); font-size: 13px; }
        .comfy-task-heading span,
        .comfy-task-detail { color: var(--vp-text-muted); font-size: 11px; }
        .comfy-task-detail { margin: 3px 0 7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .comfy-task-progress { height: 2px; overflow: hidden; background: var(--vp-border-color); }
        .comfy-task-progress span { display: block; height: 100%; background: var(--vp-accent-color); transition: width 160ms linear; }
        .comfy-task-empty { grid-column: 1 / -1; padding: 28px 16px; color: var(--vp-text-dim); text-align: center; }

        .workflow-node-view { margin-top: var(--vp-space-3); }
        .workflow-node-summary { margin-bottom: var(--vp-space-2); color: var(--vp-text-muted); font-size: 11px; }
        .workflow-node-list { display: grid; gap: 1px; max-height: 360px; overflow-y: auto; border: 1px solid var(--vp-border-color); }
        .workflow-node-item { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 10px; padding: 8px 10px; background: var(--vp-surface-1); }
        .workflow-node-id { color: var(--vp-accent-color); font-family: var(--vp-font-mono); font-size: 11px; }
        .workflow-node-copy { min-width: 0; display: grid; gap: 2px; }
        .workflow-node-copy b { color: var(--vp-text-color); font-size: 12px; }
        .workflow-node-copy span { color: var(--vp-text-muted); font-size: 10px; }
        .workflow-node-copy small { overflow: hidden; color: var(--vp-text-dim); font-family: var(--vp-font-mono); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }

        @media (max-width: 700px) {
            .comfy-studio-form-grid,
            .comfy-studio-form-grid.compact { grid-template-columns: 1fr; }
            .comfy-profile-binding { align-items: stretch; flex-direction: column; }
            #${panelId} .comfy-tag-controls { grid-template-columns: 1fr; }
            #${panelId} .comfy-tag-control > label { grid-template-columns: 1fr; gap: 2px; }
            #${panelId} .comfy-tag-control > label small { text-align: left; white-space: normal; }
            .comfy-tag-preset-grid { grid-template-columns: 1fr 1fr; }
            #${panelId} .comfy-tag-preset { grid-template-columns: 1fr; gap: 5px; }
            .comfy-tag-subheading > div { align-items: flex-start; flex-direction: column; gap: 2px; }
            .comfy-tag-results { grid-template-columns: 1fr 1fr; }
            .comfy-tag-empty { grid-template-columns: 24px minmax(0, 1fr); }
            #${panelId} .comfy-tag-empty .comfy-button { grid-column: 1 / -1; justify-content: center; width: 100%; }
            .comfy-tag-format-grid { grid-template-columns: 1fr; }
            .comfy-tags-section .comfy-studio-heading-actions { width: 100%; justify-content: flex-start; }
            .comfy-task-heading { flex-direction: column; gap: 1px; }
        }
    `;
}
