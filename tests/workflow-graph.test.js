import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkflowGraph } from '../features/workflow/workflow-graph.js';

test('workflow graph extracts API-format nodes and input edges', () => {
    const graph = buildWorkflowGraph({
        1: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'model.safetensors' } },
        2: { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1], text: '%prompt%' } },
        3: { class_type: 'SaveImage', inputs: { images: ['9', 0] } },
    });
    assert.equal(graph.nodes.length, 3);
    assert.deepEqual(graph.roots, ['1']);
    assert.equal(graph.edges[0].targetId, '2');
    assert.equal(graph.missingLinks.length, 1);
    assert.equal(graph.missingLinks[0].sourceId, '9');
});
