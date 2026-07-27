export const LOG_LEVEL_LABELS = Object.freeze({
    info: 'INFO ',
    success: 'SUCC ',
    warning: 'WARN ',
    error: 'ERROR',
    debug: 'DEBUG',
});

const INVALID_TIME = '--:--:--.---';
const API_IMAGE_PATTERN = /API 生图|api-image/i;

function pad(value, width = 2) {
    return String(value).padStart(width, '0');
}

function safeText(value) {
    if (value === null || value === undefined) return '';
    try {
        return String(value);
    } catch {
        return '';
    }
}

export function formatTerminalTime(timestamp) {
    if (timestamp === null || timestamp === undefined || timestamp === '') return INVALID_TIME;

    let date;
    try {
        date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    } catch {
        return INVALID_TIME;
    }
    if (!Number.isFinite(date.getTime())) return INVALID_TIME;

    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}

export function entryMatchesLogFilter(entry, { level = '', query = '' } = {}) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;

    const entryLevel = safeText(entry.level).trim().toLowerCase();
    const selectedLevel = safeText(level).trim().toLowerCase();
    const source = safeText(entry.source);
    const message = safeText(entry.message);
    const details = safeText(entry.details);

    if (selectedLevel === 'normal') {
        if (entryLevel === 'debug') return false;
    } else if (selectedLevel === 'api-image') {
        if (!API_IMAGE_PATTERN.test(`${source} ${message} ${details}`)) return false;
    } else if (selectedLevel && entryLevel !== selectedLevel) {
        return false;
    }

    const normalizedQuery = safeText(query).trim().toLowerCase();
    if (!normalizedQuery) return true;

    return `${entryLevel} ${source} ${message} ${details}`
        .toLowerCase()
        .includes(normalizedQuery);
}

export function isLogViewportNearBottom(viewport, threshold = 40) {
    if (!viewport || typeof viewport !== 'object' || Array.isArray(viewport)) return false;

    const scrollTop = Number(viewport.scrollTop);
    const scrollHeight = Number(viewport.scrollHeight);
    const clientHeight = Number(viewport.clientHeight);
    if (![scrollTop, scrollHeight, clientHeight].every(Number.isFinite)) return false;
    if (scrollHeight < 0 || clientHeight < 0) return false;

    const parsedThreshold = Number(threshold);
    const maximumDistance = Number.isFinite(parsedThreshold) ? Math.max(0, parsedThreshold) : 40;
    const distanceFromBottom = scrollHeight - (Math.max(0, scrollTop) + clientHeight);
    return distanceFromBottom <= maximumDistance;
}

export function shouldAutoFollowLog({
    followEnabled,
    initialSnapshot = false,
    viewportPinnedToBottom,
} = {}) {
    return Boolean(followEnabled && (initialSnapshot || viewportPinnedToBottom));
}
