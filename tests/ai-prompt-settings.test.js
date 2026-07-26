import assert from 'node:assert/strict';
import test from 'node:test';

import { createAiPromptSettingsReader } from '../features/ai-prompt/ai-prompt-settings.js';

test('settings reader upgrades legacy capacity and exposes the selected generation profile', async () => {
    const { getAiPromptSettings } = createAiPromptSettingsReader({
        getStoredValues: async entries => Object.fromEntries(entries.map(([key, fallback]) => {
            if (key === 'comfyui_ai_prompt_response_length') return [key, 350];
            if (key === 'comfyui_ai_prompt_generation_profile') return [key, 'illustrious_a1111'];
            return [key, fallback];
        })),
    });

    const settings = await getAiPromptSettings();

    assert.equal(settings.responseLength, 4096);
    assert.equal(settings.outputTokenCapacity, 4096);
    assert.equal(settings.generationProfile, 'illustrious_a1111');
});
