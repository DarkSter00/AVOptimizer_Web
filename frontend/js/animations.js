function executeFlip(container, updateDOMCallback) {
    const elements = Array.from(container.querySelectorAll('.badge.clickable'));
    const firstRects = new Map();

    elements.forEach(el => {
        el.style.transition = 'none';
        el.style.transform = 'none';
        firstRects.set(el, el.getBoundingClientRect());

        if (el.classList.contains('active-tab')) el.style.zIndex = '20';
        else el.style.zIndex = '10';
    });

    updateDOMCallback();

    const lastRects = new Map();
    elements.forEach(el => lastRects.set(el, el.getBoundingClientRect()));

    elements.forEach(el => {
        const first = firstRects.get(el);
        const last = lastRects.get(el);
        const dx = first.left - last.left;
        const dy = first.top - last.top;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            elements.forEach(el => {
                el.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.6s ease, opacity 0.6s ease, padding 0.6s ease';
                el.style.transform = 'translate(0px, 0px)';
            });
        });
    });
}

window.triggerMorphLeave = function(safeId) {
    clearTimeout(window.morphLeaveTimers[safeId]);
    window.morphLeaveTimers[safeId] = setTimeout(() => {
        closeMorph(safeId);
    }, 1000);
};

window.cancelMorphLeave = function(safeId) {
    clearTimeout(window.morphLeaveTimers[safeId]);
};

window.toggleMorph = function(coreName, subPath, safeId, category, badgeId) {
    cancelMorphLeave(safeId);
    const morph = document.getElementById(`morph-${safeId}`);
    const spacer = document.getElementById(`spacer-${safeId}`);
    const badge = document.getElementById(badgeId);
    const badgesContainer = document.getElementById(`badges-${safeId}`);
    const topRow = document.getElementById(`top-row-${safeId}`);
    const footer = document.getElementById(`footer-${safeId}`);
    const content = document.getElementById(`morph-content-${safeId}`);

    if (!badge || !morph || !spacer || !badgesContainer || !topRow || !footer || !content) return;

    if (openMorphsTracker[safeId] === category) {
        closeMorph(safeId);
        return;
    }

    const isSwitching = morph.classList.contains('expanded');
    const colorClass = `morph-bg-${getCategoryColor(category)}`;

    if (isSwitching) {
        executeFlip(badgesContainer, () => {
            const allBadges = badgesContainer.querySelectorAll('.clickable');
            allBadges.forEach(b => {
                b.classList.remove('active-tab', 'morph-bg-success', 'morph-bg-danger', 'morph-bg-cyan', 'morph-bg-purple');
                b.style.order = '0';
            });
            badge.classList.add('active-tab', colorClass);
            badge.style.order = '-1';
        });

        openMorphsTracker[safeId] = category;
        morph.dataset.activeBadge = badgeId;
        content.classList.add('switching');
        morph.className = `morph-box active expanded ${colorClass}`;

        setTimeout(() => {
            if (lastMetrics && lastMetrics.cores[coreName] && lastMetrics.cores[coreName][subPath]) {
                renderMorphContent(safeId, lastMetrics.cores[coreName][subPath], category);
            }
            const oldHeightStr = morph.style.height;
            morph.style.transition = 'none';
            morph.style.height = 'auto';
            let targetHeight = morph.scrollHeight;
            if (targetHeight < 80) targetHeight = 80;
            if (targetHeight > 400) targetHeight = 400;

            morph.style.height = oldHeightStr;
            void morph.offsetWidth;

            morph.style.transition = 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.4s ease, border-color 0.4s ease';
            morph.style.height = `${targetHeight}px`;
            spacer.style.height = `${targetHeight + 20}px`;
            content.classList.remove('switching');
        }, 300);

    } else {
        openMorphsTracker[safeId] = category;
        morph.dataset.activeBadge = badgeId;

        executeFlip(badgesContainer, () => {
            badgesContainer.classList.add('tabs-open');
            badge.classList.add('active-tab', colorClass);
            badge.style.order = '-1';
        });

        const badgeRect = badge.getBoundingClientRect();
        const footerRect = footer.getBoundingClientRect();

        const startWidth = badgeRect.width * 0.9;
        const startHeight = badgeRect.height * 0.9;
        const startTop = (badgeRect.top - footerRect.top) + ((badgeRect.height - startHeight) / 2);
        const startLeft = (badgeRect.left - footerRect.left) + ((badgeRect.width - startWidth) / 2);

        morph.className = `morph-box ${colorClass}`;
        morph.style.transition = 'none';
        morph.style.top = `${startTop}px`;
        morph.style.left = `${startLeft}px`;
        morph.style.width = `${startWidth}px`;
        morph.style.height = `${startHeight}px`;
        morph.style.opacity = '0';

        if (lastMetrics && lastMetrics.cores[coreName] && lastMetrics.cores[coreName][subPath]) {
            renderMorphContent(safeId, lastMetrics.cores[coreName][subPath], category);
        }

        morph.classList.add('active');

        morph.style.width = `calc(100% - 30px)`;
        morph.style.left = `0px`;
        morph.style.height = 'auto';
        let targetHeight = morph.scrollHeight;
        if (targetHeight < 80) targetHeight = 80;
        if (targetHeight > 400) targetHeight = 400;

        morph.style.width = `${startWidth}px`;
        morph.style.height = `${startHeight}px`;
        morph.style.left = `${startLeft}px`;
        void morph.offsetWidth;

        morph.style.transition = 'top 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease';
        spacer.classList.add('open');
        spacer.style.height = `${targetHeight + 20}px`;

        requestAnimationFrame(() => {
            const destTop = topRow.offsetTop + topRow.offsetHeight + 15;
            morph.style.top = `${destTop}px`;
            morph.style.left = `15px`;
            morph.style.width = `calc(100% - 30px)`;
            morph.style.height = `${targetHeight}px`;
            morph.style.opacity = '1';
            morph.classList.add('expanded');
        });
    }
};

