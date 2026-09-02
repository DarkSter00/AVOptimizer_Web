window.rightMorphActionTimers = window.rightMorphActionTimers || {};

window.getRightFooterHTML = function(safeId) {
    return `
        <div class="footer-info right-badges-container" id="badges-right-${safeId}">
            <!-- Tasto Dimensione -->
            <span class="badge badge-primary clickable" id="footer-comp-size-${safeId}" onclick="toggleRightMorph('${safeId}', 'size', 'footer-comp-size-${safeId}')" data-bytes="0" data-expanded="false">
                <i class="fa-solid fa-hard-drive"></i>&nbsp;<span class="size-text" id="footer-comp-size-text-${safeId}">0 B</span>
            </span>

            <!-- Tasto ETA -->
            <span class="badge badge-dark clickable eta-badge" id="footer-eta-${safeId}" onclick="toggleRightMorph('${safeId}', 'eta', 'footer-eta-${safeId}')" data-expanded="false" data-secs="-1" data-state="pending">
                <i class="fa-solid fa-clock"></i>&nbsp;<span>--:--</span>
            </span>

            <!-- Tasto Statistiche -->
            <div class="footer-pct-wrapper badge badge-dark clickable" id="pct-trigger-${safeId}" onclick="toggleRightMorph('${safeId}', 'stats', 'pct-trigger-${safeId}')">
                <span class="pct-info-text"><i class="fa-solid fa-chart-pie"></i> Informazioni</span>
                <div class="pct-numbers">
                    <span class="footer-files-count" id="footer-files-count-${safeId}">0/0</span>
                    <span style="color: #555;">|</span>
                    <span class="footer-percent" id="footer-pct-${safeId}">0.0%</span>
                </div>
            </div>
        </div>
    `;
};

window.getRightStatsPanelHTML = function(safeId) {
    return `
        <div class="inline-list-spacer" id="spacer-right-${safeId}"></div>
        <div class="morph-box" id="morph-right-${safeId}"><div class="morph-content" id="morph-content-right-${safeId}"></div></div>
    `;
};

// ================= ETA LOGIC =================
window.updateEtaDisplay = function(safeId, secs, state) {
    const btn = document.getElementById(`footer-eta-${safeId}`);
    if(!btn) return;
    btn.dataset.secs = secs;
    btn.dataset.state = state;
    const isExp = btn.dataset.expanded === "true";
    const span = btn.querySelector('span');

    btn.classList.remove('badge-success', 'badge-dark');

    let shortText = "";
    if (state === 'completed') {
        btn.classList.add('badge-success');
        shortText = "FINE";
    } else if (state === 'pending' || secs < 0) {
        btn.classList.add('badge-dark');
        shortText = "N/A";
    } else {
        btn.classList.add('badge-dark');
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = Math.round(secs % 60);
        const hh = h > 0 ? String(h).padStart(2, '0') + ':' : '';
        const mm = String(m).padStart(2, '0') + ':';
        const ss = String(s).padStart(2, '0');
        shortText = hh + mm + ss;
    }

    // Aggiornamento solo TESTUALE del tag span per non corrompere l'icona
    if (span) {
        span.textContent = (isExp && state !== 'completed' && state !== 'pending') ? `ETA: ${shortText}` : shortText;
    }

    // Riquadro Compatto Inline
    if (isExp && window.openRightMorphsTracker && window.openRightMorphsTracker[safeId] === 'eta') {
        const etaPanelText = document.getElementById(`eta-panel-text-${safeId}`);
        if (etaPanelText) {
            if (state === 'completed') {
                etaPanelText.innerHTML = `ETA: <strong style='color: var(--success); font-size: 14px;'>Elaborazione completata</strong>`;
            } else if (state === 'pending' || secs < 0) {
                etaPanelText.innerHTML = `ETA: <strong style='color: var(--text-main); font-size: 14px;'>N/A</strong>`;
            } else {
                const h = Math.floor(secs / 3600);
                const m = Math.floor((secs % 3600) / 60);
                const s = Math.round(secs % 60);
                let txt = "";
                if (h > 0) txt += `${h} ${h === 1 ? 'ora' : 'ore'} `;
                if (m > 0 || h > 0) txt += `${m} ${m === 1 ? 'minuto' : 'minuti'} e `;
                txt += `${s} ${s === 1 ? 'secondo' : 'secondi'}`;
                etaPanelText.innerHTML = `ETA: <strong style='color: var(--warning); font-size: 14px;'>${txt}</strong>`;
            }
        }
    }
};

