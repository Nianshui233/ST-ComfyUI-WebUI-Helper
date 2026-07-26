import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeAiPromptRulePresetData } from '../features/settings/preset-controller.js';

test('new rule presets preserve the auto generation-profile selection', () => {
    const preset = normalizeAiPromptRulePresetData({
        instruction: 'MODEL_META_PROFILE=illustrious',
        generationProfile: 'auto',
    });

    assert.equal(preset.generationProfile, 'auto');
});

test('legacy rule presets infer an effective profile only when the field is missing', () => {
    const danbooru = normalizeAiPromptRulePresetData({
        instruction: 'PARSER_PROFILE=a1111_weighted_raw',
    });
    const natural = normalizeAiPromptRulePresetData({
        instruction: 'Write a detailed natural-language image prompt.',
    });

    assert.equal(danbooru.generationProfile, 'illustrious_a1111');
    assert.equal(natural.generationProfile, 'natural_plain');
});
