export function checkAndFixPanelPosition(panel) {
    const rect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let needsAdjustment = false;
    let newLeft = parseInt(panel.style.left, 10) || 0;
    let newTop = parseInt(panel.style.top, 10) || 0;

    if (rect.top < 0) {
        newTop = 10;
        needsAdjustment = true;
    }

    if (rect.left < -rect.width + 50) {
        newLeft = 10;
        needsAdjustment = true;
    }

    if (rect.right > viewportWidth + rect.width - 50) {
        newLeft = viewportWidth - rect.width - 10;
        needsAdjustment = true;
    }

    if (rect.bottom > viewportHeight + rect.height - 50) {
        newTop = viewportHeight - rect.height - 10;
        needsAdjustment = true;
    }

    if (needsAdjustment) {
        panel.style.left = `${Math.max(10, newLeft)}px`;
        panel.style.top = `${Math.max(10, newTop)}px`;
        panel.style.transform = 'none';
        panel.classList.add('dragging');
    }
}

export function enableDrag(panel, handle, { savePanelPosition }) {
    let pos1 = 0;
    let pos2 = 0;
    let pos3 = 0;
    let pos4 = 0;
    let isDragging = false;

    const getEventPos = (e) => {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const dragStart = (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        if (e.touches && e.touches.length > 1) return;

        e.preventDefault();
        isDragging = true;

        const pos = getEventPos(e);
        pos3 = pos.x;
        pos4 = pos.y;

        const rect = panel.getBoundingClientRect();

        panel.style.left = `${rect.left}px`;
        panel.style.top = `${rect.top}px`;
        panel.style.transform = 'none';
        panel.classList.add('dragging');

        document.addEventListener('mousemove', elementDrag);
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('touchmove', elementDrag, { passive: false });
        document.addEventListener('touchend', closeDragElement);
    };

    const elementDrag = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const pos = getEventPos(e);
        pos1 = pos3 - pos.x;
        pos2 = pos4 - pos.y;
        pos3 = pos.x;
        pos4 = pos.y;

        panel.style.top = `${panel.offsetTop - pos2}px`;
        panel.style.left = `${panel.offsetLeft - pos1}px`;
    };

    const closeDragElement = () => {
        if (!isDragging) return;
        isDragging = false;

        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('touchmove', elementDrag);
        document.removeEventListener('touchend', closeDragElement);

        setTimeout(() => {
            checkAndFixPanelPosition(panel);
            savePanelPosition(panel);
        }, 10);
    };

    handle.addEventListener('mousedown', dragStart);
    handle.addEventListener('touchstart', dragStart, { passive: false });
    handle.dataset.dragEnabled = 'true';
}

export async function savePanelPosition(panel, setValue) {
    if (!panel.classList.contains('dragging')) return;

    const position = {
        left: panel.style.left,
        top: panel.style.top,
        isDragged: true,
    };

    await setValue('comfyui_panel_position', position);
}

export async function restorePanelPosition(panel, getValue) {
    const position = await getValue('comfyui_panel_position', null);

    if (!position || !position.isDragged) return;

    panel.style.left = position.left;
    panel.style.top = position.top;
    panel.style.transform = 'none';
    panel.classList.add('dragging');

    setTimeout(() => checkAndFixPanelPosition(panel), 50);
}

export async function resetPanelPosition(panel, { deviceDetector, setValue, showToast }) {
    const deviceType = deviceDetector.getDeviceType();

    if (deviceType === 'mobile') {
        panel.style.left = '0';
        panel.style.top = '0';
        panel.style.transform = 'none';
        panel.classList.add('mobile-fullscreen');
    } else {
        panel.style.left = '50%';
        panel.style.top = '50%';
        panel.style.transform = 'translate(-50%, -50%)';
        panel.classList.remove('dragging', 'mobile-fullscreen');
    }

    await setValue('comfyui_panel_position', null);
    showToast('info', '面板位置已重置');
}
