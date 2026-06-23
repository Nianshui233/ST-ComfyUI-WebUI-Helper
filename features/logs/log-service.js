const LEVEL_ALIASES = {
    log: 'info',
    info: 'info',
    success: 'success',
    warn: 'warning',
    warning: 'warning',
    error: 'error',
    debug: 'debug',
};

const SENSITIVE_KEY_PATTERN = /(api[-_ ]?key|authorization|bearer|token|secret|password)/i;
const SECRET_VALUE_PATTERN = /(sk-[a-z0-9_-]{12,}|sk-ant-[a-z0-9_-]{12,}|Bearer\s+[a-z0-9._-]{12,})/gi;
const DEBUG_LOG_PATTERNS = [
    /^\[AI Gen Scan\] 发现 \d+ 条未处理消息/,
    /^\[AI Gen Scan\] 扫描间隔调整:/,
    /^\[AI Gen\] 系统停止发送，处理流式消息/,
    /^\[AI Gen\] 标记消息 .+ 为流式中/,
    /^\[AI Gen\] 消息 .+ 流式中/,
    /^\[AI Gen\] 消息 .+ 内容稳定/,
    /^\[AI Gen\] 消息 .+ 流式完成/,
    /^\[AI Gen\] 处理 \d+ 个待处理消息/,
];
const REPEAT_SUPPRESS_MS = 5000;

function normalizeLevel(level) {
    return LEVEL_ALIASES[level] || 'info';
}

function redactString(value) {
    return String(value || '').replace(SECRET_VALUE_PATTERN, (match) => {
        const prefix = match.startsWith('Bearer') ? 'Bearer ' : match.slice(0, 6);
        return `${prefix}***`;
    });
}

function summarizeArray(value, depth) {
    if (depth <= 0) return `[Array(${value.length})]`;
    const preview = value.slice(0, 6).map(item => summarizeValue(item, depth - 1));
    if (value.length > preview.length) preview.push(`... +${value.length - preview.length}`);
    return preview;
}

function summarizeObject(value, depth) {
    if (value instanceof Error) {
        return {
            name: value.name,
            message: redactString(value.message),
            stack: value.stack ? redactString(value.stack).split('\n').slice(0, 6).join('\n') : '',
        };
    }

    if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
        return `<${value.tagName.toLowerCase()}${value.id ? `#${value.id}` : ''}${value.className ? `.${String(value.className).trim().replace(/\s+/g, '.')}` : ''}>`;
    }

    if (depth <= 0) return '[Object]';

    const output = {};
    const entries = Object.entries(value).slice(0, 18);
    for (const [key, entryValue] of entries) {
        output[key] = SENSITIVE_KEY_PATTERN.test(key)
            ? '[redacted]'
            : summarizeValue(entryValue, depth - 1);
    }
    const remaining = Object.keys(value).length - entries.length;
    if (remaining > 0) output.__more = `+${remaining} keys`;
    return output;
}

function summarizeValue(value, depth = 2) {
    if (value === null) return null;
    if (value === undefined) return undefined;
    if (typeof value === 'string') return redactString(value);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
    if (Array.isArray(value)) return summarizeArray(value, depth);
    if (typeof value === 'object') return summarizeObject(value, depth);
    return redactString(String(value));
}

function toDisplayText(value) {
    if (value === undefined) return '';
    if (typeof value === 'string') return redactString(value);
    if (value instanceof Error) return redactString(value.message || String(value));

    try {
        return redactString(JSON.stringify(summarizeValue(value), null, 2));
    } catch {
        return redactString(String(value));
    }
}

function toDetailText(value) {
    if (!value || typeof value !== 'object' || value instanceof Error || Array.isArray(value)) {
        return toDisplayText(value);
    }

    const summarized = summarizeValue(value);
    if (!summarized || typeof summarized !== 'object' || Array.isArray(summarized)) {
        return toDisplayText(summarized);
    }

    return Object.entries(summarized)
        .map(([key, entryValue]) => {
            const text = typeof entryValue === 'string'
                ? entryValue
                : JSON.stringify(entryValue, null, 2);
            return `【${key}】\n${text}`;
        })
        .join('\n\n');
}

