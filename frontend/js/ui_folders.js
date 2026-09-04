//imports
import { AVButton} from "../components/AVButton/AVButton.js";

window.toggleCard = function(subPath, safeId) {
    if (expandedCards.has(subPath)) {
        expandedCards.delete(subPath);
        userOpenedCards.delete(subPath);
    } else {
        expandedCards.add(subPath);
        userOpenedCards.add(subPath);
    }
    if (lastMetrics) window.processRenderLogic(lastMetrics);
}

window.isTransitioningCore = false;

window.renderCanvas = function(metrics) {
    if (window.isTransitioningCore) return;

    if (!metrics.cores) {
        if(uiLoadingOverlay) uiLoadingOverlay.classList.add("hidden");
        updateTutorialUI();
        return;
    }

    const newCoreList = Object.keys(metrics.cores);

    if (JSON.stringify(coreList) !== JSON.stringify(newCoreList)) {
        const isNewCoreAdded = newCoreList.length > coreList.length;
        const isCoreRemoved = newCoreList.length < coreList.length;

        let nextIndex = currentCoreIndex;

        if (newCoreList.length === 0) {
            nextIndex = -1;
        } else if (isNewCoreAdded) {
            nextIndex = newCoreList.length - 1;
        } else if (isCoreRemoved) {
            if (nextIndex >= newCoreList.length) {
                nextIndex = newCoreList.length - 1;
            }
        }

        window.isTransitioningCore = true;
        const canvasWrapper = document.getElementById('canvas-scroll-wrapper');
        if(canvasWrapper) canvasWrapper.classList.add('canvas-hidden');

        setTimeout(() => {
            coreList = newCoreList;
            currentCoreIndex = nextIndex;
            expandedCards.clear();
            userOpenedCards.clear();
            renderCoreDots();
            updateTutorialUI();

            window.isTransitioningCore = false;
            window.processRenderLogic(metrics);

            if(canvasWrapper) canvasWrapper.classList.remove('canvas-hidden');
        }, 400);
        return;
    }

    window.processRenderLogic(metrics);
}

