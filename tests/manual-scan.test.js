import test from 'node:test';
import assert from 'node:assert/strict';
import { createManualScanController } from '../features/chat/manual-scan.js';

test('manual scan starts only one continuous scanner until stopped', () => {
    const manualScan = createManualScanController();
    let starts = 0;
    let stops = 0;
    manualScan.setControls({
        start: () => { starts += 1; },
        stop: () => { stops += 1; },
    });

    assert.equal(manualScan.start(), true);
    assert.equal(manualScan.start(), true);
    assert.equal(starts, 1);

    manualScan.stop();
    assert.equal(stops, 1);
    assert.equal(manualScan.start(), true);
    assert.equal(starts, 2);
});
