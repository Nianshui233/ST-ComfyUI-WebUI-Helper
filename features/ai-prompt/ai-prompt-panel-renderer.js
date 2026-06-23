import { escapeHTML } from '../../lib/core/utils.js';

export function createPromptSummary(prompt) {
    const text = String(prompt || '').trim();
    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);
    const sentenceCount = (text.match(/[.!?。！？](?:\s|$)/g) || []).length || lines.length || 1;
    const wordCount = (text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g) || []).length;
    const meta = [
        sentenceCount ? `${sentenceCount}句` : '',
        wordCount ? `${wordCount}词` : '',
    ].filter(Boolean).join(' / ');
    return meta ? `绘图提示词已隐藏（${meta}）` : '绘图提示词已隐藏';
}

export function setAiPromptPanelBusy(panel, message, busy = true, { includeGenerate = true } = {}) {
    if (!panel) return;
    panel.classList.toggle('is-busy', busy);
    panel.setAttribute('aria-busy', busy ? 'true' : 'false');
    const status = panel.querySelector('.comfy-ai-prompt-status');
    if (status) {
        status.textContent = message || (panel.dataset.readyText || '提示词已准备');
    }
    const selector = includeGenerate
        ? '.comfy-ai-prompt-action, .comfy-chat-generate-button'
        : '.comfy-ai-prompt-action';
    panel.querySelectorAll(selector).forEach(btn => {
        btn.disabled = busy;
    });
}

export function getAiPromptEditorPrompt(panel, fallbackPrompt = '') {
    const textarea = panel?.querySelector('.comfy-ai-prompt-textarea');
    return textarea?.value?.trim() || fallbackPrompt;
}

export function toggleAiPromptEditor(panel) {
    const editor = panel?.querySelector('.comfy-ai-prompt-editor');
    if (!editor) return false;

    const willOpen = editor.hasAttribute('hidden');
    editor.toggleAttribute('hidden', !willOpen);
    panel.dataset.editorOpen = willOpen ? 'true' : 'false';
    panel.querySelectorAll('[data-action="toggle-edit"]').forEach(toggle => {
        toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        if (!toggle.classList.contains('comfy-ai-prompt-summary')) {
            toggle.textContent = willOpen ? '收起编辑' : '编辑提示词';
        }
    });
    if (willOpen) {
        requestAnimationFrame(() => editor.querySelector('.comfy-ai-prompt-textarea')?.focus());
    }
    return true;
}

export function renderAiPromptReadyPanel({
    panel,
    prompt,
    promptHash,
    messageId,
    buildGenerateButtonGroup,
}) {
    panel.dataset.promptHash = promptHash;
    const isEditorOpen = panel.dataset.editorOpen === 'true';
    const summary = createPromptSummary(prompt);
    panel.innerHTML = `
        <div class="comfy-ai-prompt-header">
            <span>AI 绘图</span>
            <span class="comfy-ai-prompt-status">提示词已准备</span>
        </div>
        <button type="button" class="comfy-ai-prompt-summary comfy-ai-prompt-action" data-action="toggle-edit" aria-expanded="${isEditorOpen ? 'true' : 'false'}" title="点击查看或编辑完整提示词">${escapeHTML(summary)}</button>
        <div class="comfy-ai-prompt-editor" ${isEditorOpen ? '' : 'hidden'}>
            <textarea class="comfy-ai-prompt-textarea" spellcheck="false">${escapeHTML(prompt)}</textarea>
        </div>
        <div class="comfy-ai-prompt-actions">
            ${buildGenerateButtonGroup(prompt, messageId, 'ai_prompt')}
            <button type="button" class="comfy-button comfy-ai-prompt-action" data-action="quick">重写并生成</button>
            <button type="button" class="comfy-button comfy-ai-prompt-action" data-action="rewrite">重写提示词</button>
            <button type="button" class="comfy-button comfy-ai-prompt-action" data-action="toggle-edit" aria-expanded="${isEditorOpen ? 'true' : 'false'}">${isEditorOpen ? '收起编辑' : '编辑提示词'}</button>
            <button type="button" class="comfy-button comfy-ai-prompt-action" data-action="save">保存编辑</button>
            <button type="button" class="comfy-button comfy-ai-prompt-action" data-action="copy">复制</button>
            <button type="button" class="comfy-button comfy-ai-prompt-action" data-action="clear">清除</button>
        </div>
    `;
}

export function renderAiPromptEmptyPanel(panel) {
    delete panel.dataset.promptHash;
    panel.innerHTML = `
        <div class="comfy-ai-prompt-header">
            <span>AI 绘图</span>
            <span class="comfy-ai-prompt-status">等待分析</span>
        </div>
        <div class="comfy-ai-prompt-actions">
            <button type="button" class="comfy-button comfy-ai-prompt-action primary" data-action="quick">AI生图</button>
            <button type="button" class="comfy-button comfy-ai-prompt-action" data-action="generate">AI提示词</button>
        </div>
    `;
}
