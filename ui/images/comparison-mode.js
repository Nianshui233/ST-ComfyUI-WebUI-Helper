export function createComparisonMode() {
    return {
        oldImageSrc: null,

        getImageContainer(group) {
            return group.closest('.comfy-ai-prompt-panel')?.querySelector('.comfy-ai-prompt-image-slot .comfy-image-container')
                || group.nextElementSibling;
        },

        captureOldImage(group) {
            const container = this.getImageContainer(group);
            if (container?.classList.contains('comfy-image-container')) {
                const img = container.querySelector('img');
                if (img?.src) this.oldImageSrc = img.src;
            }
        },

        show(group, newImageSrc) {
            if (!this.oldImageSrc) return false;
            const existing = group.parentElement.querySelector('.comfy-compare-container');
            if (existing) existing.remove();
            const existingActions = group.parentElement.querySelector('.comfy-compare-actions');
            if (existingActions) existingActions.remove();

            const wrapper = document.createElement('div');
            wrapper.className = 'comfy-compare-container';

            const newImg = document.createElement('img');
            newImg.src = newImageSrc;
            newImg.className = 'comfy-compare-new';

            const oldImg = document.createElement('img');
            oldImg.src = this.oldImageSrc;
            oldImg.className = 'comfy-compare-old';

            const slider = document.createElement('div');
            slider.className = 'comfy-compare-slider';

            wrapper.append(newImg, oldImg, slider);

            let dragging = false;
            const onMouseMove = (e) => {
                if (!dragging) return;
                const rect = wrapper.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                slider.style.left = `${pct * 100}%`;
                oldImg.style.clipPath = `inset(0 ${(1 - pct) * 100}% 0 0)`;
            };
            const onMouseUp = () => { dragging = false; };
            slider.addEventListener('mousedown', () => { dragging = true; });
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);

            const actions = document.createElement('div');
            actions.className = 'comfy-compare-actions';

            const cleanup = () => {
                wrapper.remove();
                actions.remove();
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                this.oldImageSrc = null;
            };

            const keepNewBtn = document.createElement('button');
            keepNewBtn.className = 'comfy-button success';
            keepNewBtn.textContent = '保留新图';
            keepNewBtn.addEventListener('click', cleanup);

            const keepOldBtn = document.createElement('button');
            keepOldBtn.className = 'comfy-button';
            keepOldBtn.textContent = '恢复旧图';
            keepOldBtn.addEventListener('click', () => {
                const imgContainer = this.getImageContainer(group);
                if (imgContainer?.classList.contains('comfy-image-container')) {
                    const img = imgContainer.querySelector('img');
                    if (img) img.src = this.oldImageSrc;
                }
                cleanup();
            });

            const closeBtn = document.createElement('button');
            closeBtn.className = 'comfy-button error';
            closeBtn.textContent = '关闭对比';
            closeBtn.addEventListener('click', cleanup);

            actions.append(keepNewBtn, keepOldBtn, closeBtn);

            const imageContainer = this.getImageContainer(group);
            if (imageContainer) {
                imageContainer.insertAdjacentElement('afterend', actions);
                imageContainer.insertAdjacentElement('afterend', wrapper);
            }
            return true;
        },
    };
}
