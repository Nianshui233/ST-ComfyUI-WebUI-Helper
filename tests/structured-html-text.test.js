import assert from 'node:assert/strict';
import test from 'node:test';

import { getStructuredTextFromDomNode } from '../lib/core/utils.js';

function textNode(value) {
    return { nodeType: 3, nodeValue: value };
}

function element(tagName, ...childNodes) {
    return { nodeType: 1, tagName, childNodes };
}

test('structured HTML text keeps block, break, code, and status-bar boundaries', () => {
    const tree = element('DIV',
        element('P', textNode('First paragraph.')),
        element('P', textNode('Second line'), element('BR'), textNode('after break.')),
        element('DETAILS',
            element('SUMMARY', textNode('状态栏')),
            element('PRE', textNode('Block#PC\n  outfit: layered robe')),
        ),
        element('SCRIPT', textNode('ignore me')),
    );

    const result = getStructuredTextFromDomNode(tree)
        .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n')
        .trim();

    assert.equal(result, [
        'First paragraph.',
        '',
        'Second line',
        'after break.',
        '',
        '状态栏',
        '',
        'Block#PC',
        '  outfit: layered robe',
    ].join('\n'));
    assert.doesNotMatch(result, /ignore me/);
});
