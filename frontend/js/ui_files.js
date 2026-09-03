window.singleFileOpenMode = true; // True = chiude gli altri file aperti; False = lascia aperti multipli file

function updateProgress(data) {
    if(globalProgress) globalProgress.style.width = `${data.global_prog}%`;

    const cleanFilename = data.filename.replace("Check: ", "").trim();

    let opName = "ELABORAZIONE"; let borderColor = "var(--p-conv-video)"; let bgStyle = "var(--p-conv-video)";
    let isCombo = false;

    if (data.op_type === "audio") { opName = "ANALISI AUDIO"; borderColor = "var(--p-analisi)"; bgStyle = "var(--p-analisi)"; }
    else if (data.op_type === "video") { opName = "CONVERSIONE VIDEO"; borderColor = "var(--p-conv-video)"; bgStyle = "var(--p-conv-video)"; }
    else if (data.op_type === "audio_only") { opName = "CONVERSIONE AUDIO"; borderColor = "var(--p-conv-audio)"; bgStyle = "var(--p-conv-audio)"; }
    else if (data.op_type === "audio_norm") { opName = "NORMALIZZAZIONE"; borderColor = "var(--p-norm)"; bgStyle = "var(--p-norm)"; }
    else if (data.op_type === "audio_check") { opName = "VERIFICA LUFS"; borderColor = "var(--p-norm)"; bgStyle = "var(--p-norm)"; }
    else if (data.op_type === "video_audio") {
        opName = "CONV. AUDIO E VIDEO";
        isCombo = true;
        borderColor = "transparent";
        bgStyle = "linear-gradient(90deg, #8B5CF6, #3B82F6)";
    }

    let etaString = "Calc..."; const now = Date.now();
    if (!fileEtaCache[cleanFilename]) { fileEtaCache[cleanFilename] = { lastTime: now, lastProg: data.file_prog, speed: 0 }; }
    else {
        const cache = fileEtaCache[cleanFilename]; const timeDiff = (now - cache.lastTime) / 1000; const progDiff = data.file_prog - cache.lastProg;
        if (progDiff > 0 && timeDiff > 0.1) { cache.speed = cache.speed === 0 ? (progDiff/timeDiff) : (cache.speed * 0.8 + (progDiff/timeDiff) * 0.2); cache.lastTime = now; cache.lastProg = data.file_prog; }
        if (cache.speed > 0) { const remainingSecs = (100 - data.file_prog) / cache.speed; if (remainingSecs < 60) etaString = `${Math.round(remainingSecs)}s`; else etaString = `${Math.floor(remainingSecs/60)}m ${Math.round(remainingSecs%60)}s`; }
    }

    try {
        const escapedName = CSS.escape(cleanFilename);
        const fileBoxes = document.querySelectorAll(`.file-box[data-filename="${escapedName}"]`);

        fileBoxes.forEach(box => {
            const hasSE = box.classList.contains('has-se-badge') ? 'has-se-badge' : '';
            const hasForceExpand = box.classList.contains('force-expand') ? 'force-expand' : '';
            const comboClass = isCombo ? 'av-combo-gradient' : '';
            box.className = `file-box state-processing ${hasSE} ${hasForceExpand} ${comboClass}`.trim();

            box.style.borderColor = borderColor;
            box.style.setProperty('--op-color', borderColor);

            const opLabel = box.querySelector('.op-label');
            if (opLabel) { opLabel.textContent = opName; opLabel.style.color = isCombo ? '' : borderColor; }

            const pctLabel = box.querySelector('.pct-label');
            if (pctLabel) {
                pctLabel.style.color = isCombo ? '' : borderColor;
                pctLabel.textContent = `${data.file_prog.toFixed(1)}%`;

                const minFontSize = 13;
                const maxFontSize = 24;
                const newSize = minFontSize + (data.file_prog / 100) * (maxFontSize - minFontSize);
                pctLabel.style.fontSize = `${newSize}px`;
            }

            const bg = box.querySelector('.file-progress-bg');
            if (bg) { bg.style.background = bgStyle; bg.style.transform = `scaleX(${data.file_prog / 100})`; }

            // Fix visibilità Icona I e Spinner in runtime
            const loadingBox = box.querySelector('.loading-box-el');
            const infoBox = box.querySelector('.info-box-el');
            if(loadingBox) loadingBox.style.display = 'flex';
            if(infoBox) infoBox.style.display = 'none';

            if (now - (box.dataset.lastTextUpdate || 0) > 200) {
                const ETA = box.querySelector('.eta-label'); if (ETA) ETA.textContent = `ETA: ${etaString}`;
                box.dataset.lastTextUpdate = now;
            }
        });
    } catch(e) {}
}