window.processRenderLogic = function(metrics) {
    const topNavbar = document.getElementById("top-navbar");
    const canvasToolbar = document.getElementById("canvas-toolbar");

    if(topNavbar) topNavbar.style.display = "flex";

    if (currentCoreIndex === -1) {
        if(canvasToolbar) canvasToolbar.style.display = "none";
        if(canvasArea) canvasArea.innerHTML = "";
        if(uiLoadingOverlay) uiLoadingOverlay.classList.add("hidden");
        return;
    }

    if(topNavbar) topNavbar.style.display = "flex";
    if(canvasToolbar) {
        canvasToolbar.style.display = "flex";
        document.getElementById('canvas-toolbar-title').textContent = coreList[currentCoreIndex].split(/[\\/]/).pop();
    }

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
                    if (lastMetrics) requestAnimationFrame(() => window.processRenderLogic(lastMetrics));
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

    //Costruzione contenitori interni mantenendo il layout pre-esistente
    card.innerHTML = `
        <div class="ring-main" id="ring-main-${safeId}"></div>
        
        <div class="card-status-overlay" id="overlay-${safeId}">
            <i class="card-status-icon" id="overlay-icon-${safeId}"></i>
            <div class="card-status-title" id="overlay-title-${safeId}"></div>
            <div class="card-status-subtitle"><i class="fa-solid fa-arrows-up-down"></i> Spostamento in corso...</div>
        </div>
        
        <div class="card-inner" id="inner-${safeId}">
            <!-- Header iniettato programmaticamente -->
            
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

    const cardInner = card.querySelector(`#inner-${safeId}`);

    //Inizio costruzione componente Header
    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';

    const cardTitleRow = document.createElement('div')
    cardTitleRow.className = 'card-title-row';

    // Istanza: Pulsante apertura directory (A 2 STATI: Azione Immediata)
    const btnOpenFolder = new AVButton({
        direction: 'right',
        height: 42,

        states: [
            { // STATO 0: Normale
                icon: 'fa-solid fa-folder-open', text: 'Apri percorso', pillIcon: '',
                width: 165, gap: 4, transitionDuration: 350,
                autoRevertDelay: 0, hoverEnterDelay: 250, hoverLeaveDelay: 1200,
                glow: { enabled: false },
                colors: { buttonBg: 'rgba(59, 130, 246, 0.15)', buttonBorder: 'var(--primary)', icon: 'var(--primary)', pillBg: 'rgba(255, 255, 255, 0.08)', pillBorder: 'rgba(255, 255, 255, 0.15)', pillText: 'var(--text-main)' }
            },
            { // STATO 1: Azione Finale
                action: () => { if (window.openSystemFolder) window.openSystemFolder(escapedSubPath); },
                icon: 'fa-solid fa-check', text: 'Aperta', pillIcon: '',
                width: 120, gap: 5, transitionDuration: 300,
                autoRevertDelay: 1500,
                glow: { enabled: false },
                colors: { buttonBg: 'rgba(16, 185, 129, 0.2)', buttonBorder: 'var(--success)', icon: 'var(--success)', pillBg: 'var(--success)', pillBorder: 'var(--success)', pillText: '#000' }
            }
        ]
    });

    //Istanza: Riquadro del titolo (Centrale)
    const centerTitleBox = document.createElement('div');
    centerTitleBox.className = 'clickable-header-box';
    centerTitleBox.onclick = () => window.toggleCard(subPath, safeId);
    centerTitleBox.innerHTML = `
        <div class="card-title-text-wrapper">
            <span class="card-title-text" title="${safeTitle}">${shortName}</span>
        </div>
        <div class="status-badge" id="badge-${safeId}">IN ATTESA</div>
    `;

    // Istanza: Pulsante esclusione/inclusione (A 3 STATI: Pericolo)
    // Istanza 1: Pulsante ESCLUDI (A 3 STATI: Pericolo)
    const btnExclude = new AVButton({
        direction: 'left',
        height: 42,
        states: [
            { // STATO 0: Normale
                icon: 'fa-solid fa-trash', text: 'Escludi cartella', pillIcon: '',
                width: 185, gap: 4, transitionDuration: 350,
                autoRevertDelay: 0, hoverEnterDelay: 250, hoverLeaveDelay: 1200,
                glow: { enabled: false },
                colors: { buttonBg: 'rgba(239, 68, 68, 0.15)', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'rgba(255, 255, 255, 0.08)', pillBorder: 'rgba(255, 255, 255, 0.15)', pillText: 'var(--text-main)' }
            },
            { // STATO 1: Conferma (Flashing Glow)
                icon: 'fa-solid fa-trash', text: 'Confermi?', pillIcon: 'fa-solid fa-triangle-exclamation',
                width: 145, gap: 2, transitionDuration: 250,
                autoRevertDelay: 3000,
                glow: { enabled: true, target: ['border', 'icon'], color: 'var(--danger)', speed: 1.2 },
                colors: { buttonBg: 'rgba(239, 68, 68, 0.15)', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'rgba(239, 68, 68, 0.2)', pillBorder: 'var(--danger)', pillText: 'var(--danger)' }
            },
            { // STATO 2: Azione Finale
                action: () => { if (window.toggleFolderExclusion) window.toggleFolderExclusion(activeCoreName, subPath, safeId); },
                icon: 'fa-solid fa-ban', text: 'Esclusa', pillIcon: '',
                width: 120, gap: 5, transitionDuration: 300,
                autoRevertDelay: 1500,
                glow: { enabled: false },
                colors: { buttonBg: 'rgba(239, 68, 68, 0.3)', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'var(--danger)', pillBorder: 'var(--danger)', pillText: '#fff' }
            }
        ]
    });
    btnExclude.getNode().id = `btn-exclude-${safeId}`;

    // Istanza 2: Pulsante INCLUDI (A 2 STATI: Azione Diretta Positiva)
    const btnInclude = new AVButton({
        direction: 'left',
        height: 42,
        states: [
            { // STATO 0: Normale (Verde base)
                icon: 'fa-solid fa-rotate-left', text: 'Includi cartella', pillIcon: '',
                width: 180, gap: 4, transitionDuration: 350,
                autoRevertDelay: 0, hoverEnterDelay: 250, hoverLeaveDelay: 1200,
                glow: { enabled: false },
                colors: { buttonBg: 'rgba(16, 185, 129, 0.15)', buttonBorder: 'var(--success)', icon: 'var(--success)', pillBg: 'rgba(255, 255, 255, 0.08)', pillBorder: 'rgba(255, 255, 255, 0.15)', pillText: 'var(--text-main)' }
            },
            { // STATO 1: Azione Finale (Niente conferma richiesta)
                action: () => { if (window.toggleFolderExclusion) window.toggleFolderExclusion(activeCoreName, subPath, safeId); },
                icon: 'fa-solid fa-check', text: 'Inclusa', pillIcon: '',
                width: 120, gap: 5, transitionDuration: 300,
                autoRevertDelay: 1500,
                glow: { enabled: false },
                colors: { buttonBg: 'rgba(16, 185, 129, 0.3)', buttonBorder: 'var(--success)', icon: 'var(--success)', pillBg: 'var(--success)', pillBorder: 'var(--success)', pillText: '#000' }
            }
        ]
    });
    btnInclude.getNode().id = `btn-include-${safeId}`;

    //Esclusione di default (updateCardData lo mostrerà)
    btnInclude.getNode().style.display = 'none';

    //Aggiungo i nodi alla riga
    cardTitleRow.appendChild(btnOpenFolder.getNode());
    cardTitleRow.appendChild(centerTitleBox);
    cardTitleRow.appendChild(btnExclude.getNode());
    cardTitleRow.appendChild(btnInclude.getNode());

    cardHeader.appendChild(cardTitleRow);

    //Inserisco prima della griglia dei file
    cardInner.insertBefore(cardHeader, cardInner.firstChild);

    if (targetContainer) targetContainer.appendChild(card);
    if (window.initRightPanelListeners) window.initRightPanelListeners(safeId);
}

