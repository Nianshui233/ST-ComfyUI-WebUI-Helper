import test from 'node:test';
import assert from 'node:assert/strict';
import { findMediaInHistory, getMediaFromHistory } from '../features/comfyui/comfyui-results.js';

test('ComfyUI results normalize image, gif, and video outputs', () => {
    const history = { p1: { outputs: {
        1: { images: [{ filename: 'still.png', type: 'output' }] },
        2: { gifs: [{ filename: 'loop.gif', type: 'output' }] },
        3: { videos: [{ filename: 'clip.mp4', type: 'output' }] },
    } } };
    const media = getMediaFromHistory(history, 'p1');
    assert.deepEqual(media.map(item => item.mediaType), ['image', 'image', 'video']);
    assert.deepEqual(findMediaInHistory(history, 'p1', 'http://127.0.0.1:8188'), {
        mediaUrl: 'http://127.0.0.1:8188/view?filename=still.png&subfolder=&type=output',
        mediaType: 'image',
        fileName: 'still.png',
    });
});