function renderFileBoxes(gridContainer, filesObj) {
    if (!gridContainer) return;
    const maxFiles = 1000;
    const entries = Object.entries(filesObj).sort((a, b) => a[0].localeCompare(b[0])).slice(0, maxFiles);

    while (gridContainer.children.length < entries.length) {
        const box = document.createElement("div"); box.className = "file-box state-pending";

        box.onclick = function() {
            if (this.classList.contains("state-processing")) return;
            const grid = this.parentElement;
            if (window.singleFileOpenMode) {
                const boxes = Array.from(grid.querySelectorAll('.file-box'));
                boxes.forEach(b => {
                    if (b !== this && b.classList.contains('force-expand')) {
                        b.classList.remove('force-expand');
                    }
                });
            }
            this.classList.toggle("force-expand");
        };

        box.onmouseenter = function() {
            const nameEl = this.querySelector('.file-name-text');
            const wrapperEl = this.querySelector('.name-scroll-wrapper');
            if (!nameEl || !wrapperEl) return;
            nameEl.isHovering = true; clearTimeout(nameEl.restoreTimer); clearTimeout(nameEl.scrollTimeout); clearTimeout(nameEl.pauseTimeout);
            if (nameEl.scrollWidth > wrapperEl.clientWidth) {
                const overflow = nameEl.scrollWidth - wrapperEl.clientWidth;
                nameEl.style.textOverflow = 'clip'; nameEl.style.width = 'max-content';
                const duration = Math.max(overflow * 20, 1000); let isAtEnd = false;
                function animate() {
                    if (!nameEl.isHovering) return;
                    nameEl.style.transition = `transform ${duration}ms linear`; nameEl.style.transform = `translateX(${isAtEnd ? 0 : -(overflow + 10)}px)`;
                    nameEl.scrollTimeout = setTimeout(() => { isAtEnd = !isAtEnd; if (nameEl.isHovering) { nameEl.pauseTimeout = setTimeout(animate, 2000); } }, duration);
                }
                nameEl.pauseTimeout = setTimeout(animate, 1500);
            }
        };

        box.onmouseleave = function() {
            const nameEl = this.querySelector('.file-name-text'); if (!nameEl) return;
            nameEl.isHovering = false; clearTimeout(nameEl.scrollTimeout); clearTimeout(nameEl.pauseTimeout);
            if (nameEl.style.width === 'max-content') {
                nameEl.style.transition = 'transform 0.4s ease'; nameEl.style.transform = 'translateX(0)';
                nameEl.restoreTimer = setTimeout(() => { nameEl.style.textOverflow = 'ellipsis'; nameEl.style.width = '100%'; }, 400);
            }
        };

        box.innerHTML = `
            <div class="file-progress-wrapper"><div class="file-progress-bg"></div></div>
            
            <!-- GRUPPO VISIBILE SOLO DA CHIUSO -->
            <div class="file-closed-group">
                <div class="file-icon-box"><i class="icon-inline"></i></div>
            </div>
            
            <!-- GRUPPO VISIBILE SOLO DA APERTO -->
            <div class="file-open-group">
                <div class="open-icon-box"><i class="icon-inline"></i></div>
                
                <div class="file-loading-box loading-box-el" style="display: none;">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                </div>
                
                <div class="file-info-box info-box-el">
                    <i class="fa-solid fa-info"></i>
                </div>
                
                <div class="file-box-inner">
                    <div class="file-left-panel">
                        <div class="file-header-row">
                            <div class="f-box file-status-box"><span class="op-label">...</span></div>
                        </div>
                        <div class="file-name-box">
                            <div class="name-scroll-wrapper">
                                <span class="file-name-text name-label">...</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="file-right-wrapper">
                        <div class="pct-eta-box eta-box-el" style="display: none;">
                            <span class="pct-label" style="font-size: 13px;">0.0%</span>
                            <span class="eta-label">ETA: Calc...</span>
                        </div>
                        <div class="file-right-panel meta-flex"></div>
                    </div>
                </div>
            </div>
        `;
        gridContainer.appendChild(box);
    }

    while (gridContainer.children.length > entries.length) { gridContainer.removeChild(gridContainer.lastChild); }

    entries.forEach(([fname, state], idx) => {
        const box = gridContainer.children[idx]; box.dataset.filename = fname;
        if (!box.style.animationDelay) box.style.animationDelay = `${idx * 20}ms`;
        const nameLabel = box.querySelector('.name-label'); if(nameLabel && nameLabel.textContent !== fname) nameLabel.textContent = fname;

        let newClass = "file-box"; let iconTxt = 'fa-solid fa-hourglass-half'; let opStr = "IN ATTESA"; let statusColor = "var(--f-attesa)"; let isProcessing = false;
        let bgStyle = "transparent"; let isCombo = false;

        if (state.status === "analyzing") { newClass = "file-box state-processing"; iconTxt = 'fa-solid fa-chart-simple'; opStr = "ANALISI AUDIO"; statusColor = "var(--p-analisi)"; bgStyle = statusColor; isProcessing = true; }
        else if (state.status === "converting") {
            newClass = "file-box state-processing"; iconTxt = 'fa-solid fa-microchip';
            if (state.meta && !state.meta.v_opt && !state.meta.a_opt) {
                opStr = "CONV. AUDIO E VIDEO";
                isCombo = true;
                statusColor = "transparent";
                bgStyle = "linear-gradient(90deg, #8B5CF6, #3B82F6)";
            } else {
                opStr = "ELABORAZIONE";
                statusColor = "var(--p-conv-video)";
                bgStyle = statusColor;
            }
            isProcessing = true;
        }
        else if (state.status === "normalizing") { newClass = "file-box state-processing"; iconTxt = 'fa-solid fa-wave-square'; opStr = "NORMALIZZAZIONE"; statusColor = "var(--p-norm)"; bgStyle = statusColor; isProcessing = true; }
        else if (state.status === "pending") { newClass = "file-box state-pending"; iconTxt = 'fa-solid fa-hourglass-half'; opStr = "IN ATTESA"; statusColor = "var(--f-attesa)"; }
        else if (state.status === "analyzed_waiting") { newClass = "file-box state-analyzed_waiting"; iconTxt = 'fa-solid fa-music'; opStr = "AUDIO OK"; statusColor = "var(--p-norm)"; }
        else if (state.status.startsWith("completed")) { newClass = "file-box state-completed_full"; iconTxt = 'fa-solid fa-check'; opStr = "COMPLETATO"; statusColor = "var(--f-completato)"; delete fileEtaCache[fname]; }
        else if (state.status === "skipped") { newClass = "file-box state-skipped"; iconTxt = 'fa-solid fa-forward-step'; opStr = "SALTATO"; statusColor = "var(--cyan)"; delete fileEtaCache[fname]; }
        else if (state.status === "error") { newClass = "file-box state-error"; iconTxt = 'fa-solid fa-xmark'; opStr = "ERRORE"; statusColor = "var(--f-errore)"; delete fileEtaCache[fname]; }

        const hasForceExpand = box.classList.contains("force-expand"); let finalClass = newClass;
        if (hasForceExpand && !isProcessing) finalClass += " force-expand";
        if (isCombo) finalClass += " av-combo-gradient";

        box.style.setProperty('--op-color', statusColor);

        box.querySelectorAll('.icon-inline').forEach(ic => { if (ic.className !== `icon-inline ${iconTxt}`) ic.className = `icon-inline ${iconTxt}`; });

        const opLabel = box.querySelector('.op-label'); if (opLabel && opLabel.textContent !== opStr) { opLabel.textContent = opStr; opLabel.style.color = isCombo ? '' : statusColor; }

        if (isProcessing && !isCombo) { box.style.borderColor = statusColor; } else { box.style.borderColor = ""; }
        const bg = box.querySelector('.file-progress-bg'); if(bg && !isProcessing) { bg.style.transform = 'scaleX(0)'; bg.style.background = 'transparent'; } else if (bg) { bg.style.background = bgStyle; }

        // FIX JS: Commutazione assoluta senza conflitti visivi tra I e Rotellina
        const loadingBox = box.querySelector('.loading-box-el');
        const infoBox = box.querySelector('.info-box-el');
        const etaBoxEl = box.querySelector('.eta-box-el');

        if (isProcessing) {
            if(loadingBox) loadingBox.style.display = 'flex';
            if(infoBox) infoBox.style.display = 'none'; // Nasconde la I in modo forzato
            if(etaBoxEl) etaBoxEl.style.display = 'flex';
        } else {
            if(loadingBox) loadingBox.style.display = 'none'; // Nasconde rotellina
            if(infoBox) infoBox.style.display = 'flex';
            if(etaBoxEl) etaBoxEl.style.display = 'none';
        }

        const closedGroup = box.querySelector('.file-closed-group');
        const openGroup = box.querySelector('.file-open-group');
        let closedBadge = closedGroup.querySelector('.closed-badge');
        let openBadge = openGroup.querySelector('.open-badge');

        if (state.meta && state.meta.se_string) {
            finalClass += ' has-se-badge';
            if (!closedBadge) closedGroup.insertAdjacentHTML('beforeend', `<div class="file-se-badge closed-badge">${state.meta.se_string}</div>`);
            else closedBadge.textContent = state.meta.se_string;

            if (!openBadge) openGroup.insertAdjacentHTML('beforeend', `<div class="file-se-badge open-badge">${state.meta.se_string}</div>`);
            else openBadge.textContent = state.meta.se_string;
        } else {
            if (closedBadge) closedBadge.remove();
            if (openBadge) openBadge.remove();
        }

        if (box.className !== finalClass) box.className = finalClass;

        const metaBox = box.querySelector('.meta-flex');
        let metaHtml = "";
        if (state.meta) {
            const v_col = state.meta.v_opt ? "var(--f-completato)" : "var(--text-muted)";
            const a_col = state.meta.a_opt ? "var(--f-completato)" : "var(--text-muted)";
            const lufs_col = state.meta.lufs_opt ? "var(--f-completato)" : "var(--text-muted)";
            const lufs_val = state.meta.lufs !== null ? state.meta.lufs.toFixed(1) + " LUFS" : "N/A";

            metaHtml = `
                <div class="info-block"><i class="fa-solid fa-film" style="color: ${v_col}"></i> <span class="val" style="color: ${v_col}">${state.meta.v_codec.toUpperCase()}</span></div>
                <div class="info-block"><i class="fa-solid fa-headphones" style="color: ${a_col}"></i> <span class="val" style="color: ${a_col}">${state.meta.a_codec.toUpperCase()}</span></div>
                <div class="info-block"><i class="fa-solid fa-volume-high" style="color: ${lufs_col}"></i> <span class="val" style="color: ${lufs_col}">${lufs_val}</span></div>
                <div class="info-block"><i class="fa-regular fa-clock"></i> <span class="val">${formatTime(state.meta.dur)}</span></div>
            `;
        }
        if (metaBox && metaBox.innerHTML !== metaHtml) metaBox.innerHTML = metaHtml;
    });
}