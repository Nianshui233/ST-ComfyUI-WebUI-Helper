import test from 'node:test';
import assert from 'node:assert/strict';
import {
    BASIC_DANBOORU_PRESETS,
    buildDanbooruTagExampleJson,
    insertDanbooruTag,
    insertDanbooruTags,
    parseDanbooruTagFile,
} from '../features/tags/danbooru-tags.js';

test('Danbooru importer accepts common JSON and text shapes without bundled data', () => {
    const json = parseDanbooruTagFile(JSON.stringify({ tags: [
        { name: 'silver_hair', category: 0, post_count: 42 },
        { tag: 'blue_eyes', aliases: ['azure_eyes'] },
    ] }), 'tags.json');
    assert.equal(json[0].tag, 'silver_hair');
    assert.equal(json[0].count, 42);
    assert.deepEqual(json[1].aliases, ['azure_eyes']);

    const text = parseDanbooruTagFile('red_dress,0,100\nred_dress,0,5\nsolo,0,200', 'tags.csv');
    assert.deepEqual(text.map(item => item.tag), ['red_dress', 'solo']);
});

test('tag insertion avoids case-insensitive duplicates', () => {
    assert.equal(insertDanbooruTag('solo, Blue_Eyes', 'blue_eyes'), 'solo, Blue_Eyes');
    assert.equal(insertDanbooruTag('solo', 'silver_hair'), 'solo, silver_hair');
});

test('built-in starter presets are usable without importing a dictionary', () => {
    assert.ok(BASIC_DANBOORU_PRESETS.length >= 6);
    assert.equal(new Set(BASIC_DANBOORU_PRESETS.map(item => item.id)).size, BASIC_DANBOORU_PRESETS.length);
    assert.equal(insertDanbooruTags('solo', ['portrait', 'solo']), 'solo, portrait');
});

test('downloadable example is accepted by the importer', () => {
    const parsed = parseDanbooruTagFile(buildDanbooruTagExampleJson(), 'danbooru-tags-example.json');
    assert.deepEqual(parsed.map(item => item.tag), ['silver_hair', 'blue_eyes', 'school_uniform']);
});