function buildMessage(parts) {
    if (parts.length > 1 && typeof parts[0] === 'string') {
        return toDisplayText(parts[0]) || '(empty log)';
    }

    return parts
        .map(part => toDisplayText(part))
        .filter(Boolean)
        .join(' ');
}

function buildDetails(parts) {
    if (parts.length <= 1) return '';
    return parts.slice(1)
        .map(part => toDetailText(part))
        .filter(Boolean)
        .join('\n');
}

function callBaseLogger(baseLogger, method, args) {
    const fn = baseLogger?.[method] || baseLogger?.log;
    if (typeof fn !== 'function') return;
    try {
        fn.apply(baseLogger, args);
    } catch {
        // Console forwarding should never break plugin runtime.
    }
}

function shouldTreatAsDebug(method, args) {
    if (normalizeLevel(method) === 'debug') return true;
    const first = typeof args?.[0] === 'string' ? args[0] : '';
    return DEBUG_LOG_PATTERNS.some(pattern => pattern.test(first));
}

function createRepeatKey(level, message) {
    if (level !== 'debug') return '';
    if (!DEBUG_LOG_PATTERNS.some(pattern => pattern.test(message))) return '';
    return message.replace(/\d+/g, '#').replace(/comfy-id-[a-z0-9_-]+/gi, 'comfy-id-*');
}

export function createLogStore({ maxEntries = 600, logger = console } = {}) {
    let sequence = 0;
    let entries = [];
    const listeners = new Set();
    const lastRepeatByKey = new Map();

    function notify() {
        const snapshot = entries.slice();
        listeners.forEach(listener => {
            try {
                listener(snapshot);
            } catch (error) {
                callBaseLogger(logger, 'error', ['[AI Gen] 日志页监听器失败:', error]);
            }
        });
    }

    function add(level, parts = [], source = 'runtime') {
        const normalizedLevel = normalizeLevel(level);
        const normalizedParts = Array.isArray(parts) ? parts : [parts];
        const entry = {
            id: ++sequence,
            level: normalizedLevel,
            source,
            time: Date.now(),
            message: buildMessage(normalizedParts) || '(empty log)',
            details: buildDetails(normalizedParts),
        };
        const repeatKey = createRepeatKey(entry.level, entry.message);
        if (repeatKey) {
            const lastTime = lastRepeatByKey.get(repeatKey) || 0;
            if (entry.time - lastTime < REPEAT_SUPPRESS_MS) return null;
            lastRepeatByKey.set(repeatKey, entry.time);
        }

        entries.push(entry);
        if (entries.length > maxEntries) entries = entries.slice(entries.length - maxEntries);
        notify();
        return entry;
    }

    function clear() {
        entries = [];
        notify();
    }

    function getEntries() {
        return entries.slice();
    }

    function subscribe(listener) {
        listeners.add(listener);
        listener(getEntries());
        return () => listeners.delete(listener);
    }

    function formatEntriesForText(targetEntries = entries) {
        return targetEntries.map(entry => {
            const time = new Date(entry.time).toLocaleString();
            const details = entry.details ? `\n${entry.details}` : '';
            return `[${time}] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}${details}`;
        }).join('\n\n');
    }

    function createLogger(baseLogger = logger) {
        const wrappedLogger = {};
        ['log', 'info', 'warn', 'warning', 'error', 'debug'].forEach(method => {
            wrappedLogger[method] = (...args) => {
                const level = shouldTreatAsDebug(method, args) ? 'debug' : method;
                add(level, args, method === 'log' ? 'console' : method);
                callBaseLogger(baseLogger, method === 'warning' ? 'warn' : method, args);
            };
        });
        return wrappedLogger;
    }

    return {
        add,
        clear,
        createLogger,
        debug: (...args) => add('debug', args, 'runtime'),
        error: (...args) => add('error', args, 'runtime'),
        formatEntriesForText,
        getEntries,
        info: (...args) => add('info', args, 'runtime'),
        subscribe,
        success: (...args) => add('success', args, 'runtime'),
        warning: (...args) => add('warning', args, 'runtime'),
    };
}
