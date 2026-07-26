import assert from 'node:assert/strict';
import test from 'node:test';

import { createImagePromptEngine } from '../features/ai-prompt/image-prompt-engine.js';
import { simpleHash } from '../lib/core/utils.js';

const SILENT_LOGGER = Object.freeze({
    info() {},
    warn() {},
});

function createMessageNode(index = 2) {
    return {
        getAttribute(name) {
            if (name === 'mesid') return String(index);
            return null;
        },
    };
}

function createSettings(overrides = {}) {
    return {
        enabled: true,
        provider: 'openai_compatible',
        instruction: 'DRAWING_RULE_ONLY: return one detailed image prompt inside [IMG_GEN].',
        contextMessages: 6,
        responseLength: 350,
        webSearchMaxCalls: 3,
        ...overrides,
    };
}

function createTruncatedError(message = 'provider output truncated') {
    const error = new Error(message);
    error.code = 'OUTPUT_TRUNCATED';
    return error;
}

function createHarness({
    outputs = ['[IMG_GEN]\nmedium shot, detailed layered clothing\n[/IMG_GEN]'],
    settings = createSettings(),
} = {}) {
    const calls = [];
    const saves = [];
    const storyboardSaves = [];
    const responseQueue = [...outputs];
    const messages = [
        { index: 1, role: 'User', name: 'User', text: 'Earlier paragraph.\n\nSecond paragraph.' },
        { index: 2, role: 'Assistant', name: 'Character', text: 'CHAT_SCENE_ONLY: the target scene.' },
    ];
    const providerAdapter = {
        createRunState() {
            return {};
        },
        async complete(request) {
            calls.push(request);
            assert.ok(responseQueue.length, 'unexpected extra provider call');
            const output = responseQueue.shift();
            if (output instanceof Error) throw output;
            return typeof output === 'object'
                ? output
                : { text: output, attempts: 1, reasoning: '' };
        },
    };
    const engine = createImagePromptEngine({
        async getAiPromptSettings() {
            return settings;
        },
        async buildAiPromptContext() {
            return messages;
        },
        getChatMessageByNode() {
            return { index: 2, message: { mes: 'target' } };
        },
        isAiPromptEligibleMessage() {
            return true;
        },
        async saveAiPromptToMessage(...args) {
            saves.push(args);
        },
        async saveStoryboardToMessage(...args) {
            storyboardSaves.push(args);
        },
        providerAdapter,
        waitForRetry: async () => {},
        logger: SILENT_LOGGER,
    });

    return { calls, engine, messages, saves, storyboardSaves };
}

test('generateSingle keeps drawing rules in system and chat data in user content', async () => {
    const harness = createHarness();
    const messageNode = createMessageNode();

    const prompt = await harness.engine.generateSingle(messageNode);

    assert.equal(prompt, 'medium shot, detailed layered clothing');
    assert.equal(harness.calls.length, 1);
    assert.match(harness.calls[0].systemText, /DRAWING_RULE_ONLY/);
    assert.doesNotMatch(harness.calls[0].userText, /DRAWING_RULE_ONLY/);
    assert.match(harness.calls[0].userText, /CHAT_SCENE_ONLY/);
    assert.doesNotMatch(harness.calls[0].systemText, /CHAT_SCENE_ONLY/);
    assert.deepEqual(harness.saves, [[
        messageNode,
        'medium shot, detailed layered clothing',
        '[IMG_GEN]\nmedium shot, detailed layered clothing\n[/IMG_GEN]',
        { generationProfile: 'natural_plain' },
    ]]);
});

test('generateSingle preserves a long drawing contract without plugin-side truncation', async () => {
    const instruction = `RULE_START\n${'atomic clothing detail\n'.repeat(600)}RULE_END`;
    const harness = createHarness({
        settings: createSettings({ instruction }),
    });

    await harness.engine.generateSingle(createMessageNode());

    assert.equal(harness.calls.length, 1);
    assert.equal(harness.calls[0].systemText.slice(0, instruction.length), instruction);
    assert.match(harness.calls[0].systemText, /RULE_END/);
    assert.ok(harness.calls[0].responseLength >= 4096);
});

