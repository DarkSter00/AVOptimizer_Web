function updateTutorialUI() {
    if (coreList.length === 0) {
        if(btnAddFolder) btnAddFolder.classList.add("pulse-primary");
        if(btnTogglePlay) {
            btnTogglePlay.disabled = true;
            btnTogglePlay.className = "btn btn-secondary";
            btnTogglePlay.innerHTML = "▶ Avvia";
        }
    } else {
        if(btnAddFolder) btnAddFolder.classList.remove("pulse-primary");
        if(btnTogglePlay) {
            btnTogglePlay.disabled = false;
            if (isPaused) {
                btnTogglePlay.className = "btn btn-success pulse-success";
                btnTogglePlay.innerHTML = "▶ Avvia";
            } else {
                btnTogglePlay.className = "btn btn-warning pulse-warning";
                btnTogglePlay.innerHTML = "⏸ Pausa";
            }
        }
    }
}

function renderCoreDots() {
    const selector = document.getElementById("core-selector");
    if(!selector) return;

    if (coreList.length <= 1) {
        selector.innerHTML = "";
        if (coreList.length === 1) {
            const dot = document.createElement("div");
            dot.className = "core-dot active";
            const span = document.createElement("span");
            span.textContent = coreList[0].split(/[\\/]/).pop();
            dot.appendChild(span);
            selector.appendChild(dot);
        }
        return;
    }
    if (selector.children.length !== coreList.length) {
        selector.innerHTML = "";
        coreList.forEach((corePath, index) => {
            const dot = document.createElement("div");
            dot.className = "core-dot" + (index === currentCoreIndex ? " active" : "");
            const span = document.createElement("span");
            span.textContent = corePath.split(/[\\/]/).pop();
            dot.appendChild(span);
            dot.addEventListener("click", () => {
                if (currentCoreIndex !== index) {
                    currentCoreIndex = index;
                    expandedCards.clear();
                    userOpenedCards.clear();
                    renderCoreDots();
                    if (lastMetrics) renderCanvas(lastMetrics);
                }
            });
            selector.appendChild(dot);
        });
    } else {
        Array.from(selector.children).forEach((dot, index) => {
            if (index === currentCoreIndex) dot.classList.add("active");
            else dot.classList.remove("active");
        });
    }
}

function updateDashboard(metrics) {
    const g = metrics.global;
    if (g.is_paused !== undefined && isPaused !== g.is_paused) {
        isPaused = g.is_paused;
        updateTutorialUI();
    }

    if (g.is_scanning) {
        if (scannerWidget) scannerWidget.classList.remove("hidden");

        let stepName = "Inizializzazione...";
        let fileStr = g.scan_file || "Attendere...";
        let progress = g.scan_progress || 0;

        if (g.scan_step === 1) {
            stepName = "Mappatura disco...";
            progress = 5;
        } else if (g.scan_step === 2) {
            stepName = "Interrogazione Database RAM...";
            progress = 10;
        } else if (g.scan_step === 3) {
            stepName = "Lettura Cache DB Metadati";
            progress = g.scan_progress || 0;
            fileStr = g.scan_file || "Controllo file in cache...";
        } else if (g.scan_step === 4) {
            stepName = "Estrazione Metadati (ffprobe)";
            progress = g.scan_progress || 0;
            if (g.scan_file && g.scan_file.includes('|')) {
                const parts = g.scan_file.split('|');
                fileStr = parts.slice(1).join('|').trim() + ` (${parts[0].trim()})`;
            } else {
                fileStr = g.scan_file || "";
            }
        }

        if (scannerStepText) scannerStepText.textContent = stepName;
        if (scannerFileText) scannerFileText.textContent = fileStr;
        if (scannerBg) scannerBg.style.width = `${progress}%`;
        if (scannerPctText) scannerPctText.textContent = `${Math.floor(progress)}%`;

    } else {
        if (scannerWidget) scannerWidget.classList.add("hidden");
    }

    if(lblFiles) lblFiles.textContent = `${g.completed} / ${g.total_files}`;
    if(lblSkipped) lblSkipped.textContent = `${g.skipped}`;
    if(lblErrors) lblErrors.textContent = `${g.errors}`;
    if(lblSavedSpace) lblSavedSpace.textContent = formatBytes(g.saved_space || 0);
}