// ================= MORPH ENGINE DESTRO =================
window.toggleRightMorph = function(safeId, category, badgeId) {
    window.cancelMorphLeave(safeId);
    if (window.rightMorphActionTimers[`right_${safeId}`]) {
        clearTimeout(window.rightMorphActionTimers[`right_${safeId}`]);
        delete window.rightMorphActionTimers[`right_${safeId}`];
    }

    if (typeof window.closeMorph === 'function') window.closeMorph(safeId);

    const morph = document.getElementById(`morph-right-${safeId}`);
    const spacer = document.getElementById(`spacer-right-${safeId}`);
    const badge = document.getElementById(badgeId);
    const badgesContainer = document.getElementById(`badges-right-${safeId}`);
    const footer = document.getElementById(`footer-${safeId}`);
    const content = document.getElementById(`morph-content-right-${safeId}`);

    if (!badge || !morph || !spacer || !badgesContainer || !footer || !content) return;
    if (window.openRightMorphsTracker === undefined) window.openRightMorphsTracker = {};

    if (window.openRightMorphsTracker[safeId] === category) {
        window.closeRightMorph(safeId);
        return;
    }

    const isSwitching = morph.classList.contains('expanded');
    let colorClass = 'morph-bg-dark';
    if (category === 'size') colorClass = 'morph-bg-primary';

    const sizeBadge = document.getElementById(`footer-comp-size-${safeId}`);
    const fSizeText = document.getElementById(`footer-comp-size-text-${safeId}`);
    const etaBadge = document.getElementById(`footer-eta-${safeId}`);

    if (category === 'size' && sizeBadge && fSizeText) {
        sizeBadge.dataset.expanded = "true";
        fSizeText.textContent = `Dimensione: ${formatBytes(sizeBadge.dataset.bytes || 0)}`;
    } else if (sizeBadge && fSizeText) {
        sizeBadge.dataset.expanded = "false";
        fSizeText.textContent = formatBytes(sizeBadge.dataset.bytes || 0);
    }

    if (category === 'eta' && etaBadge) {
        etaBadge.dataset.expanded = "true";
        window.updateEtaDisplay(safeId, parseFloat(etaBadge.dataset.secs || -1), etaBadge.dataset.state);
    } else if (etaBadge) {
        etaBadge.dataset.expanded = "false";
        window.updateEtaDisplay(safeId, parseFloat(etaBadge.dataset.secs || -1), etaBadge.dataset.state);
    }

    if (isSwitching) {
        window.executeFlip(badgesContainer, () => {
            const allBadges = badgesContainer.querySelectorAll('.clickable');
            allBadges.forEach(b => {
                b.classList.remove('active-tab', 'morph-bg-dark', 'morph-bg-primary');
                b.style.order = '0';
            });
            badge.classList.add('active-tab', colorClass);
            badge.style.order = '10';
        });

        window.openRightMorphsTracker[safeId] = category;
        morph.dataset.activeBadge = badgeId;
        content.classList.add('switching');
        morph.className = `morph-box active expanded ${colorClass}`;

        window.rightMorphActionTimers[`right_${safeId}`] = setTimeout(() => {
            window.renderRightMorphContent(safeId, category);

            const oldHeightStr = morph.style.height;
            morph.style.transition = 'none';
            morph.style.height = 'auto';
            let targetHeight = morph.scrollHeight;
            if (category === 'eta' && targetHeight < 40) targetHeight = 40;
            else if (targetHeight < 55) targetHeight = 55;
            if (targetHeight > 400) targetHeight = 400;

            morph.style.height = oldHeightStr; void morph.offsetWidth;

            morph.classList.add('animating-height');
            morph.style.transition = 'height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease, border-color 0.3s ease';
            morph.style.height = `${targetHeight}px`; spacer.style.height = `${targetHeight + 20}px`;

            content.classList.remove('switching');
            if(category === 'stats') window.runStatAnimation(safeId);
            setTimeout(() => morph.classList.remove('animating-height'), 350);

            delete window.rightMorphActionTimers[`right_${safeId}`];
        }, 150);

    } else {
        window.openRightMorphsTracker[safeId] = category;
        morph.dataset.activeBadge = badgeId;

        window.executeFlip(badgesContainer, () => {
            badgesContainer.classList.add('tabs-open');
            badge.classList.add('active-tab', colorClass);
            badge.style.order = '10';
        });

        const badgeRect = badge.getBoundingClientRect();
        const footerRect = footer.getBoundingClientRect();
        const startWidth = badgeRect.width * 0.9; const startHeight = badgeRect.height * 0.9;
        const startTop = (badgeRect.top - footerRect.top) + ((badgeRect.height - startHeight) / 2);
        const startLeft = (badgeRect.left - footerRect.left) + ((badgeRect.width - startWidth) / 2);

        morph.className = `morph-box ${colorClass}`; morph.style.transition = 'none';
        morph.style.top = `${startTop}px`; morph.style.left = `${startLeft}px`;
        morph.style.width = `${startWidth}px`; morph.style.height = `${startHeight}px`; morph.style.opacity = '0';

        window.renderRightMorphContent(safeId, category);
        morph.classList.add('active');

        const containerWidth = footer.getBoundingClientRect().width;
        morph.style.width = `${containerWidth}px`;
        morph.style.left = `0px`;
        morph.style.height = 'auto';
        let targetHeight = morph.scrollHeight;
        if (category === 'eta' && targetHeight < 40) targetHeight = 40;
        else if (targetHeight < 55) targetHeight = 55;
        if (targetHeight > 400) targetHeight = 400;

        morph.style.width = `${startWidth}px`; morph.style.height = `${startHeight}px`; morph.style.left = `${startLeft}px`;
        void morph.offsetWidth;

        morph.classList.add('animating-height');
        morph.style.transition = 'top 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease';
        spacer.classList.add('open'); spacer.style.height = `${targetHeight + 20}px`;

        requestAnimationFrame(() => {
            const topRow = document.getElementById(`top-row-${safeId}`);
            const destTop = topRow.offsetTop + topRow.offsetHeight + 15;
            morph.style.top = `${destTop}px`;
            morph.style.left = `0px`;
            morph.style.width = `${containerWidth}px`;
            morph.style.height = `${targetHeight}px`;
            morph.style.opacity = '1'; morph.classList.add('expanded');

            setTimeout(() => morph.classList.remove('animating-height'), 350);
            if(category === 'stats') {
                setTimeout(() => window.runStatAnimation(safeId), 200);
            }
        });
    }
};

