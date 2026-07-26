import assert from 'node:assert/strict';
import test from 'node:test';

import {
    inferImagePromptGenerationProfile,
    resolveImagePromptGenerationProfile,
} from '../features/ai-prompt/image-prompt-profile.js';

test('legacy rule text maps explicit A1111 declarations to the Illustrious profile', () => {
    const instruction = `MODEL_META_PROFILE=illustrious
PARSER_PROFILE=a1111_weighted_raw`;

    assert.equal(inferImagePromptGenerationProfile(instruction), 'illustrious_a1111');
    assert.equal(resolveImagePromptGenerationProfile({
        generationProfile: 'auto',
        instruction,
    }).id, 'illustrious_a1111');
});

test('natural-language rules use the plain profile when no tag parser is declared', () => {
    assert.equal(
        inferImagePromptGenerationProfile('Write a connected English natural-language image prompt.'),
        'natural_plain',
    );
});

test('natural-language rules that explicitly forbid Danbooru tags stay plain', () => {
    assert.equal(
        inferImagePromptGenerationProfile('Use connected English prose. Do not use Danbooru tags or comma tag piles.'),
        'natural_plain',
    );
    assert.equal(
        inferImagePromptGenerationProfile('使用连贯英文自然语言，禁止 Danbooru 标签串。'),
        'natural_plain',
    );
    assert.equal(
        inferImagePromptGenerationProfile('使用自然语言，不使用 Danbooru 标签。'),
        'natural_plain',
    );
    assert.equal(
        inferImagePromptGenerationProfile('Use a non-Danbooru natural-language prompt.'),
        'natural_plain',
    );
    assert.equal(
        inferImagePromptGenerationProfile('使用非 Danbooru 标签格式，改用自然语言。'),
        'natural_plain',
    );
});

test('legacy positive Danbooru declarations still select the Illustrious profile', () => {
    assert.equal(
        inferImagePromptGenerationProfile('You are a Danbooru tag prompt generator. Return Danbooru tags only.'),
        'illustrious_a1111',
    );
    assert.equal(
        inferImagePromptGenerationProfile('使用非常详细的 Danbooru 内容标签生成提示词。'),
        'illustrious_a1111',
    );
});
