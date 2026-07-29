import { getContextBinding } from '../consistency/consistency-profile-store.js';
import {
    BASIC_DANBOORU_PRESETS,
    buildDanbooruTagExampleJson,
    insertDanbooruTags,
    parseDanbooruTagFile,
} from '../tags/danbooru-tags.js';

const TAG_CATEGORY_LABELS = {
    0: '普通',
    1: '作者',
    3: '作品',
    4: '角色',
    5: '元数据',
};

function value(id) {
    return document.getElementById(id)?.value || '';
}

function setValue(id, next = '') {
    const element = document.getElementById(id);
    if (element) element.value = next;
}

function createOutfitId() {
    return `outfit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createStudioController({ profileStore, imageCacheDB, getContext, showToast, logger = console }) {
    let profiles = [];
    let outfits = [];
    let editingOutfitId = '';
    let tagCount = 0;

    function renderProfileSelect(selectedId = '') {
        const select = document.getElementById('profile-select');
        if (!select) return;
        select.replaceChildren(new Option('新档案', ''));
        for (const profile of profiles) select.add(new Option(profile.name, profile.id));
        select.value = selectedId;
    }

    function renderOutfitSelect(selectedId = '') {
        const select = document.getElementById('profile-outfit-select');
        if (!select) return;
        select.replaceChildren(new Option('新服装', ''));
        for (const outfit of outfits) select.add(new Option(outfit.name, outfit.id));
        select.value = selectedId;
    }

    function clearOutfitForm() {
        editingOutfitId = '';
        setValue('profile-outfit-name');
        setValue('profile-outfit-positive');
        setValue('profile-outfit-negative');
        renderOutfitSelect('');
    }

    function commitOutfitForm() {
        const name = value('profile-outfit-name').trim();
        const positive = value('profile-outfit-positive').trim();
        const negative = value('profile-outfit-negative').trim();
        if (!name && !positive && !negative) return;
        const id = editingOutfitId || createOutfitId();
        const outfit = { id, name: name || '默认服装', positive, negative };
        const index = outfits.findIndex(item => item.id === id);
        if (index >= 0) outfits[index] = outfit;
        else outfits.push(outfit);
        editingOutfitId = id;
        renderOutfitSelect(id);
    }

    function loadOutfit(id) {
        const outfit = outfits.find(item => item.id === id);
        if (!outfit) return clearOutfitForm();
        editingOutfitId = outfit.id;
        setValue('profile-outfit-name', outfit.name);
        setValue('profile-outfit-positive', outfit.positive);
        setValue('profile-outfit-negative', outfit.negative);
        renderOutfitSelect(outfit.id);
    }

    function resetProfileForm() {
        ['profile-name', 'profile-aliases', 'profile-appearance', 'profile-face', 'profile-hair', 'profile-body',
            'profile-positive', 'profile-negative', 'profile-binding-key', 'profile-reference-images'].forEach(id => setValue(id));
        setValue('profile-binding-scope', 'global');
        const enabled = document.getElementById('profile-enabled');
        if (enabled) enabled.checked = true;
        const useReference = document.getElementById('profile-use-reference-image');
        if (useReference) useReference.checked = false;
        outfits = [];
        clearOutfitForm();
        renderProfileSelect('');
    }

    function loadProfile(id) {
        const profile = profiles.find(item => item.id === id);
        if (!profile) return resetProfileForm();
        setValue('profile-name', profile.name);
        setValue('profile-aliases', profile.aliases.join(', '));
        setValue('profile-appearance', profile.appearance);
        setValue('profile-face', profile.face);
        setValue('profile-hair', profile.hair);
        setValue('profile-body', profile.body);
        setValue('profile-positive', profile.positive);
        setValue('profile-negative', profile.negative);
        setValue('profile-binding-scope', profile.binding.scope);
        setValue('profile-binding-key', profile.binding.key);
        setValue('profile-reference-images', profile.referenceImages.map(item => item.url).join('\n'));
        document.getElementById('profile-enabled').checked = profile.enabled;
        document.getElementById('profile-use-reference-image').checked = profile.useReferenceImage === true;
        outfits = profile.outfits.map(item => ({ ...item }));
        renderProfileSelect(profile.id);
        loadOutfit(profile.activeOutfitId || outfits[0]?.id || '');
    }

    function collectProfile() {
        commitOutfitForm();
        const selectedId = value('profile-select');
        return {
            id: selectedId || undefined,
            name: value('profile-name'),
            aliases: value('profile-aliases'),
            appearance: value('profile-appearance'),
            face: value('profile-face'),
            hair: value('profile-hair'),
            body: value('profile-body'),
            positive: value('profile-positive'),
            negative: value('profile-negative'),
            enabled: document.getElementById('profile-enabled')?.checked !== false,
            outfits,
            activeOutfitId: editingOutfitId,
            binding: { scope: value('profile-binding-scope'), key: value('profile-binding-key') },
            referenceImages: value('profile-reference-images').split(/\r?\n/).map((url, index) => ({
                name: `参考图 ${index + 1}`,
                url: url.trim(),
            })).filter(item => item.url),
            useReferenceImage: document.getElementById('profile-use-reference-image')?.checked === true,
        };
    }

    async function refreshProfiles(selectedId = value('profile-select')) {
        profiles = await profileStore.list();
        renderProfileSelect(selectedId);
    }

    async function saveProfile() {
        const profile = collectProfile();
        if (!profile.name.trim()) return showToast('warning', '请填写档案名称');
        const saved = await profileStore.save(profile);
        await profileStore.setActive(saved.id);
        await refreshProfiles(saved.id);
        loadProfile(saved.id);
        showToast('success', `已启用一致性档案：${saved.name}`);
    }

    async function deleteProfile() {
        const id = value('profile-select');
        if (!id || !confirm('确定删除当前角色档案吗？')) return;
        await profileStore.remove(id);
        await refreshProfiles('');
        resetProfileForm();
        showToast('success', '角色档案已删除');
    }

    function bindCurrentContext() {
        const scope = value('profile-binding-scope');
        const binding = getContextBinding(getContext?.() || {});
        setValue('profile-binding-key', scope === 'global' ? '' : binding[scope]);
        if (scope !== 'global' && !binding[scope]) showToast('warning', '当前上下文没有可用的绑定标识');
    }

    async function addReferenceFiles(event) {
        const files = Array.from(event.target.files || []).slice(0, 6);
        const urls = value('profile-reference-images').split(/\r?\n/).map(item => item.trim()).filter(Boolean);
        for (const file of files) {
            if (file.size > 900 * 1024) {
                showToast('warning', `${file.name} 超过 900KB，未加入档案`);
                continue;
            }
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(file);
            });
            urls.push(dataUrl);
        }
        setValue('profile-reference-images', urls.slice(0, 6).join('\n'));
        event.target.value = '';
    }

    function updateTagTargetNote() {
        const select = document.getElementById('danbooru-tag-target');
        const note = document.getElementById('danbooru-tag-target-note');
        if (select && note) note.textContent = `点击标签后追加到${select.selectedOptions?.[0]?.textContent || '所选提示词'}`;
    }

    function renderBasicTagPresets() {
        const container = document.getElementById('danbooru-basic-presets');
        if (!container) return;
        container.replaceChildren();
        for (const preset of BASIC_DANBOORU_PRESETS) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'comfy-tag-preset';
            button.dataset.tags = preset.tags.join(',');
            button.dataset.label = preset.label;

            const copy = document.createElement('span');
            const label = document.createElement('b');
            label.textContent = preset.label;
            const description = document.createElement('small');
            description.textContent = preset.description;
            copy.append(label, description);

            const tags = document.createElement('code');
            tags.textContent = preset.tags.join(', ');
            button.append(copy, tags);
            container.appendChild(button);
        }
    }

    function renderTagEmptyState({ title, detail, allowImport = false }) {
        const container = document.getElementById('danbooru-tag-results');
        if (!container) return;
        container.replaceChildren();
        const empty = document.createElement('div');
        empty.className = 'comfy-tag-empty';
        empty.innerHTML = '<i class="fa-solid fa-tags"></i><div><b></b><span></span></div>';
        empty.querySelector('b').textContent = title;
        empty.querySelector('span').textContent = detail;
        if (allowImport) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'comfy-button';
            button.dataset.action = 'import-tags';
            button.innerHTML = '<i class="fa-solid fa-file-import"></i><span>导入扩展词库</span>';
            empty.appendChild(button);
        }
        container.appendChild(empty);
    }

    async function updateTagStats() {
        tagCount = await imageCacheDB.getTagCount();
        const stats = document.getElementById('danbooru-tag-stats');
        if (stats) {
            stats.textContent = tagCount
                ? `${BASIC_DANBOORU_PRESETS.length} 组基础组合 · 已索引 ${tagCount.toLocaleString()} 条扩展标签`
                : `${BASIC_DANBOORU_PRESETS.length} 组基础组合 · 扩展词库未导入`;
        }
        const search = document.getElementById('danbooru-tag-search');
        if (search) {
            search.disabled = tagCount === 0;
            search.placeholder = tagCount ? '输入英文标签，如 silver_hair' : '先导入扩展词库';
        }
        const searchNote = document.getElementById('danbooru-tag-search-note');
        if (searchNote) {
            searchNote.textContent = tagCount
                ? `可搜索 ${tagCount.toLocaleString()} 条标签，留空显示高频项`
                : '导入 JSON、TXT 或 CSV 后可搜索';
        }
        const clear = document.getElementById('danbooru-tag-clear');
        if (clear) clear.disabled = tagCount === 0;
        return tagCount;
    }

    async function searchTags() {
        const query = value('danbooru-tag-search').trim();
        if (!tagCount) {
            renderTagEmptyState({
                title: '扩展词库尚未导入',
                detail: '上方基础组合可以直接使用；导入自己的词库后可搜索更多标签。',
                allowImport: true,
            });
            return;
        }

        const results = await imageCacheDB.searchTags(query, 50);
        const container = document.getElementById('danbooru-tag-results');
        if (!container) return;
        container.replaceChildren();
        if (!results.length) {
            renderTagEmptyState({
                title: '没有匹配标签',
                detail: `未找到“${query}”，可缩短关键词或检查下划线拼写。`,
            });
            return;
        }
        for (const item of results) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'comfy-tag-result';
            button.dataset.tag = item.tag;
            const tag = document.createElement('b');
            tag.textContent = item.tag;
            const meta = document.createElement('span');
            const category = TAG_CATEGORY_LABELS[item.category] || item.category;
            meta.textContent = [category, item.count ? item.count.toLocaleString() : ''].filter(Boolean).join(' · ');
            button.append(tag, meta);
            container.appendChild(button);
        }
    }

    async function importTags(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const tags = parseDanbooruTagFile(await file.text(), file.name);
            if (!tags.length) throw new Error('文件中没有识别到标签');
            await imageCacheDB.replaceTags(tags);
            setValue('danbooru-tag-search');
            await updateTagStats();
            await searchTags();
            showToast('success', `已导入 ${tags.length.toLocaleString()} 个标签`);
        } catch (error) {
            logger.error('[AI Gen] 词库导入失败', error);
            showToast('error', `词库导入失败：${error.message}`);
        } finally {
            event.target.value = '';
        }
    }

    function insertTags(tags) {
        const target = document.getElementById(value('danbooru-tag-target'));
        if (!target) {
            showToast('warning', '当前插入位置不可用，请先打开对应设置区域');
            return false;
        }
        const nextValue = insertDanbooruTags(target.value, tags);
        if (nextValue === target.value) return false;
        target.value = nextValue;
        target.dispatchEvent(new Event('input', { bubbles: true }));
        target.focus();
        return true;
    }

    function downloadTagExample() {
        const blob = new Blob([buildDanbooruTagExampleJson()], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'danbooru-tags-example.json';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast('success', '已下载词库格式示例');
    }

    async function init() {
        await refreshProfiles();
        renderBasicTagPresets();
        await updateTagStats();
        await searchTags();
        updateTagTargetNote();
        document.getElementById('profile-select')?.addEventListener('change', event => loadProfile(event.target.value));
        document.getElementById('profile-new')?.addEventListener('click', resetProfileForm);
        document.getElementById('profile-save')?.addEventListener('click', saveProfile);
        document.getElementById('profile-delete')?.addEventListener('click', deleteProfile);
        document.getElementById('profile-bind-current')?.addEventListener('click', bindCurrentContext);
        document.getElementById('profile-outfit-select')?.addEventListener('change', event => loadOutfit(event.target.value));
        document.getElementById('profile-outfit-new')?.addEventListener('click', () => { commitOutfitForm(); clearOutfitForm(); });
        document.getElementById('profile-outfit-delete')?.addEventListener('click', () => {
            outfits = outfits.filter(item => item.id !== editingOutfitId);
            clearOutfitForm();
        });
        document.getElementById('profile-reference-file')?.addEventListener('change', addReferenceFiles);
        document.getElementById('danbooru-tag-import')?.addEventListener('change', importTags);
        document.getElementById('danbooru-tag-example-download')?.addEventListener('click', downloadTagExample);
        document.getElementById('danbooru-tag-clear')?.addEventListener('click', async () => {
            if (!confirm('确定清空已导入的词库吗？')) return;
            await imageCacheDB.clearTags();
            setValue('danbooru-tag-search');
            await updateTagStats();
            await searchTags();
        });
        document.getElementById('danbooru-tag-target')?.addEventListener('change', updateTagTargetNote);
        let searchTimer;
        document.getElementById('danbooru-tag-search')?.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(searchTags, 120);
        });
        document.getElementById('danbooru-tag-results')?.addEventListener('click', event => {
            const tag = event.target.closest('.comfy-tag-result')?.dataset.tag;
            if (tag) insertTags([tag]);
            if (event.target.closest('[data-action="import-tags"]')) {
                document.getElementById('danbooru-tag-import')?.click();
            }
        });
        document.getElementById('danbooru-basic-presets')?.addEventListener('click', event => {
            const preset = event.target.closest('.comfy-tag-preset');
            if (!preset) return;
            const inserted = insertTags(preset.dataset.tags?.split(',').filter(Boolean) || []);
            if (inserted) showToast('success', `已插入“${preset.dataset.label}”组合`);
        });
        document.addEventListener('comfyui-settings-imported', () => refreshProfiles());
    }

    return { init, refreshProfiles };
}