window.closeRightMorph = function(safeId) {
    const morph = document.getElementById(`morph-right-${safeId}`);
    const spacer = document.getElementById(`spacer-right-${safeId}`);
    const badgesContainer = document.getElementById(`badges-right-${safeId}`);
    const footer = document.getElementById(`footer-${safeId}`);

    if (!morph || !spacer || !window.openRightMorphsTracker || !window.openRightMorphsTracker[safeId]) return;

    if (window.rightMorphActionTimers[`right_${safeId}`]) {
        clearTimeout(window.rightMorphActionTimers[`right_${safeId}`]);
        delete window.rightMorphActionTimers[`right_${safeId}`];
    }

    const sizeBadge = document.getElementById(`footer-comp-size-${safeId}`);
    const fSizeText = document.getElementById(`footer-comp-size-text-${safeId}`);
    if (sizeBadge && fSizeText) {
        sizeBadge.dataset.expanded = "false";
        fSizeText.textContent = formatBytes(sizeBadge.dataset.bytes || 0);
    }

    const etaBadge = document.getElementById(`footer-eta-${safeId}`);
    if (etaBadge) {
        etaBadge.dataset.expanded = "false";
        window.updateEtaDisplay(safeId, parseFloat(etaBadge.dataset.secs || -1), etaBadge.dataset.state);
    }

    const activeBadgeId = morph.dataset.activeBadge;
    const badge = document.getElementById(activeBadgeId);
    delete window.openRightMorphsTracker[safeId];

    if (badge && footer) {
        const badgeRect = badge.getBoundingClientRect(); const footerRect = footer.getBoundingClientRect();
        const targetTop = badgeRect.top - footerRect.top + (badgeRect.height / 2) - 5;
        const targetLeft = badgeRect.left - footerRect.left + (badgeRect.width / 2) - 5;
        morph.style.transition = 'top 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease';
        morph.classList.remove('expanded'); morph.style.top = `${targetTop}px`; morph.style.left = `${targetLeft}px`;
        morph.style.width = `10px`; morph.style.height = `10px`; morph.style.opacity = `0`;
    }
    spacer.style.height = `0px`; spacer.classList.remove('open');

    window.rightMorphActionTimers[`right_${safeId}`] = setTimeout(() => {
        morph.classList.remove('active');
        if (badgesContainer) {
            window.executeFlip(badgesContainer, () => {
                badgesContainer.classList.remove('tabs-open');
                const allBadges = badgesContainer.querySelectorAll('.clickable');
                allBadges.forEach(b => {
                    b.classList.remove('active-tab', 'morph-bg-dark', 'morph-bg-primary');
                    b.style.order = '0';
                });
            });
        }
        delete window.rightMorphActionTimers[`right_${safeId}`];
    }, 250);
};

