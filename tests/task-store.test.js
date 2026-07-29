import test from 'node:test';
import assert from 'node:assert/strict';
import { createTaskStore } from '../features/tasks/task-store.js';

test('task store tracks progress, completion, cancellation, and snapshots', async () => {
    let cancelled = false;
    const store = createTaskStore({ maxTasks: 5 });
    const snapshots = [];
    const unsubscribe = store.subscribe(tasks => snapshots.push(tasks));
    const id = store.start({ label: '生成', cancel: () => { cancelled = true; } });
    store.update(id, { progress: 1.5, detail: '处理中' });
    assert.equal(store.get(id).progress, 1);
    assert.equal(store.get(id).detail, '处理中');
    await store.cancel(id);
    assert.equal(cancelled, true);
    assert.equal(store.get(id).status, 'cancelled');
    assert.equal(snapshots.at(-1)[0].cancel, undefined);
    unsubscribe();
});

test('task store prunes oldest completed entries first', () => {
    const store = createTaskStore({ maxTasks: 2 });
    const first = store.start({ type: 'one' });
    store.success(first);
    const second = store.start({ type: 'two' });
    store.success(second);
    const third = store.start({ type: 'three' });
    assert.deepEqual(store.list().map(task => task.id).sort(), [second, third].sort());
});
