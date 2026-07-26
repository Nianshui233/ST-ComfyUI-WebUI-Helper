import assert from 'node:assert/strict';
import test from 'node:test';

import {
    buildSettingsExportPayload,
    createExportableStorageKeys,
    extractImportableSettings,
} from '../features/settings/settings-backup.js';

test('exports non-secret web-search settings but never the search API key', () => {
    const keys = createExportableStorageKeys({
        mode: 'mode',
        helperEnabled: 'helper',
        workflows: 'workflows',
        promptPresets: 'prompt-presets',
        aiPromptRulePresets: 'rule-presets',
        aiPromptProviderPresets: 'provider-presets',
        comfyLoraPresets: 'lora-presets',
    });

    assert.ok(keys.includes('comfyui_ai_prompt_web_search_enabled'));
    assert.ok(keys.includes('comfyui_ai_prompt_web_search_provider'));
    assert.ok(keys.includes('comfyui_ai_prompt_web_search_api_url'));
    assert.ok(keys.includes('comfyui_ai_prompt_web_search_max_results'));
    assert.ok(keys.includes('comfyui_ai_prompt_web_search_max_calls'));
    assert.ok(keys.includes('comfyui_ai_prompt_web_search_timeout'));
    assert.ok(keys.includes('comfyui_ai_prompt_generation_profile'));
    assert.equal(keys.includes('comfyui_ai_prompt_web_search_api_key'), false);
});

test('settings export strips a web-search API key defensively', () => {
    const payload = buildSettingsExportPayload({
        comfyui_ai_prompt_web_search_enabled: true,
        comfyui_ai_prompt_web_search_api_key: 'tvly-secret',
    });

    assert.equal(payload.settings.comfyui_ai_prompt_web_search_enabled, true);
    assert.equal('comfyui_ai_prompt_web_search_api_key' in payload.settings, false);
});

test('generation profile and rule presets survive an export-import round trip', () => {
    const rulePresets = {
        Danbooru: {
            instruction: 'MODEL_META_PROFILE=illustrious\nPARSER_PROFILE=a1111_weighted_raw',
            generationProfile: 'auto',
        },
    };
    const payload = buildSettingsExportPayload({
        comfyui_ai_prompt_generation_profile: 'auto',
        comfyui_ai_prompt_rule_presets: rulePresets,
    });
    const { settings, entries } = extractImportableSettings(payload, [
        'comfyui_ai_prompt_generation_profile',
        'comfyui_ai_prompt_rule_presets',
    ]);

    assert.equal(settings.comfyui_ai_prompt_generation_profile, 'auto');
    assert.deepEqual(settings.comfyui_ai_prompt_rule_presets, rulePresets);
    assert.deepEqual(Object.fromEntries(entries), settings);
});