window.closeMorph = function(safeId) {
    const morph = document.getElementById(`morph-${safeId}`);
    const spacer = document.getElementById(`spacer-${safeId}`);
    const badgesContainer = document.getElementById(`badges-${safeId}`);
    const footer = document.getElementById(`footer-${safeId}`);

    if (!morph || !spacer || !openMorphsTracker[safeId]) return;

    const activeBadgeId = morph.dataset.activeBadge;
    const badge = document.getElementById(activeBadgeId);

    delete openMorphsTracker[safeId];

    if (badge) {
        badge.style.transition = 'none';
        const badgeRect = badge.getBoundingClientRect();
        const footerRect = footer.getBoundingClientRect();
        badge.style.transition = '';

        const targetTop = badgeRect.top - footerRect.top + (badgeRect.height / 2) - 5;
        const targetLeft = badgeRect.left - footerRect.left + (badgeRect.width / 2) - 5;

        morph.style.transition = 'top 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease';
        morph.classList.remove('expanded');
        morph.style.top = `${targetTop}px`;
        morph.style.left = `${targetLeft}px`;
        morph.style.width = `10px`;
        morph.style.height = `10px`;
        morph.style.opacity = `0`;
    }

    spacer.style.height = `0px`;
    spacer.classList.remove('open');

    setTimeout(() => {
        morph.classList.remove('active');
        if (badgesContainer) {
            executeFlip(badgesContainer, () => {
                badgesContainer.classList.remove('tabs-open');
                const allBadges = badgesContainer.querySelectorAll('.clickable');
                allBadges.forEach(b => {
                    b.classList.remove('active-tab', 'morph-bg-success', 'morph-bg-danger', 'morph-bg-cyan', 'morph-bg-purple');
                    b.style.order = '0';
                });
            });
        }
    }, 600);
};