test('generateStoryboard makes one request and saves the legacy storyboard shape', async () => {
    const rawStoryboard = JSON.stringify({
        title: 'Two beats',
        continuity: {
            characters: 'same character',
            scene: 'same room',
            style: 'same lighting',
        },
        panels: [
            {
                index: 1,
                beat: 'First beat',
                prompt: '[IMG_GEN]\nfirst panel prompt\n[/IMG_GEN]',
                negative_prompt: '',
                continuity_note: 'keep the robe',
            },
            {
                index: 2,
                beat: 'Second beat',
                prompt: 'second panel prompt',
                negative_prompt: '',
                continuity_note: 'keep the room',
            },
        ],
    });
    const harness = createHarness({ outputs: [rawStoryboard] });
    const messageNode = createMessageNode();

    const storyboard = await harness.engine.generateStoryboard(messageNode, { maxPanels: 4 });

    assert.equal(harness.calls.length, 1);
    assert.equal(harness.calls[0].task, 'storyboard');
    assert.match(harness.calls[0].systemText, /DRAWING_RULE_ONLY/);
    assert.doesNotMatch(harness.calls[0].userText, /DRAWING_RULE_ONLY/);
    assert.deepEqual(storyboard.panels.map(panel => panel.prompt), [
        'first panel prompt',
        'second panel prompt',
    ]);
    assert.equal(harness.storyboardSaves.length, 1);
    assert.equal(harness.storyboardSaves[0][0], messageNode);
    assert.equal(harness.storyboardSaves[0][1], storyboard);
    assert.equal(storyboard.generation_profile, 'natural_plain');
    assert.equal(harness.saves.length, 0);
});

test('generateStoryboard uses the configured first-attempt capacity without multiplying by panel count', async () => {
    const rawStoryboard = JSON.stringify({
        title: 'Four panels',
        continuity: {},
        panels: [{ index: 1, beat: 'Frame', prompt: 'complete panel prompt' }],
    });
    const harness = createHarness({
        outputs: [rawStoryboard],
        settings: createSettings({ responseLength: 6144 }),
    });

    await harness.engine.generateStoryboard(createMessageNode(), { maxPanels: 4 });

    assert.equal(harness.calls[0].responseLength, 6144);
});

test('generateStoryboard repairs invalid JSON once without re-sending chat data', async () => {
    const repaired = JSON.stringify({
        title: 'Repaired',
        continuity: { characters: '', scene: '', style: '' },
        panels: [{
            index: 1,
            beat: 'Still frame',
            prompt: 'complete repaired panel prompt',
            negative_prompt: '',
            continuity_note: '',
        }],
    });
    const harness = createHarness({
        outputs: ['{"title":"Broken","panels":[{"prompt":"keep me",}],}', repaired],
    });

    const storyboard = await harness.engine.generateStoryboard(createMessageNode());

    assert.equal(storyboard.panels[0].prompt, 'complete repaired panel prompt');
    assert.equal(harness.calls.length, 2);
    assert.equal(harness.calls[1].task, 'storyboard_json_repair');
    assert.doesNotMatch(harness.calls[1].userText, /CHAT_SCENE_ONLY/);
    assert.match(harness.calls[1].userText, /"title":"Broken"/);
    assert.equal(harness.storyboardSaves.length, 1);
});

test('generateStoryboard stops after one failed repair and never saves partial data', async () => {
    const harness = createHarness({
        outputs: [
            '{"title":"Broken","panels":[{"prompt":"keep me",}],}',
            '{"title":"Still broken","panels":[{"prompt":"keep me",}],}',
        ],
    });

    await assert.rejects(
        harness.engine.generateStoryboard(createMessageNode()),
        /JSON 解析失败/,
    );

    assert.equal(harness.calls.length, 2);
    assert.equal(harness.calls[1].task, 'storyboard_json_repair');
    assert.equal(harness.storyboardSaves.length, 0);
    assert.equal(harness.saves.length, 0);
});

