import { smartMergePrompts } from '../../lib/prompt/sd-prompt.js';

export const STORAGE_KEY_CONSISTENCY_PROFILES = 'comfyui_consistency_profiles';
export const STORAGE_KEY_ACTIVE_CONSISTENCY_PROFILE = 'comfyui_active_consistency_profile';

function createId() {
    return `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(value) {
    return String(value || '').trim();
}

export function normalizeConsistencyProfile(profile = {}) {
    const outfits = Array.isArray(profile.outfits)
        ? profile.outfits.map(outfit => ({
            id: normalizeText(outfit.id) || createId(),
            name: normalizeText(outfit.name) || '默认服装',
            positive: normalizeText(outfit.positive),
            negative: normalizeText(outfit.negative),
        }))
        : [];
    const referenceImages = Array.isArray(profile.referenceImages)
        ? profile.referenceImages
            .map(item => ({ name: normalizeText(item.name), url: normalizeText(item.url) }))
            .filter(item => item.url)
            .slice(0, 6)
        : [];
    return {
        id: normalizeText(profile.id) || createId(),
        name: normalizeText(profile.name) || '未命名角色',
        aliases: Array.isArray(profile.aliases)
            ? profile.aliases.map(normalizeText).filter(Boolean)
            : normalizeText(profile.aliases).split(/[,，\n]/).map(normalizeText).filter(Boolean),
        appearance: normalizeText(profile.appearance),
        face: normalizeText(profile.face),
        hair: normalizeText(profile.hair),
        body: normalizeText(profile.body),
        positive: normalizeText(profile.positive),
        negative: normalizeText(profile.negative),
        outfits,
        activeOutfitId: normalizeText(profile.activeOutfitId),
        referenceImages,
        useReferenceImage: profile.useReferenceImage === true,
        binding: {
            scope: ['global', 'character', 'chat'].includes(profile.binding?.scope)
                ? profile.binding.scope
                : 'global',
            key: normalizeText(profile.binding?.key),
        },
        enabled: profile.enabled !== false,
        updatedAt: Number(profile.updatedAt) || Date.now(),
    };
}

export function getContextBinding(context = {}) {
    const characterKey = context.characterId ?? context.character_id ?? context.name2 ?? '';
    const chatKey = context.chatId ?? context.chat_id ?? context.chatMetadata?.chat_id ?? '';
    return {
        character: normalizeText(characterKey),
        chat: normalizeText(chatKey),
    };
}

export function profileMatchesContext(profile, context = {}) {
    if (!profile?.enabled) return false;
    const binding = getContextBinding(context);
    if (profile.binding.scope === 'global') return true;
    return !!profile.binding.key && profile.binding.key === binding[profile.binding.scope];
}

export function buildProfilePromptAugments(profile) {
    if (!profile?.enabled) return { positive: '', negative: '', referenceImages: [] };
    const outfit = profile.outfits.find(item => item.id === profile.activeOutfitId);
    return {
        positive: smartMergePrompts(
            profile.appearance,
            profile.face,
            profile.hair,
            profile.body,
            outfit?.positive,
            profile.positive,
        ),
        negative: smartMergePrompts(outfit?.negative, profile.negative),
        referenceImages: profile.referenceImages || [],
        useReferenceImage: profile.useReferenceImage === true,
        referenceImage: profile.useReferenceImage ? profile.referenceImages?.[0] || null : null,
        profileId: profile.id,
        profileName: profile.name,
    };
}

export function createConsistencyProfileStore({ getValue, setValue, getContext }) {
    async function list() {
        const raw = await getValue(STORAGE_KEY_CONSISTENCY_PROFILES, []);
        return Array.isArray(raw) ? raw.map(normalizeConsistencyProfile) : [];
    }

    async function save(profile) {
        const profiles = await list();
        const normalized = normalizeConsistencyProfile(profile);
        const index = profiles.findIndex(item => item.id === normalized.id);
        if (index >= 0) profiles[index] = normalized;
        else profiles.push(normalized);
        await setValue(STORAGE_KEY_CONSISTENCY_PROFILES, profiles);
        return normalized;
    }

    async function remove(id) {
        const profiles = (await list()).filter(profile => profile.id !== id);
        await setValue(STORAGE_KEY_CONSISTENCY_PROFILES, profiles);
        const activeId = await getValue(STORAGE_KEY_ACTIVE_CONSISTENCY_PROFILE, '');
        if (activeId === id) await setValue(STORAGE_KEY_ACTIVE_CONSISTENCY_PROFILE, '');
    }

    async function getActive() {
        const profiles = await list();
        const activeId = await getValue(STORAGE_KEY_ACTIVE_CONSISTENCY_PROFILE, '');
        const context = getContext?.() || {};
        const explicit = profiles.find(profile => profile.id === activeId && profileMatchesContext(profile, context));
        return explicit || profiles.find(profile => profileMatchesContext(profile, context)) || null;
    }

    async function getPromptAugments() {
        return buildProfilePromptAugments(await getActive());
    }

    return {
        getActive,
        getPromptAugments,
        list,
        remove,
        save,
        setActive: id => setValue(STORAGE_KEY_ACTIVE_CONSISTENCY_PROFILE, normalizeText(id)),
    };
}
