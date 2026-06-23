import { escapeHTML, simpleHash } from '../../lib/core/utils.js';

function createPanelPromptSummary(prompt) {
    const text = String(prompt || '').trim();
    const words = (text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g) || []).length;
    return words ? `提示词已隐藏（${words}词）` : '提示词已隐藏';
}

function escapeSelector(value) {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value);
    return String(value || '').replace(/["\\]/g, '\\$&');
}

function buildStoryboardPanelHtml(panel, messageId, buildGenerateButtonGroup) {
    const panelPrompt = escapeHTML(panel.prompt || '');
    const promptHash = simpleHash(panel.prompt || panel.id);
    return `<section class="comfy-storyboard-panel" data-panel-id="${escapeHTML(panel.id)}" data-prompt-hash="${promptHash}">
        <div class="comfy-storyboard-panel-head">
            <span class="comfy-storyboard-index">第 ${panel.index} 格</span>
            <span class="comfy-storyboard-status">${escapeHTML(panel.status || 'idle')}</span>
        </div>
        <div class="comfy-storyboard-beat">${escapeHTML(panel.beat || '')}</div>
        ${panel.continuity_note ? `<div class="comfy-storyboard-note">${escapeHTML(panel.continuity_note)}</div>` : ''}
        <div class="comfy-storyboard-panel-actions">
            ${buildGenerateButtonGroup(panel.prompt, `${messageId}_${panel.id}`, 'storyboard', { slotSelector: '.comfy-storyboard-image-slot', progressSlotSelector: '.comfy-storyboard-progress-slot' })}
            <button type="button" class="comfy-button comfy-storyboard-action" data-action="toggle-panel-prompt" aria-expanded="false">提示词</button>
            <button type="button" class="comfy-button error comfy-storyboard-action" data-action="delete-panel">删除</button>
        </div>
        <div class="comfy-storyboard-progress-slot"></div>
        <div class="comfy-storyboard-prompt-drawer" hidden>
            <button type="button" class="comfy-ai-prompt-summary comfy-storyboard-action" data-action="toggle-panel-prompt" aria-expanded="false">${escapeHTML(createPanelPromptSummary(panel.prompt))}</button>
            <textarea class="comfy-storyboard-prompt-textarea" spellcheck="false">${panelPrompt}</textarea>
            <div class="comfy-storyboard-panel-tools">
                <button type="button" class="comfy-button comfy-storyboard-action" data-action="save-panel">保存本格</button>
                <button type="button" class="comfy-button comfy-storyboard-action" data-action="copy-panel">复制提示词</button>
            </div>
        </div>
        <div class="comfy-storyboard-image-slot"></div>
    </section>`;
}

function getStoryboardRenderHash(storyboard) {
    const payload = {
        title: storyboard?.title || '',
        continuity: storyboard?.continuity || {},
        panels: (storyboard?.panels || []).map(panel => ({
            id: panel.id || '',
            index: panel.index || '',
            beat: panel.beat || '',
            continuity_note: panel.continuity_note || '',
            prompt: panel.prompt || '',
        })),
    };
    return simpleHash(JSON.stringify(payload));
}

export function getStoryboardPromptFromPanel(panelNode) {
    return panelNode?.querySelector('.comfy-storyboard-prompt-textarea')?.value?.trim() || '';
}

export function toggleStoryboardPanelPrompt(panelNode) {
    const drawer = panelNode?.querySelector('.comfy-storyboard-prompt-drawer');
    if (!drawer) return false;
    const willOpen = drawer.hasAttribute('hidden');
    drawer.toggleAttribute('hidden', !willOpen);
    panelNode.querySelectorAll('[data-action="toggle-panel-prompt"]').forEach(button => {
        button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        if (button.classList.contains('comfy-button')) {
            button.textContent = willOpen ? '收起提示词' : '提示词';
        }
    });
    if (willOpen) {
        requestAnimationFrame(() => drawer.querySelector('.comfy-storyboard-prompt-textarea')?.focus());
    }
    return true;
}

export function setStoryboardBusy(panel, message, busy = true, { includeGenerate = false } = {}) {
    if (!panel) return;
    panel.classList.toggle('is-storyboard-busy', busy);
    const status = panel.querySelector('.comfy-storyboard-status-main');
    if (status) status.textContent = message || '连环画';
    const selector = includeGenerate
        ? '.comfy-storyboard-action, .comfy-storyboard-button, .comfy-storyboard-panel .comfy-chat-generate-button'
        : '.comfy-storyboard-action, .comfy-storyboard-button';
    panel.querySelectorAll(selector).forEach(button => {
        button.disabled = busy;
    });
}

export function renderStoryboardBlock({
    buildGenerateButtonGroup,
    messageId,
    panel,
    storyboard,
}) {
    const existingOpenPanels = new Set(
        Array.from(panel.querySelectorAll('.comfy-storyboard-panel'))
            .filter(node => !node.querySelector('.comfy-storyboard-prompt-drawer')?.hasAttribute('hidden'))
            .map(node => node.dataset.panelId)
    );

    if (!storyboard?.panels?.length) {
        panel.querySelector('.comfy-storyboard-block')?.remove();
        return;
    }

    const renderHash = getStoryboardRenderHash(storyboard);
    const block = panel.querySelector('.comfy-storyboard-block');
    if (block?.dataset.storyboardHash === renderHash) {
        return;
    }

    const continuity = [
        storyboard.continuity?.characters,
        storyboard.continuity?.scene,
        storyboard.continuity?.style,
    ].filter(Boolean).join(' / ');

    const html = `<div class="comfy-storyboard-block" data-storyboard-hash="${escapeHTML(renderHash)}">
        <div class="comfy-storyboard-topline">
            <div class="comfy-storyboard-title">
                <b>${escapeHTML(storyboard.title || '连环画分镜')}</b>
                <span>${storyboard.panels.length} 格</span>
                <span class="comfy-storyboard-status-main">连环画</span>
            </div>
            <div class="comfy-storyboard-top-actions">
                <button type="button" class="comfy-button comfy-storyboard-action" data-action="generate-all">生成全部</button>
                <button type="button" class="comfy-button comfy-storyboard-action" data-action="rewrite-storyboard">重写分镜</button>
                <button type="button" class="comfy-button error comfy-storyboard-action" data-action="clear-storyboard">清空</button>
            </div>
        </div>
        ${continuity ? `<div class="comfy-storyboard-continuity">${escapeHTML(continuity)}</div>` : ''}
        <div class="comfy-storyboard-panels">
            ${storyboard.panels.map(item => buildStoryboardPanelHtml(item, messageId, buildGenerateButtonGroup)).join('')}
        </div>
    </div>`;

    if (block) block.outerHTML = html;
    else panel.insertAdjacentHTML('beforeend', html);

    existingOpenPanels.forEach(panelId => {
        const panelNode = panel.querySelector(`.comfy-storyboard-panel[data-panel-id="${escapeSelector(panelId)}"]`);
        const drawer = panelNode?.querySelector('.comfy-storyboard-prompt-drawer');
        if (!drawer) return;
        drawer.hidden = false;
        panelNode.querySelectorAll('[data-action="toggle-panel-prompt"]').forEach(button => {
            button.setAttribute('aria-expanded', 'true');
            if (button.classList.contains('comfy-button')) button.textContent = '收起提示词';
        });
    });
}
