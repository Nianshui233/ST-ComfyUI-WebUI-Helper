import assert from 'node:assert/strict';
import test from 'node:test';

import { createSettingsController } from '../features/settings/settings-controller.js';

function createController({ storedCapacity = 350 } = {}) {
    const writes = [];
    const controller = createSettingsController({
        getStoredValues: async entries => Object.fromEntries(entries.map(([key, fallback]) => [
            key,
            key === 'comfyui_ai_prompt_response_length' ? storedCapacity : fallback,
        ])),
        setStoredValues: async entries => writes.push(...entries),
    });
    return { controller, writes };
}

test('loadSettings persists and displays the migrated 4096-token capacity', async () => {
    const previousDocument = globalThis.document;
    const hiresSettings = { style: {} };
    globalThis.document = {
        getElementById(id) {
            return id === 'hires-settings' ? hiresSettings : null;
        },
    };

    try {
        const { controller, writes } = createController();
        const capacityInput = { id: 'comfyui-ai-prompt-response-length', type: 'number', value: '350' };
        const hiresInput = { id: 'webui-enable-hires', type: 'checkbox', checked: false };

        await controller.loadSettings({
            aiPromptResponseLength: capacityInput,
            webuiEnableHires: hiresInput,
        });

        assert.equal(capacityInput.value, 4096);
        assert.deepEqual(
            writes.find(([key]) => key === 'comfyui_ai_prompt_response_length'),
            ['comfyui_ai_prompt_response_length', 4096],
        );
        assert.equal(hiresSettings.style.display, 'none');
    } finally {
        globalThis.document = previousDocument;
    }
});

test('saveSettings cannot write a capacity below 4096', async () => {
    const { controller, writes } = createController();
    const capacityInput = { id: 'comfyui-ai-prompt-response-length', type: 'number', value: '350' };

    await controller.saveSettings({ aiPromptResponseLength: capacityInput });

    assert.equal(capacityInput.value, 4096);
    assert.deepEqual(writes, [['comfyui_ai_prompt_response_length', 4096]]);
});