// ================= RENDERIZZA CONTENUTO =================
window.renderRightMorphContent = function(safeId, category) {
    const content = document.getElementById(`morph-content-right-${safeId}`);
    if (!content) return;

    if (category === 'stats') {
        content.innerHTML = `
            <div class="folder-stats-container" id="stats-panel-inner-${safeId}">
                <div class="stat-box stat-global-box" id="stat-box-gen-${safeId}">
                    <div class="stat-progress-bg" id="stat-bg-gen-${safeId}"></div>
                    <div class="stat-content">
                        <div class="stat-title"><i class="fa-solid fa-bars-progress" style="color: var(--text-muted);"></i> Completamento Globale</div>
                        <div class="stat-data-row">
                            <div class="stat-files" id="tt-files-gen-${safeId}">0/0</div>
                            <strong class="stat-pct" id="tt-gen-${safeId}" style="color: var(--text-main);">0%</strong>
                        </div>
                    </div>
                </div>
                <div class="stat-sub-row">
                    <div class="stat-box" id="stat-box-meta-${safeId}">
                        <div class="stat-progress-bg" id="stat-bg-meta-${safeId}"></div>
                        <div class="stat-content">
                            <div class="stat-title"><i class="fa-solid fa-magnifying-glass" style="color: var(--p-analisi);"></i> Metadati</div>
                            <div class="stat-data-row">
                                <div class="stat-files" id="tt-files-meta-${safeId}">0/0</div>
                                <strong class="stat-pct" id="tt-meta-${safeId}" style="color: var(--p-analisi);">0%</strong>
                            </div>
                        </div>
                    </div>
                    <div class="stat-box" id="stat-box-vcodec-${safeId}">
                        <div class="stat-progress-bg" id="stat-bg-vcodec-${safeId}"></div>
                        <div class="stat-content">
                            <div class="stat-title"><i class="fa-solid fa-film" style="color: var(--p-conv-video);"></i> Codec Video</div>
                            <div class="stat-data-row">
                                <div class="stat-files" id="tt-files-vcodec-${safeId}">0/0</div>
                                <strong class="stat-pct" id="tt-vcodec-${safeId}" style="color: var(--p-conv-video);">0%</strong>
                            </div>
                        </div>
                    </div>
                    <div class="stat-box" id="stat-box-acodec-${safeId}">
                        <div class="stat-progress-bg" id="stat-bg-acodec-${safeId}"></div>
                        <div class="stat-content">
                            <div class="stat-title"><i class="fa-solid fa-headphones" style="color: var(--p-conv-audio);"></i> Codec Audio</div>
                            <div class="stat-data-row">
                                <div class="stat-files" id="tt-files-acodec-${safeId}">0/0</div>
                                <strong class="stat-pct" id="tt-acodec-${safeId}" style="color: var(--p-conv-audio);">0%</strong>
                            </div>
                        </div>
                    </div>
                    <div class="stat-box" id="stat-box-vol-${safeId}">
                        <div class="stat-progress-bg" id="stat-bg-vol-${safeId}"></div>
                        <div class="stat-content">
                            <div class="stat-title"><i class="fa-solid fa-volume-high" style="color: var(--p-norm);"></i> Volume</div>
                            <div class="stat-data-row">
                                <div class="stat-files" id="tt-files-vol-${safeId}">0/0</div>
                                <strong class="stat-pct" id="tt-vol-${safeId}" style="color: var(--p-norm);">0%</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        const card = document.getElementById(safeId);
        if(card && lastMetrics) {
            const subPath = card.dataset.rawPath;
            let foundCore = null;
            for(let core in lastMetrics.cores) {
                if (lastMetrics.cores[core][subPath]) { foundCore = core; break; }
            }
            if (foundCore) {
                const subData = lastMetrics.cores[foundCore][subPath];
                window.updateRightFooterData(
                    safeId, subData.p_meta || 0, subData.p_v_codec || 0, subData.p_a_codec || 0,
                    subData.p_vol || 0, subData.p_global || 0,
                    (subData.completed||0) + (subData.errors||0) + (subData.skipped||0),
                    subData.total_files || 0, subData.valid_size || 0
                );
            }
        }
    } else if (category === 'size') {
        const card = document.getElementById(safeId);
        if(!card || !lastMetrics) return;
        const subPath = card.dataset.rawPath;
        let foundCore = null;
        for(let core in lastMetrics.cores) {
            if (lastMetrics.cores[core][subPath]) { foundCore = core; break; }
        }
        if (!foundCore) return;
        const subData = lastMetrics.cores[foundCore][subPath];

        let itemsHtml = '';
        const sortedFiles = Object.entries(subData.files).sort((a, b) => a[0].localeCompare(b[0]));
        for (const [fname, state] of sortedFiles) {
            itemsHtml += `
                <li class="size-list-item">
                    <div class="size-list-name-wrapper" onmouseenter="window.startSizeHoverScroll(this)" onmouseleave="window.stopSizeHoverScroll(this)">
                        <span class="size-list-name">${fname}</span>
                    </div>
                    <span class="size-list-val">${formatBytes(state.size)}</span>
                </li>
            `;
        }
        if (itemsHtml === '') itemsHtml = `<li style="grid-column: span 2; text-align:center; padding: 15px; color: var(--text-muted);">Nessun file presente.</li>`;

        content.innerHTML = `
            <div class="size-list-container">
                <ul class="size-list">
                    ${itemsHtml}
                </ul>
            </div>
        `;
    } else if (category === 'eta') {
        content.innerHTML = `<div id="eta-panel-text-${safeId}" style="padding: 10px; text-align: center; color: var(--text-main); font-size: 14px;">Caricamento ETA...</div>`;
        const etaBadge = document.getElementById(`footer-eta-${safeId}`);
        if(etaBadge) {
            window.updateEtaDisplay(safeId, parseFloat(etaBadge.dataset.secs || -1), etaBadge.dataset.state);
        }
    }
};

window.startSizeHoverScroll = function(wrapper) {
    const nameEl = wrapper.querySelector('.size-list-name');
    if (!nameEl) return;
    nameEl.isHovering = true;
    clearTimeout(nameEl.restoreTimer); clearTimeout(nameEl.scrollTimeout); clearTimeout(nameEl.pauseTimeout);

    if (nameEl.scrollWidth > nameEl.clientWidth) {
        const overflow = nameEl.scrollWidth - nameEl.clientWidth;
        nameEl.style.textOverflow = 'clip';
        nameEl.style.width = 'max-content';
        const duration = Math.max(overflow * 20, 1000);
        let isAtEnd = false;

        function animate() {
            if (!nameEl.isHovering) return;
            nameEl.style.transition = `transform ${duration}ms linear`;
            nameEl.style.transform = `translateX(${isAtEnd ? 0 : -(overflow + 5)}px)`;
            nameEl.scrollTimeout = setTimeout(() => {
                isAtEnd = !isAtEnd;
                if (nameEl.isHovering) nameEl.pauseTimeout = setTimeout(animate, 2000);
            }, duration);
        }
        nameEl.pauseTimeout = setTimeout(animate, 1000);
    }
};

window.stopSizeHoverScroll = function(wrapper) {
    const nameEl = wrapper.querySelector('.size-list-name');
    if (!nameEl) return;
    nameEl.isHovering = false;
    clearTimeout(nameEl.scrollTimeout); clearTimeout(nameEl.pauseTimeout);

    if (nameEl.style.width === 'max-content') {
        nameEl.style.transition = 'transform 0.4s ease';
        nameEl.style.transform = 'translateX(0)';
        nameEl.restoreTimer = setTimeout(() => {
            nameEl.style.textOverflow = 'ellipsis';
            nameEl.style.width = '100%';
        }, 400);
    }
};

window.runStatAnimation = function(safeId) {
    const start = performance.now();
    const duration = 1600;
    const boxes = ['meta', 'vcodec', 'acodec', 'vol', 'gen'].map(id => {
        const boxEl = document.getElementById(`stat-box-${id}-${safeId}`);
        const bgEl = document.getElementById(`stat-bg-${id}-${safeId}`);
        const txtEl = document.getElementById(`tt-${id}-${safeId}`);
        return {
            bgEl: bgEl, txtEl: txtEl,
            target: parseFloat(boxEl?.dataset.target || 0),
            color: boxEl?.dataset.color || 'var(--f-attesa)',
            isGlobal: id === 'gen'
        };
    });

    function step(now) {
        let progress = (now - start) / duration;
        if (progress > 1) progress = 1;
        const easeOut = 1 - Math.pow(1 - progress, 3);

        boxes.forEach(b => {
            const current = b.target * easeOut;
            if (b.txtEl) {
                b.txtEl.textContent = `${current.toFixed(1)}%`;
                const minF = 10; const maxF = b.isGlobal ? 22 : 16;
                b.txtEl.style.fontSize = `${minF + (current / 100) * (maxF - minF)}px`;
            }
            if (b.bgEl) {
                b.bgEl.style.width = `${current}%`;
                b.bgEl.style.backgroundColor = b.color;
            }
        });
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
};

window.updateRightFooterData = function(safeId, pMeta, pVideo, pAudio, pVol, displayPct, totalProcessed, c_tot, validSize) {
    const fPct = document.getElementById(`footer-pct-${safeId}`);
    const fFilesCount = document.getElementById(`footer-files-count-${safeId}`);
    const fSizeText = document.getElementById(`footer-comp-size-text-${safeId}`);
    const sizeBadge = document.getElementById(`footer-comp-size-${safeId}`);

    if(fPct) fPct.textContent = `${displayPct.toFixed(1)}%`;
    if(fFilesCount) fFilesCount.textContent = `${totalProcessed}/${c_tot}`;

    if(fSizeText && sizeBadge) {
        sizeBadge.dataset.bytes = validSize;
        const isExp = sizeBadge.dataset.expanded === "true";
        fSizeText.textContent = isExp ? `Dimensione: ${formatBytes(validSize)}` : formatBytes(validSize);
    }

    const mapping = [
        { id: 'meta', p: pMeta, c: 'var(--p-analisi)' },
        { id: 'vcodec', p: pVideo, c: 'var(--p-conv-video)' },
        { id: 'acodec', p: pAudio, c: 'var(--p-conv-audio)' },
        { id: 'vol', p: pVol, c: 'var(--p-norm)' },
        { id: 'gen', p: displayPct, c: 'var(--text-main)' }
    ];

    mapping.forEach(item => {
        const tf = document.getElementById(`tt-files-${item.id}-${safeId}`);
        const box = document.getElementById(`stat-box-${item.id}-${safeId}`);

        if (tf) tf.textContent = `${totalProcessed}/${c_tot}`;
        if (box) {
            box.dataset.target = item.p;
            box.style.setProperty('--color-accent', item.c);
            box.dataset.color = item.c;
        }
    });
};