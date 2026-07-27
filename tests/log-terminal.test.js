import assert from 'node:assert/strict';
import test from 'node:test';

import {
    LOG_LEVEL_LABELS,
    entryMatchesLogFilter,
    formatTerminalTime,
    isLogViewportNearBottom,
    shouldAutoFollowLog,
} from '../features/logs/log-terminal.js';

test('terminal level labels are stable five-character English labels', () => {
    assert.deepEqual(LOG_LEVEL_LABELS, {
        info: 'INFO ',
        success: 'SUCC ',
        warning: 'WARN ',
        error: 'ERROR',
        debug: 'DEBUG',
    });
    assert.ok(Object.isFrozen(LOG_LEVEL_LABELS));
    assert.ok(Object.values(LOG_LEVEL_LABELS).every(label => label.length === 5));
});

test('formatTerminalTime returns local time with milliseconds', () => {
    const timestamp = new Date(2025, 3, 7, 6, 5, 4, 3).getTime();
    assert.equal(formatTerminalTime(timestamp), '06:05:04.003');
    assert.equal(formatTerminalTime(new Date(timestamp)), '06:05:04.003');
});

test('formatTerminalTime handles missing and invalid timestamps', () => {
    for (const value of [undefined, null, '', 'not-a-date', Number.NaN, Symbol('time')]) {
        assert.equal(formatTerminalTime(value), '--:--:--.---');
    }
});

test('normal filtering excludes debug while an empty level includes it', () => {
    const debugEntry = { level: 'debug', source: 'runtime', message: 'trace', details: '' };
    assert.equal(entryMatchesLogFilter(debugEntry, { level: 'normal' }), false);
    assert.equal(entryMatchesLogFilter(debugEntry, { level: '' }), true);
    assert.equal(entryMatchesLogFilter({ ...debugEntry, level: 'info' }, { level: 'normal' }), true);
});

test('ordinary level filtering is case-normalized and exact', () => {
    const entry = { level: 'warning', source: 'runtime', message: 'slow', details: '' };
    assert.equal(entryMatchesLogFilter(entry, { level: 'WARNING' }), true);
    assert.equal(entryMatchesLogFilter(entry, { level: 'error' }), false);
});

test('api-image filtering recognizes source, message, and hidden details', () => {
    const base = { level: 'info', source: 'runtime', message: 'request', details: '' };
    assert.equal(entryMatchesLogFilter({ ...base, source: 'api-image' }, { level: 'api-image' }), true);
    assert.equal(entryMatchesLogFilter({ ...base, message: 'API 生图完成' }, { level: 'api-image' }), true);
    assert.equal(entryMatchesLogFilter({ ...base, details: 'provider=api-image' }, { level: 'api-image' }), true);
    assert.equal(entryMatchesLogFilter(base, { level: 'api-image' }), false);
});

test('search is case-insensitive, includes hidden details, and combines with level filters', () => {
    const entry = {
        level: 'error',
        source: 'api-image',
        message: 'Generation failed',
        details: 'Request ID: Secret-ABC',
    };
    assert.equal(entryMatchesLogFilter(entry, { query: 'secret-abc' }), true);
    assert.equal(entryMatchesLogFilter(entry, { query: 'GENERATION' }), true);
    assert.equal(entryMatchesLogFilter(entry, { level: 'api-image', query: 'request id' }), true);
    assert.equal(entryMatchesLogFilter(entry, { level: 'warning', query: 'secret-abc' }), false);
    assert.equal(entryMatchesLogFilter(entry, { query: 'missing' }), false);
});

test('entryMatchesLogFilter handles invalid entries and missing fields', () => {
    assert.equal(entryMatchesLogFilter(null), false);
    assert.equal(entryMatchesLogFilter([]), false);
    assert.equal(entryMatchesLogFilter({}, {}), true);
    assert.equal(entryMatchesLogFilter({}, { level: 'info' }), false);
    assert.equal(entryMatchesLogFilter({}, { query: 'anything' }), false);
});

test('isLogViewportNearBottom applies the default and custom thresholds', () => {
    assert.equal(isLogViewportNearBottom({ scrollTop: 560, scrollHeight: 1000, clientHeight: 400 }), true);
    assert.equal(isLogViewportNearBottom({ scrollTop: 559, scrollHeight: 1000, clientHeight: 400 }), false);
    assert.equal(isLogViewportNearBottom({ scrollTop: 550, scrollHeight: 1000, clientHeight: 400 }, 50), true);
    assert.equal(isLogViewportNearBottom({ scrollTop: 0, scrollHeight: 300, clientHeight: 400 }), true);
});

test('isLogViewportNearBottom rejects invalid geometry and normalizes threshold', () => {
    assert.equal(isLogViewportNearBottom(null), false);
    assert.equal(isLogViewportNearBottom({ scrollTop: 0, scrollHeight: 'bad', clientHeight: 100 }), false);
    assert.equal(isLogViewportNearBottom({ scrollTop: 0, scrollHeight: -1, clientHeight: 100 }), false);
    assert.equal(isLogViewportNearBottom({ scrollTop: 90, scrollHeight: 200, clientHeight: 100 }, -20), false);
    assert.equal(isLogViewportNearBottom({ scrollTop: 60, scrollHeight: 200, clientHeight: 100 }, Number.NaN), true);
});

test('automatic follow preserves a paused viewport across tab activation', () => {
    assert.equal(shouldAutoFollowLog({ followEnabled: true, viewportPinnedToBottom: true }), true);
    assert.equal(shouldAutoFollowLog({ followEnabled: true, viewportPinnedToBottom: false }), false);
    assert.equal(shouldAutoFollowLog({ followEnabled: false, viewportPinnedToBottom: true }), false);
});

test('the initial snapshot can establish the bottom position when follow is enabled', () => {
    assert.equal(shouldAutoFollowLog({
        followEnabled: true,
        initialSnapshot: true,
        viewportPinnedToBottom: false,
    }), true);
    assert.equal(shouldAutoFollowLog({
        followEnabled: false,
        initialSnapshot: true,
        viewportPinnedToBottom: true,
    }), false);
});