test('generateStoryboard does not capacity-retry a truncated JSON repair', async () => {
    const harness = createHarness({
        outputs: [
            '{"title":"Broken","panels":[{"prompt":"keep me",}],}',
            createTruncatedError('repair output truncated'),
        ],
    });

    await assert.rejects(
        harness.engine.generateStoryboard(createMessageNode()),
        error => error?.code === 'OUTPUT_TRUNCATED',
    );

    assert.equal(harness.calls.length, 2);
    assert.equal(harness.calls[1].task, 'storyboard_json_repair');
    assert.equal(harness.storyboardSaves.length, 0);
});

test('generateStoryboard regenerates structurally truncated JSON instead of repairing missing content', async () => {
    const complete = JSON.stringify({
        title: 'Complete after expansion',
        continuity: {},
        panels: [{ index: 1, beat: 'Frame', prompt: 'full panel prompt' }],
    });
    const harness = createHarness({
        outputs: ['{"title":"Cut off","panels":[{"prompt":"partial', complete],
    });

    const storyboard = await harness.engine.generateStoryboard(createMessageNode());

    assert.equal(storyboard.panels[0].prompt, 'full panel prompt');
    assert.equal(harness.calls.length, 2);
    assert.equal(harness.calls[1].task, 'storyboard_capacity_retry');
    assert.equal(harness.storyboardSaves.length, 1);
});

test('generateStoryboard repairs a complete JSON object instead of silently dropping blank panels', async () => {
    const incomplete = JSON.stringify({
        title: 'One panel is blank',
        continuity: {},
        panels: [
            { index: 1, beat: 'First', prompt: 'first complete prompt' },
            { index: 2, beat: 'Second', prompt: '' },
        ],
    });
    const repaired = JSON.stringify({
        title: 'Both panels are complete',
        continuity: {},
        panels: [
            { index: 1, beat: 'First', prompt: 'first complete prompt' },
            { index: 2, beat: 'Second', prompt: 'second complete prompt' },
        ],
    });
    const harness = createHarness({ outputs: [incomplete, repaired] });

    const storyboard = await harness.engine.generateStoryboard(createMessageNode());

    assert.equal(harness.calls.length, 2);
    assert.equal(harness.calls[1].task, 'storyboard_json_repair');
    assert.deepEqual(storyboard.panels.map(panel => panel.prompt), [
        'first complete prompt',
        'second complete prompt',
    ]);
});

test('generateSingle expands output capacity once after explicit truncation', async () => {
    const harness = createHarness({
        outputs: [
            createTruncatedError(),
            '[IMG_GEN]\nfull detailed prompt after expansion\n[/IMG_GEN]',
        ],
    });

    const prompt = await harness.engine.generateSingle(createMessageNode());

    assert.equal(prompt, 'full detailed prompt after expansion');
    assert.equal(harness.calls.length, 2);
    assert.equal(harness.calls[1].responseLength, harness.calls[0].responseLength * 2);
    assert.equal(harness.calls[1].task, 'single_capacity_retry');
    assert.equal(harness.saves.length, 1);
    assert.doesNotMatch(harness.saves[0][2], /truncated/);
});

test('generateSingle treats an unclosed IMG_GEN block as truncation and regenerates it', async () => {
    const harness = createHarness({
        outputs: [
            '[IMG_GEN]\npartial prompt that must not be saved',
            '[IMG_GEN]\ncomplete prompt after structural retry\n[/IMG_GEN]',
        ],
    });

    const prompt = await harness.engine.generateSingle(createMessageNode());

    assert.equal(prompt, 'complete prompt after structural retry');
    assert.equal(harness.calls.length, 2);
    assert.equal(harness.calls[1].task, 'single_capacity_retry');
    assert.equal(harness.saves.length, 1);
    assert.doesNotMatch(harness.saves[0][2], /partial prompt/);
});

