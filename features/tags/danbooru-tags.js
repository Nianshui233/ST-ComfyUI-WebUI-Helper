export const BASIC_DANBOORU_PRESETS = Object.freeze([
    { id: 'portrait', label: '人像近景', description: '脸部与视线', tags: ['solo', 'portrait', 'looking_at_viewer'] },
    { id: 'upper-body', label: '半身构图', description: '胸像到大腿', tags: ['solo', 'upper_body', 'cowboy_shot'] },
    { id: 'full-body', label: '全身站姿', description: '完整人物比例', tags: ['solo', 'full_body', 'standing'] },
    { id: 'dynamic', label: '动态姿势', description: '加强动作张力', tags: ['dynamic_pose', 'foreshortening'] },
    { id: 'seated', label: '坐姿画面', description: '稳定静态构图', tags: ['sitting', 'crossed_legs'] },
    { id: 'soft-light', label: '柔和轮廓光', description: '人像柔光基础', tags: ['soft_lighting', 'rim_light'] },
    { id: 'dramatic-light', label: '戏剧逆光', description: '高反差氛围', tags: ['backlighting', 'dramatic_shadow'] },
    { id: 'environment', label: '环境纵深', description: '室外景深基础', tags: ['outdoors', 'scenery', 'depth_of_field'] },
]);

export const DANBOORU_TAG_IMPORT_EXAMPLE = Object.freeze([
    { name: 'silver_hair', category: 0, post_count: 42000, aliases: ['grey_hair'] },
    { name: 'blue_eyes', category: 0, post_count: 68000, aliases: [] },
    { name: 'school_uniform', category: 0, post_count: 31000, aliases: [] },
]);

export function buildDanbooruTagExampleJson() {
    return JSON.stringify({ tags: DANBOORU_TAG_IMPORT_EXAMPLE }, null, 2);
}

function normalizeEntry(item) {
    if (typeof item === 'string') return { tag: item.trim(), category: '', count: 0, aliases: [] };
    if (!item || typeof item !== 'object') return null;
    const tag = String(item.tag || item.name || item.value || '').trim();
    if (!tag) return null;
    const aliases = Array.isArray(item.aliases)
        ? item.aliases.map(String)
        : String(item.aliases || '').split(/[,|]/).map(value => value.trim()).filter(Boolean);
    return {
        tag,
        category: String(item.category ?? item.type ?? ''),
        count: Math.max(0, Number(item.count ?? item.post_count) || 0),
        aliases,
    };
}

export function parseDanbooruTagFile(text, fileName = '') {
    const source = String(text || '').trim();
    if (!source) return [];
    let entries;
    if (/\.json$/i.test(fileName) || /^[\[{]/.test(source)) {
        const parsed = JSON.parse(source);
        if (Array.isArray(parsed)) entries = parsed;
        else if (Array.isArray(parsed.tags)) entries = parsed.tags;
        else entries = Object.entries(parsed).map(([tag, value]) => (
            value && typeof value === 'object' ? { tag, ...value } : { tag, count: value }
        ));
    } else {
        entries = source.split(/\r?\n/).map(line => {
            const [tag, category = '', count = '0', aliases = ''] = line.split(/[\t,]/);
            return { tag, category, count, aliases };
        });
    }
    const unique = new Map();
    for (const item of entries) {
        const normalized = normalizeEntry(item);
        if (normalized?.tag) unique.set(normalized.tag, normalized);
    }
    return Array.from(unique.values());
}

export function insertDanbooruTag(text, tag) {
    const value = String(text || '').trim();
    const nextTag = String(tag || '').trim();
    if (!nextTag) return value;
    const existing = value.split(',').map(item => item.trim().toLowerCase());
    if (existing.includes(nextTag.toLowerCase())) return value;
    return value ? `${value}, ${nextTag}` : nextTag;
}

export function insertDanbooruTags(text, tags) {
    return (Array.isArray(tags) ? tags : [])
        .reduce((current, tag) => insertDanbooruTag(current, tag), String(text || '').trim());
}
