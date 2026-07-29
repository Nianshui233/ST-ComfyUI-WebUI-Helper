import { simpleHash } from '../../lib/core/utils.js';

function normalizeSnapshot(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

export function createStreamingPregeneration({
    generateDraft,
    getSettings,
    getMessageText,
    getMessageKey,
    taskStore,
    logger = console,
}) {
    const drafts = new Map();
    const runs = new Map();
    const attempted = new Set();
    let activeCount = 0;

    async function maybeStart(messageNode) {
        const settings = await getSettings();
        if (!settings.enabled || activeCount >= settings.maxConcurrent) return false;
        const key = getMessageKey(messageNode);
        const text = normalizeSnapshot(getMessageText(messageNode));
        if (text.length < settings.minChars || runs.has(key) || attempted.has(key)) return false;

        const run = { cancelled: false, hash: simpleHash(text), text };
        attempted.add(key);
        runs.set(key, run);
        activeCount += 1;
        const taskId = taskStore?.start({
            type: 'pre-generation',
            label: '流式预生成',
            detail: '基于稳定中的消息准备提示词',
            meta: { messageKey: key },
            cancel: () => { run.cancelled = true; },
        });
        try {
            const prompt = await generateDraft(messageNode, {
                progress: payload => taskStore?.update(taskId, {
                    detail: payload.detail,
                    progress: payload.phase === 'request' ? 0.45 : 0.2,
                }),
            });
            if (!run.cancelled && prompt) {
                drafts.set(key, { hash: run.hash, prompt, text: run.text, createdAt: Date.now() });
                taskStore?.success(taskId, '预生成提示词已就绪');
            } else {
                taskStore?.cancel(taskId);
            }
        } catch (error) {
            if (!run.cancelled) {
                taskStore?.error(taskId, error.message || String(error));
                logger.warn('[AI Gen] 流式预生成失败', error);
            }
        } finally {
            activeCount -= 1;
            runs.delete(key);
        }
        return true;
    }

    function consume(messageNode) {
        const key = getMessageKey(messageNode);
        const draft = drafts.get(key);
        if (!draft) return '';
        drafts.delete(key);
        const currentHash = simpleHash(normalizeSnapshot(getMessageText(messageNode)));
        return currentHash === draft.hash ? draft.prompt : '';
    }

    function cancel(messageNode) {
        const key = getMessageKey(messageNode);
        const run = runs.get(key);
        if (run) run.cancelled = true;
        drafts.delete(key);
        attempted.delete(key);
    }

    return { cancel, consume, maybeStart };
}
