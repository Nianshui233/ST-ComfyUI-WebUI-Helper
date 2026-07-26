import assert from 'node:assert/strict';
import test from 'node:test';

import { createWebSearchToolAdapter } from '../features/ai-tools/web-search-tool-adapter.js';

test('Tavily uses a fixed endpoint, Bearer auth, and the expected request body', async () => {
    let requestOptions;
    const adapter = createWebSearchToolAdapter({
        makeRequest: async (options) => {
            requestOptions = options;
            return {
                responseText: JSON.stringify({
                    results: [
                        { title: ' First result ', url: 'https://example.com/one', content: ' First snippet ' },
                        { title: 'Second result', url: 'https://example.com/two', content: 'Second snippet' },
                        { title: 'Ignored result', url: 'https://example.com/three', content: 'Ignored snippet' },
                    ],
                }),
            };
        },
    });

    const result = await adapter.search({
        webSearchProvider: 'tavily',
        webSearchApiKey: 'tvly-test-key',
        webSearchApiUrl: 'https://attacker.example/search',
        webSearchMaxResults: 2,
        webSearchTimeout: 15000,
    }, 'current API documentation');

    assert.equal(requestOptions.method, 'POST');
    assert.equal(requestOptions.url, 'https://api.tavily.com/search');
    assert.deepEqual(requestOptions.headers, {
        'Content-Type': 'application/json',
        Authorization: 'Bearer tvly-test-key',
    });
    assert.equal(requestOptions.timeout, 15000);
    assert.equal(requestOptions.redactErrorResponse, true);
    assert.deepEqual(JSON.parse(requestOptions.data), {
        query: 'current API documentation',
        search_depth: 'basic',
        topic: 'general',
        max_results: 2,
        include_answer: false,
        include_raw_content: false,
        include_images: false,
    });
    assert.deepEqual(result, {
        query: 'current API documentation',
        provider: 'tavily',
        results: [
            { title: 'First result', url: 'https://example.com/one', snippet: 'First snippet' },
            { title: 'Second result', url: 'https://example.com/two', snippet: 'Second snippet' },
        ],
    });
});

test('SearXNG uses GET, encodes the query, removes stale URL state, and normalizes results', async () => {
    let requestOptions;
    const adapter = createWebSearchToolAdapter({
        makeRequest: async (options) => {
            requestOptions = options;
            return {
                responseText: JSON.stringify({
                    results: [
                        { title: ' Official docs ', url: 'https://docs.example/one', content: ' First   summary ' },
                        { title: '', link: 'https://docs.example/two', description: 'Second summary' },
                        { title: 'Empty result', url: '', content: '' },
                    ],
                }),
            };
        },
    });
    const query = 'OpenAI 官方文档 & tool calling';

    const result = await adapter.search({
        webSearchProvider: 'searxng',
        webSearchApiUrl: 'https://search.example/searx/?old=value#stale',
        webSearchMaxResults: 5,
        webSearchTimeout: 9000,
    }, query);

    assert.equal(requestOptions.method, 'GET');
    assert.deepEqual(requestOptions.headers, { Accept: 'application/json' });
    assert.equal(requestOptions.timeout, 9000);
    assert.equal(requestOptions.redactErrorResponse, true);
    assert.equal(requestOptions.redactUrlInLogs, true);
    assert.equal(Object.hasOwn(requestOptions, 'data'), false);

    const requestUrl = new URL(requestOptions.url);
    assert.equal(requestUrl.origin, 'https://search.example');
    assert.equal(requestUrl.pathname, '/searx/search');
    assert.equal(requestUrl.searchParams.get('q'), query);
    assert.equal(requestUrl.searchParams.get('format'), 'json');
    assert.equal(requestUrl.searchParams.get('categories'), 'general');
    assert.equal(requestUrl.searchParams.has('old'), false);
    assert.equal(requestUrl.hash, '');
    assert.deepEqual(result.results, [
        { title: 'Official docs', url: 'https://docs.example/one', snippet: 'First summary' },
        { title: 'https://docs.example/two', url: 'https://docs.example/two', snippet: 'Second summary' },
    ]);
});

test('SearXNG rejects non-HTTP URLs before making a request', async () => {
    let requestCount = 0;
    const adapter = createWebSearchToolAdapter({
        makeRequest: async () => {
            requestCount += 1;
            throw new Error('must not be called');
        },
    });

    await assert.rejects(adapter.search({
        webSearchProvider: 'searxng',
        webSearchApiUrl: 'file:///etc/passwd',
    }, 'test query'));
    assert.equal(requestCount, 0);
});

test('Tavily rejects a missing API key before making a request', async () => {
    let requestCount = 0;
    const adapter = createWebSearchToolAdapter({
        makeRequest: async () => {
            requestCount += 1;
            throw new Error('must not be called');
        },
    });

    await assert.rejects(adapter.search({
        webSearchProvider: 'tavily',
        webSearchApiKey: '   ',
    }, 'test query'));
    assert.equal(requestCount, 0);
});

test('invalid JSON responses are rejected', async () => {
    const adapter = createWebSearchToolAdapter({
        makeRequest: async () => ({ responseText: '<html>not JSON</html>' }),
    });

    await assert.rejects(
        adapter.search({ webSearchProvider: 'tavily', webSearchApiKey: 'tvly-test-key' }, 'test query'),
        /JSON/,
    );
});

test('queries are hard-limited before leaving the extension', async () => {
    let outboundQuery = '';
    const adapter = createWebSearchToolAdapter({
        makeRequest: async options => {
            outboundQuery = JSON.parse(options.data).query;
            return { responseText: '{"results":[]}' };
        },
    });

    const result = await adapter.search({
        webSearchProvider: 'tavily',
        webSearchApiKey: 'tvly-test-key',
    }, 'x'.repeat(500));

    assert.equal(outboundQuery.length, 240);
    assert.equal(result.query.length, 240);
});
