export function createSelectionManager({ storageKey, tagClass, emptyText }, deps) {
    const { safeJsonParse } = deps;

    const readItems = () => {
        const parsed = safeJsonParse(localStorage.getItem(storageKey) || '[]', [], storageKey);
        return Array.isArray(parsed) ? parsed : [];
    };

    return {
        getAll() { return readItems(); },
        add(name, weight, extra = {}) {
            const items = this.getAll();
            if (!items.some(i => i.name === name)) {
                items.push({ name, weight, ...extra });
                localStorage.setItem(storageKey, JSON.stringify(items));
            }
        },
        remove(name) {
            const items = this.getAll().filter(i => i.name !== name);
            localStorage.setItem(storageKey, JSON.stringify(items));
        },
        updateWeight(name, weight) {
            const items = this.getAll();
            const item = items.find(i => i.name === name);
            if (item) {
                item.weight = weight;
                localStorage.setItem(storageKey, JSON.stringify(items));
            }
        },
        renderSelected(containerId, onRemove) {
            const container = document.getElementById(containerId);
            const items = this.getAll();
            container.innerHTML = '';
            if (items.length === 0) {
                container.innerHTML = `<div style="color: #888; font-style: italic;">${emptyText}</div>`;
                return;
            }
            items.forEach(item => {
                const tag = document.createElement('span');
                tag.className = tagClass;
                tag.textContent = `${item.name} (${item.weight})`;
                const removeBtn = document.createElement('span');
                removeBtn.className = 'remove';
                removeBtn.textContent = '\u00d7';
                removeBtn.onclick = () => onRemove(item.name);
                tag.appendChild(removeBtn);
                container.appendChild(tag);
            });
        },
    };
}
