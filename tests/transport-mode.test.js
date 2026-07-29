import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.window = { location: { origin: 'http://127.0.0.1:8000' } };
globalThis.localStorage = { getItem: () => null };

const { proxiedUrl } = await import('../lib/browser/tampermonkey-compat.js');

test('direct-local bypasses SillyTavern proxy for loopback and LAN services', () => {
    assert.equal(proxiedUrl('http://127.0.0.1:8188/history', { mode: 'direct-local' }), 'http://127.0.0.1:8188/history');
    assert.equal(proxiedUrl('http://192.168.1.20:7860/sdapi/v1/options', { mode: 'direct-local' }), 'http://192.168.1.20:7860/sdapi/v1/options');
    assert.equal(proxiedUrl('http://[::1]:8188/history', { mode: 'direct-local' }), 'http://[::1]:8188/history');
});

test('direct-local keeps external services behind the SillyTavern proxy', () => {
    const result = proxiedUrl('https://api.example.com/v1/models', { mode: 'direct-local' });
    assert.equal(result, `/proxy/${encodeURIComponent('https://api.example.com/v1/models')}`);
});

test('explicit transport modes override host classification', () => {
    assert.match(proxiedUrl('http://localhost:8188/object_info', { mode: 'proxy' }), /^\/proxy\//);
    assert.equal(proxiedUrl('https://api.example.com/v1/models', { mode: 'direct' }), 'https://api.example.com/v1/models');
});