test('generateSingle treats a second unclosed IMG_GEN block as truncation', async () => {
    const harness = createHarness({
        outputs: [
            '[IMG_GEN]first complete-looking fragment[/IMG_GEN]\n[IMG_GEN]truncated duplicate',
            '[IMG_GEN]complete prompt after structural retry[/IMG_GEN]',
        ],
    });

    const prompt = await harness.engine.generateSingle(createMessageNode());

    assert.equal(prompt, 'complete prompt after structural retry');
    assert.equal(harness.calls.length, 2);
    assert.equal(harness.calls[1].task, 'single_capacity_retry');
    assert.equal(harness.saves.length, 1);
    assert.doesNotMatch(harness.saves[0][2], /first complete-looking fragment/);
});

test('generateSingle rejects multiple complete IMG_GEN blocks instead of choosing one', async () => {
    const harness = createHarness({
        outputs: ['[IMG_GEN]first[/IMG_GEN]\n[IMG_GEN]second[/IMG_GEN]'],
    });

    await assert.rejects(
        harness.engine.generateSingle(createMessageNode()),
        /多个 \[IMG_GEN\] 块/,
    );

    assert.equal(harness.calls.length, 1);
    assert.equal(harness.saves.length, 0);
});

test('generateSingle never saves when the expanded response is still truncated', async () => {
    const harness = createHarness({
        outputs: [createTruncatedError(), createTruncatedError('still truncated')],
    });

    await assert.rejects(
        harness.engine.generateSingle(createMessageNode()),
        error => error?.code === 'OUTPUT_TRUNCATED',
    );

    assert.equal(harness.calls.length, 2);
    assert.equal(harness.saves.length, 0);
    assert.equal(harness.storyboardSaves.length, 0);
});

test('generateSingle retries transient network failures with the same run state', async () => {
    const harness = createHarness({
        outputs: [
            new Error('network error'),
            '[IMG_GEN]\ncomplete prompt after network retry\n[/IMG_GEN]',
        ],
    });

    const prompt = await harness.engine.generateSingle(createMessageNode());

    assert.equal(prompt, 'complete prompt after network retry');
    assert.equal(harness.calls.length, 2);
    assert.equal(harness.calls[0].task, 'single');
    assert.equal(harness.calls[1].task, 'single');
    assert.equal(harness.calls[0].runState, harness.calls[1].runState);
    assert.equal(harness.saves.length, 1);
});

test('generateSingle applies the explicit Illustrious A1111 profile without double escaping', async () => {
    const rawPrompt = String.raw`[IMG_GEN]
character_name_\\(series\\), (layered_dress:1.2), masterpiece, newest
[/IMG_GEN]`;
    const harness = createHarness({
        outputs: [rawPrompt],
        settings: createSettings({ generationProfile: 'illustrious_a1111' }),
    });

    const prompt = await harness.engine.generateSingle(createMessageNode());

    assert.equal(
        prompt,
        String.raw`character_name_\(series\), (layered_dress:1.2), masterpiece, newest`,
    );
    assert.equal(harness.calls[0].generationProfile.id, 'illustrious_a1111');
    assert.equal(harness.calls[0].generationProfile.metadata, 'illustrious');
    assert.equal(harness.calls[0].generationProfile.renderer, 'a1111');
});

test('generateStoryboard computes panel ids from the rendered A1111 prompt', async () => {
    const beat = 'Rendered frame';
    const rawPanelPrompt = String.raw`character_name_\\(series\\), (robe:1.15)`;
    const renderedPrompt = String.raw`character_name_\(series\), (robe:1.15)`;
    const harness = createHarness({
        outputs: [JSON.stringify({
            title: 'A1111 storyboard',
            continuity: {},
            panels: [{ index: 1, beat, prompt: rawPanelPrompt }],
        })],
        settings: createSettings({ generationProfile: 'illustrious_a1111' }),
    });

    const storyboard = await harness.engine.generateStoryboard(createMessageNode());
    const expectedHash = simpleHash(`${beat}\n${renderedPrompt}`).replace(/^comfy-id-/, '');

    assert.equal(storyboard.panels[0].prompt, renderedPrompt);
    assert.equal(storyboard.panels[0].id, `panel-1-${expectedHash}`);
});