function updateCardData(subPath, subData, safeId) {
    const card = document.getElementById(safeId);
    if (!card) return;

    const isFirstUpdate = !card.dataset.initialized;
    const isAnimatingExclusion = card.dataset.isAnimatingExclusion === "true";

    const badgeEl = document.getElementById(`badge-${safeId}`);
    const animatorEl = document.getElementById(`animator-${safeId}`);
    const gridEl = document.getElementById(`grid-${safeId}`);

    // Dati base
    let c_comp = subData.completed || 0;
    let c_err = subData.errors || 0;
    let c_skip = subData.skipped || 0;
    let c_aud = subData.c_aud || 0;
    let c_tot = subData.total_files || 0;
    let validSize = subData.valid_size || 0;
    let is_processing = subData.is_processing || false;
    let totalProcessed = c_comp + c_err + c_skip;

    // Stati calcolati
    let isEsclusa = (subData.status === "Esclusa");
    let isCompletato = (subData.status === "Completato");
    let isCompletando = (subData.status === "Completando...");
    let is_visually_processing = (subData.status === "In Esecuzione");

    // Funzione helper per badge centrale
    const updateBadgeText = (text) => {
        if (!badgeEl) return;
        badgeEl.style.backgroundColor = ""; badgeEl.style.borderColor = "";
        badgeEl.style.color = ""; badgeEl.style.boxShadow = "";
        if (badgeEl.textContent !== text) {
            badgeEl.textContent = text;
            badgeEl.classList.remove('status-bounce');
            void badgeEl.offsetWidth;
            if (!isFirstUpdate) badgeEl.classList.add('status-bounce');
        }
    };

    const overlay = document.getElementById(`overlay-${safeId}`);
    const overlayIcon = document.getElementById(`overlay-icon-${safeId}`);
    const overlayTitle = document.getElementById(`overlay-title-${safeId}`);

    // --- AGGIORNAMENTO STATI E UI ---
    if (!isAnimatingExclusion) {

        // --- NUOVA GESTIONE BOTTONI ESCLUDI/INCLUDI ---
        const btnIncludeDOM = document.getElementById(`btn-include-${safeId}`);
        const btnExcludeDOM = document.getElementById(`btn-exclude-${safeId}`);

        if (btnExcludeDOM && btnIncludeDOM) {
            if (isEsclusa) {
                // Se la cartella è esclusa, nascondi il bottone rosso e mostra il verde
                btnExcludeDOM.style.display = 'none';
                btnIncludeDOM.style.display = 'block';
            } else {
                // Se la cartella è attiva, mostra il rosso e nascondi il verde
                btnExcludeDOM.style.display = 'block';
                btnIncludeDOM.style.display = 'none';
            }
        }
        // ----------------------------------------------

        // Gestione Classi e Overlay Card
        if (isCompletando) {
            card.classList.remove("active-execution", "folder-excluded", "folder-completed");
            card.classList.add("folder-completando");
            updateBadgeText("COMPLETAMENTO");
            if (overlay) {
                overlayIcon.className = "fa-solid fa-check-circle card-status-icon";
                overlayIcon.style.color = "var(--success)";
                overlayTitle.textContent = "CARTELLA COMPLETATA";
                overlayTitle.style.color = "var(--success)";
                overlay.classList.add("active");
            }
        } else if (isEsclusa) {
            card.classList.remove("active-execution", "folder-completed", "folder-completando");
            card.classList.add("folder-excluded");
            updateBadgeText("ESCLUSA");
            if(overlay) overlay.classList.remove("active");
            if (!userOpenedCards.has(subPath)) expandedCards.delete(subPath);
        } else if (isCompletato) {
            card.classList.remove("active-execution", "folder-excluded", "folder-completando");
            card.classList.add("folder-completed");
            updateBadgeText("COMPLETATO");
            if(overlay) overlay.classList.remove("active");

            if (!userOpenedCards.has(subPath) && expandedCards.has(subPath)) {
                if (!folderCloseTimers[subPath]) {
                    folderCloseTimers[subPath] = setTimeout(() => { expandedCards.delete(subPath); delete folderCloseTimers[subPath]; if (lastMetrics) window.processRenderLogic(lastMetrics); }, 2000);
                }
            } else if (!expandedCards.has(subPath)) { if (folderCloseTimers[subPath]) { clearTimeout(folderCloseTimers[subPath]); delete folderCloseTimers[subPath]; } }
        } else if (is_visually_processing) {
            card.classList.remove("folder-completed", "folder-excluded", "folder-completando");
            card.classList.add("active-execution");
            updateBadgeText("IN ESECUZIONE");
            if(overlay) overlay.classList.remove("active");
            expandedCards.add(subPath);
            if (folderCloseTimers[subPath]) { clearTimeout(folderCloseTimers[subPath]); delete folderCloseTimers[subPath]; }
        } else {
            card.classList.remove("active-execution", "folder-completed", "folder-excluded", "folder-completando");
            updateBadgeText("IN ATTESA");
            if(overlay) overlay.classList.remove("active");
            if (!userOpenedCards.has(subPath) && expandedCards.has(subPath)) {
                if (!folderCloseTimers[subPath]) {
                    folderCloseTimers[subPath] = setTimeout(() => { expandedCards.delete(subPath); delete folderCloseTimers[subPath]; if (lastMetrics) window.processRenderLogic(lastMetrics); }, 2000);
                }
            }
        }
    }

    // --- CALCOLO STATISTICHE E CARICAMENTO ---
    let pMeta = subData.p_meta || 0; let pVideo = subData.p_v_codec || 0;
    let pAudio = subData.p_a_codec || 0; let pVol = subData.p_vol || 0;
    let displayPct = subData.p_global || 0;

    if (isCompletato || isEsclusa) displayPct = 100.0;
    else if (displayPct >= 100 && totalProcessed < c_tot) displayPct = 99.9;

    // Aggiornamento Cerchio di Caricamento (Ring)
    if (!isCompletato && !isEsclusa) {
        const rMain = document.getElementById(`ring-main-${safeId}`);
        if(rMain) {
            rMain.style.opacity = displayPct >= 100 ? '0' : '1';
            const ringColor = is_visually_processing ? "var(--warning)" : "var(--f-attesa)";
            rMain.style.background = `conic-gradient(from 0deg, ${ringColor} ${displayPct}%, transparent 0%)`;
        }
    }

    // Calcolo ETA
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

    // Aggiornamenti componenti esterni dipendenti
    if (window.updateLeftFooterData) window.updateLeftFooterData(safeId, subData, c_comp, c_skip, c_aud, c_err);
    if (window.updateRightFooterData) window.updateRightFooterData(safeId, pMeta, pVideo, pAudio, pVol, displayPct, totalProcessed, c_tot, validSize);

    // Gestione espansione griglia
    if (animatorEl) {
        if (expandedCards.has(subPath)) animatorEl.classList.add("open");
        else animatorEl.classList.remove("open");
    }
    if (expandedCards.has(subPath)) {
        renderFileBoxes(gridEl, subData.files);
    }

    if (isFirstUpdate) card.dataset.initialized = "true";
}