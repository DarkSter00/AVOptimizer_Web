window.toggleCard = function(subPath, safeId) {
    if (expandedCards.has(subPath)) {
        expandedCards.delete(subPath);
        userOpenedCards.delete(subPath);
    } else {
        expandedCards.add(subPath);
        userOpenedCards.add(subPath);
    }
    if (lastMetrics) renderCanvas(lastMetrics);
}

function renderCanvas(metrics) {
    if (!metrics.cores) {
        if(uiLoadingOverlay) uiLoadingOverlay.classList.add("hidden");
        updateTutorialUI();
        return;
    }
    const newCoreList = Object.keys(metrics.cores);
    if (JSON.stringify(coreList) !== JSON.stringify(newCoreList)) {
        coreList = newCoreList;
        if (coreList.length === 0) currentCoreIndex = -1;
        else if (currentCoreIndex >= coreList.length || currentCoreIndex === -1) currentCoreIndex = 0;
        expandedCards.clear();
        userOpenedCards.clear();
        renderCoreDots();
        updateTutorialUI();
    }
    if (currentCoreIndex === -1) {
        if(topNavbar) topNavbar.style.display = "none";
        if(canvasArea) canvasArea.innerHTML = "";
        if(uiLoadingOverlay) uiLoadingOverlay.classList.add("hidden");
        return;
    }
    if(topNavbar) topNavbar.style.display = "flex";
    const activeCoreName = coreList[currentCoreIndex];
    const subfolders = metrics.cores[activeCoreName];
    const subfolderKeys = (metrics.ui_order && metrics.ui_order[activeCoreName]) ? metrics.ui_order[activeCoreName] : Object.keys(subfolders);

    if (canvasArea) {
        if (canvasArea.children.length === 0 || !document.getElementById('col-0')) {
            canvasArea.innerHTML = '<div class="masonry-col" id="col-0"></div><div class="masonry-col" id="col-1"></div>';
        }
    }
    const col0 = document.getElementById('col-0');
    const col1 = document.getElementById('col-1');
    if (col0 && col1) {
        Array.from(col0.children).concat(Array.from(col1.children)).forEach(el => {
            if (el.classList.contains("subfolder-card") && !subfolderKeys.includes(el.dataset.rawPath)) el.remove();
        });
    }
    if (!isBuildingCanvas) {
        subfolderKeys.forEach((key, index) => {
            const targetCol = index % 2 === 0 ? col0 : col1;
            const targetIndex = Math.floor(index / 2);
            const el = document.getElementById(getSafeId(key));
            if (el) {
                const targetSibling = targetCol.children[targetIndex];
                if (targetSibling !== el) {
                    el.style.animation = 'none'; void el.offsetWidth;
                    const st = subfolders[key].status;
                    if (st === "Esclusa") el.style.animation = 'slideDownExcluded 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
                    else if (st === "Completato") el.style.animation = 'slideDownCompleted 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
                    else el.style.animation = 'popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
                    targetCol.insertBefore(el, targetSibling || null);
                }
            }
        });
    }
    const keysToCreate = subfolderKeys.filter(k => !document.getElementById(getSafeId(k)));
    if (keysToCreate.length > 15 && !isBuildingCanvas) {
        isBuildingCanvas = true;
        if(uiLoadingOverlay) uiLoadingOverlay.classList.remove("hidden");
        let idx = 0; const CHUNK_SIZE = 15;
        requestAnimationFrame(() => {
            requestAnimationFrame(function buildChunk() {
                const chunk = keysToCreate.slice(idx, idx + CHUNK_SIZE);
                chunk.forEach(subPath => {
                    const globalIndex = subfolderKeys.indexOf(subPath);
                    const targetCol = globalIndex % 2 === 0 ? col0 : col1;
                    createCardDOM(subPath, activeCoreName, targetCol);
                    updateCardData(subPath, subfolders[subPath], getSafeId(subPath));
                });
                idx += CHUNK_SIZE;
                let pct = (idx / keysToCreate.length) * 100;
                if(uiBuilderBg) uiBuilderBg.style.width = `${pct > 100 ? 100 : pct}%`;
                if(uiLoadingText) uiLoadingText.textContent = `${Math.floor(pct > 100 ? 100 : pct)}%`;
                if (idx < keysToCreate.length) requestAnimationFrame(buildChunk);
                else {
                    isBuildingCanvas = false;
                    if(uiLoadingOverlay) uiLoadingOverlay.classList.add("hidden");
                    const oldKeys = subfolderKeys.filter(k => !keysToCreate.includes(k));
                    oldKeys.forEach(subPath => updateCardData(subPath, subfolders[subPath], getSafeId(subPath)));
                    if (lastMetrics) requestAnimationFrame(() => renderCanvas(lastMetrics));
                }
            });
        });
    } else if (!isBuildingCanvas) {
        keysToCreate.forEach(subPath => {
            const globalIndex = subfolderKeys.indexOf(subPath);
            const targetCol = globalIndex % 2 === 0 ? col0 : col1;
            createCardDOM(subPath, activeCoreName, targetCol);
        });
        subfolderKeys.forEach(subPath => updateCardData(subPath, subfolders[subPath], getSafeId(subPath)));
        if(uiLoadingOverlay) uiLoadingOverlay.classList.add("hidden");
    }
}