function updateProgress(data) {
    if(globalProgress) globalProgress.style.width = `${data.global_prog}%`;
    const cleanFilename = data.filename.replace("Check: ", "").trim();

    let opName = "🎬 ELABORAZIONE";
    let opColor = "var(--warning)";

    if (data.op_type === "audio") {
        opName = "🎵 ANALISI AUDIO";
        opColor = "var(--purple)";
    } else if (data.op_type === "video_audio") {
        opName = "🎬+🔊 CONV & NORM";
        opColor = "var(--warning)";
    } else if (data.op_type === "video") {
        opName = "🎬 CONV. VIDEO";
        opColor = "var(--warning)";
    } else if (data.op_type === "audio_norm") {
        opName = "🔊 NORMALIZZAZIONE";
        opColor = "var(--cyan)";
    }

    let etaString = "Calc...";
    const now = Date.now();
    if (!fileEtaCache[cleanFilename]) {
        fileEtaCache[cleanFilename] = { lastTime: now, lastProg: data.file_prog, speed: 0 };
    } else {
        const cache = fileEtaCache[cleanFilename];
        const timeDiff = (now - cache.lastTime) / 1000;
        const progDiff = data.file_prog - cache.lastProg;
        if (progDiff > 0 && timeDiff > 0.1) {
            const currentSpeed = progDiff / timeDiff;
            cache.speed = cache.speed === 0 ? currentSpeed : (cache.speed * 0.8 + currentSpeed * 0.2);
            cache.lastTime = now;
            cache.lastProg = data.file_prog;
        }
        if (cache.speed > 0) {
            const remainingSecs = (100 - data.file_prog) / cache.speed;
            if (remainingSecs < 60) etaString = `${Math.round(remainingSecs)}s`;
            else etaString = `${Math.floor(remainingSecs/60)}m ${Math.round(remainingSecs%60)}s`;
        }
    }

    try {
        const escapedName = CSS.escape(cleanFilename);
        const fileBoxes = document.querySelectorAll(`.file-box[data-filename="${escapedName}"]`);

        fileBoxes.forEach(box => {
            box.className = "file-box state-processing";
            box.style.borderColor = opColor;
            box.style.setProperty('--op-color', opColor);

            const opLabel = box.querySelector('.op-label');
            if (opLabel) {
                opLabel.textContent = opName;
                opLabel.style.color = opColor;
            }

            const pctLabel = box.querySelector('.pct-label');
            if (pctLabel) pctLabel.style.color = opColor;

            const bg = box.querySelector('.file-progress-bg');
            if (bg) {
                bg.style.backgroundColor = opColor;
                bg.style.transform = `scaleX(${data.file_prog / 100})`;
            }

            if (now - (box.dataset.lastTextUpdate || 0) > 200) {
                if (pctLabel) pctLabel.textContent = `${data.file_prog.toFixed(1)}%`;
                const ETA = box.querySelector('.eta-label');
                if (ETA) ETA.textContent = `ETA: ${etaString}`;
                box.dataset.lastTextUpdate = now;
            }
        });
    } catch(e) {}
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

    const subfolderKeys = (metrics.ui_order && metrics.ui_order[activeCoreName])
        ? metrics.ui_order[activeCoreName]
        : Object.keys(subfolders);

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
                    el.style.animation = 'none';
                    void el.offsetWidth;

                    const st = subfolders[key].status;
                    if (st === "Esclusa") {
                        el.style.animation = 'slideDownExcluded 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
                    } else if (st === "Completato") {
                        el.style.animation = 'slideDownCompleted 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
                    } else {
                        el.style.animation = 'popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
                    }
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

                if (idx < keysToCreate.length) {
                    requestAnimationFrame(buildChunk);
                } else {
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
        <div class="ring-video" id="ring-vid-${safeId}"></div>
        <div class="ring-audio" id="ring-aud-${safeId}"></div>
        <div class="card-inner" id="inner-${safeId}">
            <div class="card-header">
                <div class="card-title-row">
                    <div class="card-header-group">
                        <div class="folder-icon-box" onclick="openSystemFolder('${escapedSubPath}')" title="Apri cartella nel sistema">
                            <span>📁</span>
                        </div>
                        <div class="clickable-header-box" onclick="toggleCard('${escapedSubPath}', '${safeId}')" title="Espandi / Riduci">
                            <span title="${safeTitle}" class="card-title-text">${shortName}</span>
                        </div>
                    </div>
                    <div class="card-controls">
                        <span class="status-badge" id="badge-${safeId}">ATTESA</span>
                        <div class="card-actions">
                            <button class="btn-mini btn-mini-danger btn-exclude-action" id="btn-exclude-${safeId}" title="Escludi / Includi Cartella">🚫</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="file-grid-animator" id="animator-${safeId}">
                <div class="file-grid" id="grid-${safeId}"></div>
            </div>
            
            <div class="card-footer" id="footer-${safeId}" 
                 onmouseleave="triggerMorphLeave('${safeId}')" 
                 onmouseenter="cancelMorphLeave('${safeId}')">
                 
                <div class="footer-top-row" id="top-row-${safeId}">
                    
                    <div class="footer-buttons" id="badges-${safeId}">
                        <span class="badge badge-success clickable" id="btn-comp-${safeId}" 
                            onclick="toggleMorph('${escapedCoreName}', '${escapedSubPath}', '${safeId}', 'completed', 'btn-comp-${safeId}')">
                            <span>✔️</span> <span class="tab-count">0</span><span class="tab-label">Completati</span>
                        </span>
                            
                        <span class="badge badge-cyan clickable" id="btn-skip-${safeId}" 
                            onclick="toggleMorph('${escapedCoreName}', '${escapedSubPath}', '${safeId}', 'skipped', 'btn-skip-${safeId}')">
                            <span>⏭️</span> <span class="tab-count">0</span><span class="tab-label">Saltati</span>
                        </span>
                            
                        <span class="badge badge-purple clickable" id="btn-aud-${safeId}" 
                            onclick="toggleMorph('${escapedCoreName}', '${escapedSubPath}', '${safeId}', 'analyzed_waiting', 'btn-aud-${safeId}')">
                            <span>🎵</span> <span class="tab-count">0</span><span class="tab-label">Audio OK</span>
                        </span>
                            
                        <span class="badge badge-danger clickable" id="btn-err-${safeId}" 
                            onclick="toggleMorph('${escapedCoreName}', '${escapedSubPath}', '${safeId}', 'error', 'btn-err-${safeId}')">
                            <span>❌</span> <span class="tab-count">0</span><span class="tab-label">Errori</span>
                        </span>
                    </div>

                    <div class="footer-info" id="info-right-${safeId}">
                        <span class="badge badge-dark" id="footer-comp-tot-${safeId}">0/0 File</span>
                        <span class="badge badge-primary" id="footer-comp-size-${safeId}">💾 0 B</span>
                        <span class="badge badge-warning" id="footer-eta-${safeId}">ETA: --</span>
                        <span class="badge badge-dark footer-percent" id="footer-pct-${safeId}">0.0%</span>
                    </div>

                </div>
                
                <div class="inline-list-spacer" id="spacer-${safeId}"></div>
                <div class="morph-box" id="morph-${safeId}">
                    <div class="morph-content" id="morph-content-${safeId}"></div>
                </div>
            </div>
        </div>
    `;

    card.querySelector('.btn-exclude-action').addEventListener('click', (e) => { e.stopPropagation(); toggleFolderExclusion(activeCoreName, subPath, safeId); });
    if (targetContainer) targetContainer.appendChild(card);
}

function renderMorphContent(safeId, subData, category) {
    const content = document.getElementById(`morph-content-${safeId}`);
    if (!content) return;

    let itemsHtml = '<ul class="error-list" style="margin-top: 5px;">';
    let count = 0;
    let borderClass = "";

    if (category === 'error') { borderClass = "var(--danger)"; }
    else if (category === 'completed') { borderClass = "var(--success)"; }
    else if (category === 'skipped') { borderClass = "var(--cyan)"; }
    else if (category === 'analyzed_waiting') { borderClass = "var(--purple)"; }

    for (const [fname, state] of Object.entries(subData.files)) {
        let match = false;
        if (category === 'completed' && state.status.startsWith('completed')) match = true;
        else if (state.status === category) match = true;

        if (match) {
            count++;
            itemsHtml += `
                <li class="error-item" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); margin-bottom: 5px; padding: 8px 12px; border-left-color: ${borderClass};">
                    <span class="error-item-name" style="font-size:12px; color: #fff;">${fname}</span>
                </li>
            `;
        }
    }
    itemsHtml += '</ul>';

    if (count === 0) {
        itemsHtml = `<div style="text-align:center; padding: 15px; color: var(--text-muted); font-size: 13px;">Nessun file presente in questa categoria.</div>`;
    }

    content.innerHTML = itemsHtml;
}

function updateCardData(subPath, subData, safeId) {
    const card = document.getElementById(safeId);
    if (!card) return;

    const badgeEl = document.getElementById(`badge-${safeId}`);
    const fTot = document.getElementById(`footer-comp-tot-${safeId}`);
    const fOk = document.getElementById(`btn-comp-${safeId}`);
    const fSkip = document.getElementById(`btn-skip-${safeId}`);
    const fAud = document.getElementById(`btn-aud-${safeId}`);
    const fErr = document.getElementById(`btn-err-${safeId}`);
    const fSize = document.getElementById(`footer-comp-size-${safeId}`);
    const fPct = document.getElementById(`footer-pct-${safeId}`);
    const fEta = document.getElementById(`footer-eta-${safeId}`);

    const animatorEl = document.getElementById(`animator-${safeId}`);
    const gridEl = document.getElementById(`grid-${safeId}`);
    const btnExclude = document.getElementById(`btn-exclude-${safeId}`);
    const innerCard = document.getElementById(`inner-${safeId}`);
    const ringAud = document.getElementById(`ring-aud-${safeId}`);
    const ringVid = document.getElementById(`ring-vid-${safeId}`);

    let c_comp = 0, c_err = 0, c_skip = 0, c_aud = 0, c_tot = subData.total_files || 0;
    let is_processing = false;
    let validSize = 0;

    for (const [fname, state] of Object.entries(subData.files)) {
        if (state.status.startsWith("completed")) c_comp++;
        else if (state.status === "skipped") c_skip++;
        else if (state.status === "error") c_err++;
        else if (state.status === "analyzed_waiting") c_aud++;
        else if (state.status === "analyzing" || state.status === "converting" || state.status === "normalizing") is_processing = true;

        if (state.status !== "error") {
            validSize += (state.size || 0);
        }
    }

    if (!window.folderDebounce) window.folderDebounce = {};
    const nowTime = Date.now();
    if (is_processing) window.folderDebounce[safeId] = nowTime;
    let is_visually_processing = is_processing || (window.folderDebounce[safeId] && (nowTime - window.folderDebounce[safeId] < 2000));

    let totalProcessed = c_comp + c_err + c_skip;
    let isCompletato = (c_tot > 0 && totalProcessed === c_tot);
    let isEsclusa = (subData.status === "Esclusa");

    if (btnExclude) {
        if (isEsclusa) {
            btnExclude.className = "btn-mini btn-mini-success btn-exclude-action";
            btnExclude.textContent = "▶";
        } else {
            btnExclude.className = "btn-mini btn-mini-danger btn-exclude-action";
            btnExclude.textContent = "🚫";
        }
    }

    let progAud = c_tot > 0 ? (subData.audio_processed_duration / subData.total_duration) * 100 : 0;
    let progVid = c_tot > 0 ? (subData.video_processed_duration / subData.total_duration) * 100 : 0;
    progAud = Math.min(100, Math.max(0, progAud || 0));
    progVid = Math.min(100, Math.max(0, progVid || 0));

    if (isEsclusa) {
        card.classList.remove("active-execution", "folder-completed");
        card.classList.add("folder-excluded");
        if(badgeEl) { badgeEl.style.backgroundColor = "transparent"; badgeEl.style.borderColor = "#555"; badgeEl.style.color = "#888"; badgeEl.textContent = "ESCLUSA"; }
        if(innerCard) innerCard.style.backgroundColor = "rgba(25, 25, 30, 0.5)";
        if (!userOpenedCards.has(subPath)) expandedCards.delete(subPath);
    } else if (isCompletato) {
        card.classList.remove("active-execution", "folder-excluded");
        card.classList.add("folder-completed");
        if(badgeEl) { badgeEl.style.backgroundColor = "transparent"; badgeEl.style.borderColor = "var(--success)"; badgeEl.style.color = "var(--success)"; badgeEl.textContent = "COMPLETATO"; }
        if(innerCard) innerCard.style.backgroundColor = "transparent";

        if (!userOpenedCards.has(subPath) && expandedCards.has(subPath)) {
            if (!folderCloseTimers[subPath]) {
                folderCloseTimers[subPath] = setTimeout(() => {
                    expandedCards.delete(subPath);
                    delete folderCloseTimers[subPath];
                    if (lastMetrics) renderCanvas(lastMetrics);
                }, 2000);
            }
        } else if (!expandedCards.has(subPath)) {
            if (folderCloseTimers[subPath]) { clearTimeout(folderCloseTimers[subPath]); delete folderCloseTimers[subPath]; }
        }
    } else if (is_visually_processing) {
        card.classList.remove("folder-completed", "folder-excluded");
        card.classList.add("active-execution");
        if(badgeEl) { badgeEl.style.backgroundColor = "transparent"; badgeEl.style.borderColor = "var(--warning)"; badgeEl.style.color = "var(--warning)"; badgeEl.textContent = "IN ESECUZIONE"; }
        expandedCards.add(subPath);
        if(innerCard) innerCard.style.backgroundColor = "#211d14";

        if (folderCloseTimers[subPath]) { clearTimeout(folderCloseTimers[subPath]); delete folderCloseTimers[subPath]; }
    } else {
        card.classList.remove("active-execution", "folder-completed", "folder-excluded");
        if(badgeEl) { badgeEl.style.backgroundColor = "transparent"; badgeEl.style.borderColor = "#555"; badgeEl.style.color = "#aaa"; badgeEl.textContent = "IN ATTESA"; }
        if(innerCard) innerCard.style.backgroundColor = "var(--bg-card)";

        if (!userOpenedCards.has(subPath) && expandedCards.has(subPath)) {
            if (!folderCloseTimers[subPath]) {
                folderCloseTimers[subPath] = setTimeout(() => {
                    expandedCards.delete(subPath);
                    delete folderCloseTimers[subPath];
                    if (lastMetrics) renderCanvas(lastMetrics);
                }, 2000);
            }
        }
    }

    if (!isCompletato && !isEsclusa) {
        if(ringAud) ringAud.style.background = `conic-gradient(from 0deg, var(--purple) ${progAud}%, var(--bg-card) 0%)`;
        if(ringVid) ringVid.style.background = `conic-gradient(from 0deg, var(--warning) ${progVid}%, var(--border) 0%)`;
    }

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
            if (cache.speed > 0 && fEta) {
                const remainingSecs = (100 - progVid) / cache.speed;
                fEta.textContent = `ETA: ${remainingSecs < 60 ? Math.round(remainingSecs)+'s' : Math.floor(remainingSecs/60)+'m '+Math.round(remainingSecs%60)+'s'}`;
            }
        }
    } else if (isCompletato) {
        if(fEta) { fEta.textContent = "FINE"; fEta.className = "badge badge-success"; }
    } else {
        if(fEta) { fEta.textContent = "ETA: --"; fEta.className = "badge badge-warning"; }
    }

    if(fPct) fPct.textContent = `${progVid.toFixed(1)}%`;
    if(fTot) fTot.textContent = `${totalProcessed}/${c_tot} File`;

    if(fOk) { const c = fOk.querySelector('.tab-count'); if(c) c.textContent = c_comp; }
    if(fSkip) { const c = fSkip.querySelector('.tab-count'); if(c) c.textContent = c_skip; }
    if(fAud) { const c = fAud.querySelector('.tab-count'); if(c) c.textContent = c_aud; }
    if(fErr) { const c = fErr.querySelector('.tab-count'); if(c) c.textContent = c_err; }

    if(fSize) fSize.textContent = `💾 ${formatBytes(validSize)}`;

    if (openMorphsTracker[safeId]) {
        renderMorphContent(safeId, subData, openMorphsTracker[safeId]);
        const morph = document.getElementById(`morph-${safeId}`);
        const spacer = document.getElementById(`spacer-${safeId}`);
        const content = document.getElementById(`morph-content-${safeId}`);

        if (morph && morph.classList.contains('expanded') && !content.classList.contains('switching')) {
            const currentH = morph.style.height;
            morph.style.height = 'auto';
            let newH = morph.scrollHeight;
            if (newH < 80) newH = 80;
            if (newH > 400) newH = 400;

            morph.style.height = currentH;

            if (currentH !== `${newH}px`) {
                void morph.offsetWidth;
                morph.style.height = `${newH}px`;
                if (spacer) spacer.style.height = `${newH + 20}px`;
            }
        }
    }

    if (animatorEl) {
        if (expandedCards.has(subPath)) animatorEl.classList.add("open");
        else animatorEl.classList.remove("open");
    }

    if (expandedCards.has(subPath)) {
        renderFileBoxes(gridEl, subData.files);
    }
}

function renderFileBoxes(gridContainer, filesObj) {
    if (!gridContainer) return;
    const maxFiles = 1000;
    const entries = Object.entries(filesObj)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(0, maxFiles);

    while (gridContainer.children.length < entries.length) {
        const box = document.createElement("div");
        box.className = "file-box state-pending";
        box.onclick = function() {
            if (!this.classList.contains("state-processing")) {
                this.classList.toggle("force-expand");
            }
        };

        box.onmouseenter = function() {
            const nameEl = this.querySelector('.file-name-text');
            if (!nameEl) return;

            nameEl.isHovering = true;
            clearTimeout(nameEl.restoreTimer);
            clearTimeout(nameEl.scrollTimeout);
            clearTimeout(nameEl.pauseTimeout);

            if (nameEl.scrollWidth > nameEl.clientWidth) {
                const overflow = nameEl.scrollWidth - nameEl.clientWidth;
                nameEl.style.textOverflow = 'clip';
                nameEl.style.width = 'max-content';
                const duration = Math.max(overflow * 20, 1000);

                let isAtEnd = false;

                function animate() {
                    if (!nameEl.isHovering) return;
                    nameEl.style.transition = `transform ${duration}ms linear`;
                    nameEl.style.transform = `translateX(${isAtEnd ? 0 : -(overflow + 15)}px)`;

                    nameEl.scrollTimeout = setTimeout(() => {
                        isAtEnd = !isAtEnd;
                        if (nameEl.isHovering) {
                            nameEl.pauseTimeout = setTimeout(animate, 2000);
                        }
                    }, duration);
                }

                nameEl.pauseTimeout = setTimeout(animate, 1500);
            }
        };

        box.onmouseleave = function() {
            const nameEl = this.querySelector('.file-name-text');
            if (!nameEl) return;

            nameEl.isHovering = false;
            clearTimeout(nameEl.scrollTimeout);
            clearTimeout(nameEl.pauseTimeout);

            if (nameEl.style.width === 'max-content') {
                nameEl.style.transition = 'transform 0.4s ease';
                nameEl.style.transform = 'translateX(0)';
                nameEl.restoreTimer = setTimeout(() => {
                    nameEl.style.textOverflow = 'ellipsis';
                    nameEl.style.width = '100%';
                }, 400);
            }
        };

        box.innerHTML = `
            <div class="file-progress-wrapper">
                <div class="file-progress-bg"></div>
            </div>
            <div class="file-icon">⏳</div>
            <div class="file-details">
                <span class="file-op-text op-label">...</span>
                <div class="file-name-container">
                    <span class="file-name-text name-label">...</span>
                </div>
                <div class="file-stats-container">
                    <span class="eta-label">ETA: Calc...</span>
                    <span class="file-pct-text pct-label">0.0%</span>
                </div>
            </div>
            <div class="file-meta-row"></div>
        `;
        gridContainer.appendChild(box);
    }

    while (gridContainer.children.length > entries.length) {
        gridContainer.removeChild(gridContainer.lastChild);
    }

    entries.forEach(([fname, state], idx) => {
        const box = gridContainer.children[idx];
        box.dataset.filename = fname;

        const nameLabel = box.querySelector('.name-label');
        if(nameLabel && nameLabel.textContent !== fname) nameLabel.textContent = fname;

        let newClass = "file-box";
        let iconTxt = "⏳";
        let opStr = "⏳ IN ATTESA";
        let statusColor = "var(--text-muted)";
        let leftEtaStr = "Peso Orig.:";
        let rightPctStr = formatBytes(state.size);
        let isProcessing = false;

        if (state.status === "analyzing") {
            newClass = "file-box state-processing"; iconTxt = "🎵";
            opStr = "🎵 ANALISI AUDIO"; statusColor = "var(--purple)";
            leftEtaStr = "ETA: Calc..."; rightPctStr = "0.0%";
            isProcessing = true;
        } else if (state.status === "converting") {
            newClass = "file-box state-processing"; iconTxt = "🎬";
            opStr = "🎬 ELABORAZIONE"; statusColor = "var(--warning)";
            leftEtaStr = "ETA: Calc..."; rightPctStr = "0.0%";
            isProcessing = true;
        } else if (state.status === "normalizing") {
            newClass = "file-box state-processing"; iconTxt = "🔊";
            opStr = "🔊 NORMALIZZAZIONE"; statusColor = "var(--cyan)";
            leftEtaStr = "ETA: Calc..."; rightPctStr = "0.0%";
            isProcessing = true;
        } else if (state.status === "pending") {
            newClass = "file-box state-pending"; iconTxt = "⏳";
            opStr = "⏳ IN ATTESA"; statusColor = "var(--text-muted)";
        } else if (state.status === "analyzed_waiting") {
            newClass = "file-box state-analyzed_waiting"; iconTxt = "🎵";
            opStr = "🎵 AUDIO OK"; statusColor = "var(--purple)";
        } else if (state.status.startsWith("completed")) {
            newClass = "file-box state-completed_full"; iconTxt = "✔️";
            opStr = "✔️ COMPLETATO"; statusColor = "var(--success)"; delete fileEtaCache[fname];
        } else if (state.status === "skipped") {
            newClass = "file-box state-skipped"; iconTxt = "⏭️";
            opStr = "⏭️ SALTATO"; statusColor = "#059669"; delete fileEtaCache[fname];
        } else if (state.status === "error") {
            newClass = "file-box state-error"; iconTxt = "❌";
            opStr = "❌ ERRORE"; statusColor = "var(--danger)"; delete fileEtaCache[fname];
        }

        const hasForceExpand = box.classList.contains("force-expand");
        let finalClass = newClass;
        if (hasForceExpand && !isProcessing) finalClass += " force-expand";

        if (box.className !== finalClass) box.className = finalClass;

        const fileIcon = box.querySelector('.file-icon');
        if (fileIcon && fileIcon.textContent !== iconTxt) fileIcon.textContent = iconTxt;

        const opLabel = box.querySelector('.op-label');
        if (opLabel && opLabel.textContent !== opStr) {
            opLabel.textContent = opStr;
            opLabel.style.color = statusColor;
        }

        if (isProcessing) {
            box.style.borderColor = statusColor;
        } else {
            box.style.borderColor = "";
        }

        const bg = box.querySelector('.file-progress-bg');
        if(bg && !isProcessing) {
            bg.style.transform = 'scaleX(0)';
            bg.style.backgroundColor = 'transparent';
        }

        const etaLabel = box.querySelector('.eta-label');
        if (etaLabel && etaLabel.textContent !== leftEtaStr && !isProcessing) {
            etaLabel.textContent = leftEtaStr;
        }

        const pctLabel = box.querySelector('.pct-label');
        if (pctLabel && pctLabel.textContent !== rightPctStr && !isProcessing) {
            pctLabel.textContent = rightPctStr;
            pctLabel.style.color = statusColor;
        }

        const metaRow = box.querySelector('.file-meta-row');
        if (metaRow) {
            if (state.meta) {
                const v_col = state.meta.v_opt ? "var(--success)" : "var(--text-muted)";
                const a_col = state.meta.a_opt ? "var(--success)" : "var(--text-muted)";
                const lufs_col = state.meta.lufs_opt ? "var(--success)" : "var(--text-muted)";
                const lufs_val = state.meta.lufs !== null ? state.meta.lufs.toFixed(1) + " LUFS" : "N/A";

                metaRow.innerHTML = `
                    <span style="color: ${v_col}">🎬 ${state.meta.v_codec.toUpperCase()}</span>
                    <span style="color: ${a_col}">🎵 ${state.meta.a_codec.toUpperCase()}</span>
                    <span style="color: ${lufs_col}">🔊 ${lufs_val}</span>
                    <span style="color: var(--text-muted)">⏱️ ${formatTime(state.meta.dur)}</span>
                `;
            } else {
                metaRow.innerHTML = "";
            }
        }

        if (!box.style.animationDelay) box.style.animationDelay = `${(idx % 20) * 15}ms`;
    });
}

window.toggleCard = function(subPath, safeId) {
    if (expandedCards.has(subPath)) {
        expandedCards.delete(subPath);
        userOpenedCards.delete(subPath);
    } else {
        expandedCards.add(subPath);
        userOpenedCards.add(subPath);
    }
    if (lastMetrics) renderCanvas(lastMetrics);
};

window.openModal = function(type) {
    const modal = document.getElementById("data-modal");
    if (!modal) return;

    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");

    if (type === 'errors') {
        modalTitle.innerHTML = "❌ Gestione Errori Globali Attuali";
        let html = `<p style="margin-bottom: 15px;">File andati in errore in tutte le cartelle:</p>`;
        let hasErrors = false;
        let errorListHtml = `<ul class="error-list">`;

        if (lastMetrics && lastMetrics.cores) {
            for (const [core, subs] of Object.entries(lastMetrics.cores)) {
                for (const [sub, data] of Object.entries(subs)) {
                    for (const [fname, state] of Object.entries(data.files)) {
                        if (state.status === 'error') {
                            hasErrors = true;
                            errorListHtml += `
                                <li class="error-item">
                                    <div>
                                        <div class="error-item-name">${fname}</div>
                                        <div class="error-item-path">${sub.split(/[\\/]/).pop()}</div>
                                    </div>
                                    <span class="badge badge-danger">ERRORE</span>
                                </li>
                            `;
                        }
                    }
                }
            }
        }
        errorListHtml += `</ul>`;

        if (hasErrors) {
            html += errorListHtml;
            html += `<div style="margin-top:25px; text-align:right;">
                        <button class="btn btn-warning pulse-warning" onclick="retryErrors()">🔄 Riprova Tutti gli Errori Globali</button>
                     </div>`;
        } else {
            html = `<div style="text-align:center; padding: 30px;"><span style="font-size:40px">🎉</span><p style="color:var(--success); font-size: 16px; margin-top: 15px;">Nessun errore rilevato in questa sessione!</p></div>`;
        }
        modalBody.innerHTML = html;
    } else {
        modalTitle.innerText = "Dettagli";
        modalBody.innerHTML = "<p>Nessun dettaglio disponibile.</p>";
    }

    modal.classList.remove("hidden");
};

window.openFolderErrors = function(coreName, subName) {
    const modal = document.getElementById("data-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalBody = document.getElementById("modal-body");

    modalTitle.innerHTML = `<span style="color:var(--danger)">❌ Errori in:</span> <span style="font-size:12px; color:var(--text-muted)">${subName.split(/[\\/]/).pop()}</span>`;

    let html = ``;
    let hasErrors = false;
    let errorListHtml = `<ul class="error-list">`;

    if (lastMetrics && lastMetrics.cores && lastMetrics.cores[coreName] && lastMetrics.cores[coreName][subName]) {
        const subData = lastMetrics.cores[coreName][subName];
        for (const [fname, state] of Object.entries(subData.files)) {
            if (state.status === 'error') {
                hasErrors = true;
                errorListHtml += `
                    <li class="error-item">
                        <span class="error-item-name">${fname}</span>
                        <span class="badge badge-danger">ERRORE</span>
                    </li>
                `;
            }
        }
    }
    errorListHtml += `</ul>`;

    if (hasErrors) {
        html += errorListHtml;
        html += `<div style="margin-top:25px; text-align:right;">
                    <button class="btn btn-warning pulse-warning" onclick="retryErrors()">🔄 Riprova Tutti gli Errori Globali</button>
                 </div>`;
    } else {
        html = `<div style="text-align:center; padding: 30px;"><span style="font-size:40px">🎉</span><p style="color:var(--success); font-size: 16px; margin-top: 15px;">Nessun errore in questa cartella!</p></div>`;
    }

    modalBody.innerHTML = html;
    modal.classList.remove("hidden");
};

window.closeModal = function() {
    const modal = document.getElementById("data-modal");
    if (modal) modal.classList.add("hidden");
};