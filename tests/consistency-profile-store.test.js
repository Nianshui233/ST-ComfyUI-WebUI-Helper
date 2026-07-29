import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildProfilePromptAugments,
    createConsistencyProfileStore,
    normalizeConsistencyProfile,
    profileMatchesContext,
} from '../features/consistency/consistency-profile-store.js';

test('consistency profile merges appearance, outfit, and negative constraints', () => {
    const profile = normalizeConsistencyProfile({
        name: 'Alice',
        appearance: 'young woman',
        hair: 'silver bob cut',
        negative: 'long hair',
        outfits: [{ id: 'uniform', name: 'Uniform', positive: 'navy school uniform', negative: 'red dress' }],
        activeOutfitId: 'uniform',
    });
    const result = buildProfilePromptAugments(profile);
    assert.match(result.positive, /young woman/);
    assert.match(result.positive, /silver bob cut/);
    assert.match(result.positive, /navy school uniform/);
    assert.match(result.negative, /red dress/);
    assert.match(result.negative, /long hair/);
});

test('profile bindings match the active character or chat only', () => {
    const profile = normalizeConsistencyProfile({
        binding: { scope: 'character', key: '7' },
    });
    assert.equal(profileMatchesContext(profile, { characterId: 7 }), true);
    assert.equal(profileMatchesContext(profile, { characterId: 8 }), false);
});

test('profile store selects an explicit matching profile and persists changes', async () => {
    const values = new Map();
    const store = createConsistencyProfileStore({
        getValue: async (key, fallback) => values.has(key) ? values.get(key) : fallback,
        setValue: async (key, value) => values.set(key, value),
        getContext: () => ({ characterId: 'alice' }),
    });
    const saved = await store.save({ name: 'Alice', binding: { scope: 'character', key: 'alice' } });
    await store.setActive(saved.id);
    assert.equal((await store.getActive()).name, 'Alice');
});