function createCardDOM(subPath, activeCoreName, targetContainer) {
    const safeId = getSafeId(subPath);
    if (document.getElementById(safeId)) return;

    let card = document.createElement("div");
    card.className = "subfolder-card";
    card.id = safeId;
    card.dataset.rawPath = subPath;

    const shortName = subPath === activeCoreName ? "(Root)" : subPath.split(/[\\/]/).pop();
    const safeTitle = shortName.replace(/"/g, '&quot;');
    const escapedCoreName = activeCoreName.replace(/\\/g, '\\\\');
    const escapedSubPath = subPath.replace(/\\/g, '\\\\');

    card.innerHTML = `
        <div class="ring-main" id="ring-main-${safeId}"></div>
        
        <!-- Nuovo Overlay Centrale di Stato -->
        <div class="card-status-overlay" id="overlay-${safeId}">
            <i class="card-status-icon" id="overlay-icon-${safeId}"></i>
            <div class="card-status-title" id="overlay-title-${safeId}"></div>
            <div class="card-status-subtitle"><i class="fa-solid fa-arrows-up-down"></i> Spostamento in corso...</div>
        </div>
        
        <div class="card-inner" id="inner-${safeId}">
            ${window.getFolderHeaderHTML ? window.getFolderHeaderHTML(shortName, safeTitle, escapedSubPath, safeId) : ''}
            <div class="file-grid-animator" id="animator-${safeId}">
                <div class="file-grid" id="grid-${safeId}"></div>
            </div>
            <div class="card-footer" id="footer-${safeId}" onmouseleave="triggerMorphLeave('${safeId}')" onmouseenter="cancelMorphLeave('${safeId}')">
                <div class="footer-top-row" id="top-row-${safeId}">
                    ${window.getLeftFooterHTML ? window.getLeftFooterHTML(escapedCoreName, escapedSubPath, safeId) : ''}
                    ${window.getRightFooterHTML ? window.getRightFooterHTML(safeId) : ''}
                </div>
                ${window.getRightStatsPanelHTML ? window.getRightStatsPanelHTML(safeId) : ''}
                ${window.getLeftMorphHTML ? window.getLeftMorphHTML(safeId) : ''}
            </div>
        </div>
    `;

    const excludeBtn = card.querySelector('.btn-exclude-action');
    if (excludeBtn) excludeBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFolderExclusion(activeCoreName, subPath, safeId); });

    if (targetContainer) targetContainer.appendChild(card);
    if (window.initRightPanelListeners) window.initRightPanelListeners(safeId);
}

