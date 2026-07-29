import assert from 'node:assert/strict';
import test from 'node:test';

import { createAiPromptMessageStore } from '../features/ai-prompt/ai-prompt-message-store.js';

test('buildAiPromptContext removes old image blocks without flattening message structure', async () => {
    const chat = [{
        is_user: false,
        name: 'Character',
        mes: [
            'First paragraph.',
            '',
            '  Indented clothing layer\twith spacing.',
            '[IMG_GEN]',
            'old generated prompt',
            '[/IMG_GEN]',
            '```text',
            '  status: unchanged',
            '```',
        ].join('\r\n'),
    }];
    const store = createAiPromptMessageStore({
        getContext: () => ({ chat }),
        getValue: async (_key, fallback) => fallback,
        saveChatConditional: async () => {},
        htmlToText: value => value,
    });

    const messages = await store.buildAiPromptContext(0, 1);

    assert.equal(messages.length, 1);
    assert.equal(messages[0].text, [
        'First paragraph.',
        '',
        '  Indented clothing layer\twith spacing.',
        '',
        '```text',
        '  status: unchanged',
        '```',
    ].join('\n'));
    assert.doesNotMatch(messages[0].text, /old generated prompt/);
});

test('saveAiPromptToMessage keeps legacy fields and stores the optional generation profile', async () => {
    const chat = [{ mes: 'target', extra: { unrelated: 'keep' } }];
    let saves = 0;
    const store = createAiPromptMessageStore({
        getContext: () => ({ chat }),
        getValue: async (_key, fallback) => fallback,
        saveChatConditional: async () => { saves += 1; },
        htmlToText: value => value,
    });
    const messageNode = {
        getAttribute(name) {
            return name === 'mesid' ? '0' : null;
        },
    };

    await store.saveAiPromptToMessage(
        messageNode,
        'rendered prompt',
        '[IMG_GEN]rendered prompt[/IMG_GEN]',
        { generationProfile: 'illustrious_a1111' },
    );

    const extra = chat[0].extra.st_comfyui_webui_helper;
    assert.equal(extra.ai_prompt, 'rendered prompt');
    assert.equal(extra.ai_prompt_raw, '[IMG_GEN]rendered prompt[/IMG_GEN]');
    assert.equal(extra.ai_prompt_generation_profile, 'illustrious_a1111');
    assert.equal(chat[0].extra.unrelated, 'keep');
    assert.equal(saves, 1);
});

test('prompt history keeps versions and lock blocks generated rewrites', async () => {
    const chat = [{ mes: 'target', extra: {} }];
    const store = createAiPromptMessageStore({
        getContext: () => ({ chat }),
        getValue: async (_key, fallback) => fallback,
        saveChatConditional: async () => {},
        htmlToText: value => value,
    });
    const messageNode = { getAttribute: name => name === 'mesid' ? '0' : null };
    await store.saveAiPromptToMessage(messageNode, 'version one', 'version one', { source: 'manual' });
    await store.toggleAiPromptLock(messageNode);
    await assert.rejects(
        store.saveAiPromptToMessage(messageNode, 'generated rewrite', 'generated rewrite', { source: 'generated' }),
        /已锁定/,
    );
    await store.saveAiPromptToMessage(messageNode, 'version two', 'version two', { source: 'manual', force: true });
    const state = store.getAiPromptState(chat[0]);
    assert.equal(state.locked, true);
    assert.deepEqual(state.versions.map(version => version.prompt), ['version one', 'version two']);
    await store.restoreAiPromptVersion(messageNode, state.versions[0].id);
    assert.equal(store.getStoredAiPrompt(chat[0]), 'version one');
});
