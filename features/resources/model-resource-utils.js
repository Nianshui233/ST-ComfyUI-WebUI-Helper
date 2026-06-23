export function setDynamicSelectOptions(selectElement, rawOptions, preferredValue = '') {
    if (!selectElement || !Array.isArray(rawOptions)) return false;

    const options = [...new Set(
        rawOptions
            .map(item => typeof item === 'string' ? item : (item?.name || item?.label || ''))
            .map(value => String(value || '').trim())
            .filter(Boolean)
    )];

    if (options.length === 0) return false;

    const currentValue = selectElement.value;
    selectElement.innerHTML = '';

    options.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        selectElement.appendChild(option);
    });

    const finalValue = preferredValue || currentValue;
    selectElement.value = finalValue && options.includes(finalValue) ? finalValue : options[0];
    return true;
}

export function findComfyOptionList(objectInfo, nodeTypeCandidates, fieldCandidates) {
    if (!objectInfo) return [];

    for (const nodeType of nodeTypeCandidates) {
        const node = objectInfo[nodeType];
        if (!node?.input?.required) continue;

        const required = node.input.required;
        for (const field of fieldCandidates) {
            const fieldDef = required[field];
            if (Array.isArray(fieldDef) && Array.isArray(fieldDef[0]) && fieldDef[0].length > 0) {
                return fieldDef[0];
            }
        }
    }

    return [];
}

export function parseJsonResponse(response, fallback, label) {
    try {
        return JSON.parse(response.responseText);
    } catch (error) {
        throw new Error(`${label} 返回了无效 JSON: ${error.message}`);
    }
}

export async function fetchAndPopulateSelect({
    selectElement,
    fetchItems,
    getValue,
    showToast,
    logger,
    savedValueKey,
    loadingText,
    emptyText,
    successMsg,
    silent,
    defaultFirst,
}) {
    selectElement.innerHTML = `<option>${loadingText}</option>`;
    selectElement.disabled = true;
    try {
        const items = await fetchItems();
        if (!items || items.length === 0) {
            selectElement.innerHTML = `<option value="">${emptyText}</option>`;
            if (!silent) showToast('info', emptyText);
            return;
        }

        selectElement.innerHTML = defaultFirst ? `<option value="">${defaultFirst}</option>` : '';
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = typeof item === 'string' ? item : (item.value || item.name || item.model_name || item.title);
            option.textContent = typeof item === 'string' ? item : (item.label || item.alias || item.name || item.model_name || item.title);
            selectElement.appendChild(option);
        });

        const saved = await getValue(savedValueKey);
        if (saved) selectElement.value = saved;
        if (!silent) showToast('success', successMsg);
    } catch (error) {
        selectElement.innerHTML = '<option>加载失败</option>';
        logger.warn(`[AI Gen] ${successMsg}失败:`, error.message);
        if (!silent) showToast('error', `加载失败: ${error.message}`);
    } finally {
        selectElement.disabled = false;
    }
}