function updateCardData(subPath, subData, safeId) {
    const card = document.getElementById(safeId);
    if (!card) return;

    // Ferma l'aggiornamento visivo se è in corso un'animazione Overlay manuale
    const isAnimatingExclusion = card.dataset.isAnimatingExclusion === "true";

    const badgeEl = document.getElementById(`badge-${safeId}`);
    const fEta = document.getElementById(`footer-eta-${safeId}`);
    const animatorEl = document.getElementById(`animator-${safeId}`);
    const gridEl = document.getElementById(`grid-${safeId}`);
    const btnExclude = document.getElementById(`btn-exclude-${safeId}`);

    let c_comp = subData.completed || 0;
    let c_err = subData.errors || 0;
    let c_skip = subData.skipped || 0;
    let c_aud = subData.c_aud || 0;
    let c_tot = subData.total_files || 0;
    let validSize = subData.valid_size || 0;
    let is_processing = subData.is_processing || false;
    let totalProcessed = c_comp + c_err + c_skip;

    let isEsclusa = (subData.status === "Esclusa");
    let isCompletato = (subData.status === "Completato");
    let is_visually_processing = (subData.status === "In Esecuzione");

    // Helper intelligente per innescare l'animazione Elastica unicamente al cambio del testo
    const updateBadgeText = (text) => {
        if (!badgeEl) return;

        // Ripuliamo eventuali vecchi inline-styles per far regnare i colori dinamici del CSS
        badgeEl.style.backgroundColor = "";
        badgeEl.style.borderColor = "";
        badgeEl.style.color = "";
        badgeEl.style.boxShadow = "";

        if (badgeEl.textContent !== text) {
            badgeEl.textContent = text;
            badgeEl.classList.remove('status-bounce');
            void badgeEl.offsetWidth; // Forza il browser a registrare il reset dell'animazione
            badgeEl.classList.add('status-bounce');
        }
    };

    // Esegue i cambiamenti visivi solo se non interferisce con l'Overlay
    if (!isAnimatingExclusion) {
        if (btnExclude) {
            const iconContainer = document.getElementById(`btn-exclude-icon-${safeId}`);
            const textContainer = document.getElementById(`btn-exclude-text-${safeId}`);
            if (isEsclusa) {
                btnExclude.classList.add("is-excluded");
                if(iconContainer) iconContainer.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
                if(textContainer) textContainer.textContent = 'Includi cartella';
            }
            else {
                btnExclude.classList.remove("is-excluded");
                if(iconContainer) iconContainer.innerHTML = '<i class="fa-solid fa-ban"></i>';
                if(textContainer) textContainer.textContent = 'Escludi cartella';
            }
        }

        if (isEsclusa) {
            card.classList.remove("active-execution", "folder-completed"); card.classList.add("folder-excluded");
            updateBadgeText("ESCLUSA");
            if (!userOpenedCards.has(subPath)) expandedCards.delete(subPath);

        } else if (isCompletato) {
            card.classList.remove("active-execution", "folder-excluded"); card.classList.add("folder-completed");
            updateBadgeText("COMPLETATO");

            if (!userOpenedCards.has(subPath) && expandedCards.has(subPath)) {
                if (!folderCloseTimers[subPath]) {
                    folderCloseTimers[subPath] = setTimeout(() => { expandedCards.delete(subPath); delete folderCloseTimers[subPath]; if (lastMetrics) renderCanvas(lastMetrics); }, 2000);
                }
            } else if (!expandedCards.has(subPath)) { if (folderCloseTimers[subPath]) { clearTimeout(folderCloseTimers[subPath]); delete folderCloseTimers[subPath]; } }

        } else if (is_visually_processing) {
            card.classList.remove("folder-completed", "folder-excluded"); card.classList.add("active-execution");
            updateBadgeText("IN ESECUZIONE");
            expandedCards.add(subPath);
            if (folderCloseTimers[subPath]) { clearTimeout(folderCloseTimers[subPath]); delete folderCloseTimers[subPath]; }

        } else {
            card.classList.remove("active-execution", "folder-completed", "folder-excluded");
            updateBadgeText("IN ATTESA");

            if (!userOpenedCards.has(subPath) && expandedCards.has(subPath)) {
                if (!folderCloseTimers[subPath]) {
                    folderCloseTimers[subPath] = setTimeout(() => { expandedCards.delete(subPath); delete folderCloseTimers[subPath]; if (lastMetrics) renderCanvas(lastMetrics); }, 2000);
                }
            }
        }
    }

    let pMeta = subData.p_meta || 0;
    let pVideo = subData.p_v_codec || 0;
    let pAudio = subData.p_a_codec || 0;
    let pVol = subData.p_vol || 0;
    let displayPct = subData.p_global || 0;

    if (isCompletato || isEsclusa) displayPct = 100.0;
    else if (displayPct >= 100 && totalProcessed < c_tot) displayPct = 99.9;

    if (!isCompletato && !isEsclusa) {
        const rMain = document.getElementById(`ring-main-${safeId}`);
        if(rMain) {
            rMain.style.opacity = displayPct >= 100 ? '0' : '1';
            const ringColor = is_visually_processing ? "var(--warning)" : "var(--f-attesa)";
            rMain.style.background = `conic-gradient(from 0deg, ${ringColor} ${displayPct}%, transparent 0%)`;
        }
    }

    let progVid = c_tot > 0 ? (subData.video_processed_duration / subData.total_duration) * 100 : 0;
    progVid = Math.min(100, Math.max(0, progVid || 0));

    if (!isEsclusa && (subData.status === "In Esecuzione" || is_processing)) {
        const now = Date.now();
        if (!folderEtaCache[subPath]) folderEtaCache[subPath] = { lastTime: now, lastProg: progVid, speed: 0 };
        else {
            const cache = folderEtaCache[subPath];
            const timeDiff = (now - cache.lastTime) / 1000;
            const progDiff = progVid - cache.lastProg;
            if (progDiff > 0 && timeDiff > 0.5) {
                cache.speed = cache.speed === 0 ? (progDiff / timeDiff) : (cache.speed * 0.8 + (progDiff / timeDiff) * 0.2);
                cache.lastTime = now; cache.lastProg = progVid;
            }
            if (cache.speed > 0) {
                const remainingSecs = (100 - progVid) / cache.speed;
                window.updateEtaDisplay(safeId, remainingSecs, 'running');
            }
        }
    } else if (isCompletato) {
        window.updateEtaDisplay(safeId, 0, 'completed');
    } else {
        window.updateEtaDisplay(safeId, -1, 'pending');
    }

    if (window.updateLeftFooterData) window.updateLeftFooterData(safeId, subData, c_comp, c_skip, c_aud, c_err);
    if (window.updateRightFooterData) window.updateRightFooterData(safeId, pMeta, pVideo, pAudio, pVol, displayPct, totalProcessed, c_tot, validSize);

    if (animatorEl) { if (expandedCards.has(subPath)) animatorEl.classList.add("open"); else animatorEl.classList.remove("open"); }
    if (expandedCards.has(subPath)) { renderFileBoxes(gridEl, subData.files); }
}