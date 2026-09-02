function updateProgress(data) {
    if(globalProgress) globalProgress.style.width = `${data.global_prog}%`;
    const cleanFilename = data.filename.replace("Check: ", "").trim();

    let opName = "ELABORAZIONE"; let borderColor = "var(--p-conv-video)"; let bgStyle = "var(--p-conv-video)";

    if (data.op_type === "audio") { opName = "ANALISI AUDIO"; borderColor = "var(--p-analisi)"; bgStyle = "var(--p-analisi)"; }
    else if (data.op_type === "video") { opName = "CONVERSIONE VIDEO"; borderColor = "var(--p-conv-video)"; bgStyle = "var(--p-conv-video)"; }
    else if (data.op_type === "audio_only") { opName = "CONVERSIONE AUDIO"; borderColor = "var(--p-conv-audio)"; bgStyle = "var(--p-conv-audio)"; }
    else if (data.op_type === "video_audio") { opName = "CONV. AUDIO E VIDEO"; borderColor = "var(--p-conv-video)"; bgStyle = "var(--p-conv-av)"; }
    else if (data.op_type === "audio_norm") { opName = "NORMALIZZAZIONE"; borderColor = "var(--p-norm)"; bgStyle = "var(--p-norm)"; }
    else if (data.op_type === "audio_check") { opName = "VERIFICA LUFS"; borderColor = "var(--p-norm)"; bgStyle = "var(--p-norm)"; }

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
            box.className = "file-box state-processing"; box.style.borderColor = borderColor; box.style.setProperty('--op-color', borderColor);
            const opLabel = box.querySelector('.op-label'); if (opLabel) { opLabel.textContent = opName; opLabel.style.color = borderColor; }
            const pctLabel = box.querySelector('.pct-label'); if (pctLabel) pctLabel.style.color = borderColor;
            const bg = box.querySelector('.file-progress-bg'); if (bg) { bg.style.background = bgStyle; bg.style.transform = `scaleX(${data.file_prog / 100})`; }
            if (now - (box.dataset.lastTextUpdate || 0) > 200) {
                if (pctLabel) pctLabel.textContent = `${data.file_prog.toFixed(1)}%`;
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
        box.onclick = function() { if (!this.classList.contains("state-processing")) { this.classList.toggle("force-expand"); } };
        box.onmouseenter = function() {
            const nameEl = this.querySelector('.file-name-text'); if (!nameEl) return;
            nameEl.isHovering = true; clearTimeout(nameEl.restoreTimer); clearTimeout(nameEl.scrollTimeout); clearTimeout(nameEl.pauseTimeout);
            if (nameEl.scrollWidth > nameEl.clientWidth) {
                const overflow = nameEl.scrollWidth - nameEl.clientWidth; nameEl.style.textOverflow = 'clip'; nameEl.style.width = 'max-content';
                const duration = Math.max(overflow * 20, 1000); let isAtEnd = false;
                function animate() {
                    if (!nameEl.isHovering) return;
                    nameEl.style.transition = `transform ${duration}ms linear`; nameEl.style.transform = `translateX(${isAtEnd ? 0 : -(overflow + 15)}px)`;
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
            <i class="file-icon-centered"></i>
            <div class="file-box-inner">
                <div class="file-top-row">
                    <div class="file-info-col">
                        <div class="file-title-row"><div class="file-icon-inline"><i class="icon-inline"></i></div><span class="file-op-text op-label">...</span></div>
                        <div class="file-name-text name-label">...</div>
                    </div>
                    <div class="file-meta-box meta-static"></div>
                    <div class="file-stats-box loading-border"><span class="eta-label">ETA: Calc...</span><span class="file-pct-text pct-label">0.0%</span></div>
                </div>
                <div class="file-meta-box meta-processing"></div>
            </div>
        `;
        gridContainer.appendChild(box);
    }

    while (gridContainer.children.length > entries.length) { gridContainer.removeChild(gridContainer.lastChild); }

    entries.forEach(([fname, state], idx) => {
        const box = gridContainer.children[idx]; box.dataset.filename = fname;
        const nameLabel = box.querySelector('.name-label'); if(nameLabel && nameLabel.textContent !== fname) nameLabel.textContent = fname;

        let newClass = "file-box"; let iconTxt = 'fa-solid fa-hourglass-half'; let opStr = "IN ATTESA"; let statusColor = "var(--f-attesa)"; let leftEtaStr = "Peso Orig.:"; let rightPctStr = formatBytes(state.size); let isProcessing = false;

        if (state.status === "analyzing") { newClass = "file-box state-processing"; iconTxt = 'fa-solid fa-chart-simple fa-fade'; opStr = "ANALISI AUDIO"; statusColor = "var(--p-analisi)"; leftEtaStr = "ETA: Calc..."; rightPctStr = "0.0%"; isProcessing = true; }
        else if (state.status === "converting") { newClass = "file-box state-processing"; iconTxt = 'fa-solid fa-microchip fa-fade'; opStr = "ELABORAZIONE"; statusColor = "var(--p-conv-video)"; leftEtaStr = "ETA: Calc..."; rightPctStr = "0.0%"; isProcessing = true; }
        else if (state.status === "normalizing") { newClass = "file-box state-processing"; iconTxt = 'fa-solid fa-wave-square fa-fade'; opStr = "NORMALIZZAZIONE"; statusColor = "var(--p-norm)"; leftEtaStr = "ETA: Calc..."; rightPctStr = "0.0%"; isProcessing = true; }
        else if (state.status === "pending") { newClass = "file-box state-pending"; iconTxt = 'fa-solid fa-hourglass-half'; opStr = "IN ATTESA"; statusColor = "var(--f-attesa)"; }
        else if (state.status === "analyzed_waiting") { newClass = "file-box state-analyzed_waiting"; iconTxt = 'fa-solid fa-music'; opStr = "AUDIO OK"; statusColor = "var(--p-norm)"; }
        else if (state.status.startsWith("completed")) { newClass = "file-box state-completed_full"; iconTxt = 'fa-solid fa-check'; opStr = "COMPLETATO"; statusColor = "var(--f-completato)"; delete fileEtaCache[fname]; }
        else if (state.status === "skipped") { newClass = "file-box state-skipped"; iconTxt = 'fa-solid fa-forward-step'; opStr = "SALTATO"; statusColor = "var(--f-saltato)"; delete fileEtaCache[fname]; }
        else if (state.status === "error") { newClass = "file-box state-error"; iconTxt = 'fa-solid fa-xmark'; opStr = "ERRORE"; statusColor = "var(--f-errore)"; delete fileEtaCache[fname]; }

        const hasForceExpand = box.classList.contains("force-expand"); let finalClass = newClass;
        if (hasForceExpand && !isProcessing) finalClass += " force-expand";
        if (box.className !== finalClass) box.className = finalClass;

        const fileIconCenter = box.querySelector('.file-icon-centered'); if (fileIconCenter && fileIconCenter.className !== `file-icon-centered ${iconTxt}`) fileIconCenter.className = `file-icon-centered ${iconTxt}`;
        const fileIconInline = box.querySelector('.file-icon-inline i'); if (fileIconInline && fileIconInline.className !== iconTxt) fileIconInline.className = iconTxt;
        const opLabel = box.querySelector('.op-label'); if (opLabel && opLabel.textContent !== opStr) { opLabel.textContent = opStr; opLabel.style.color = statusColor; }
        if (isProcessing) { box.style.borderColor = statusColor; box.style.setProperty('--op-color', statusColor); } else { box.style.borderColor = ""; }
        const bg = box.querySelector('.file-progress-bg'); if(bg && !isProcessing) { bg.style.transform = 'scaleX(0)'; bg.style.background = 'transparent'; }
        const etaLabel = box.querySelector('.eta-label'); if (etaLabel && etaLabel.textContent !== leftEtaStr && !isProcessing) { etaLabel.textContent = leftEtaStr; }
        const pctLabel = box.querySelector('.pct-label'); if (pctLabel && pctLabel.textContent !== rightPctStr && !isProcessing) { pctLabel.textContent = rightPctStr; pctLabel.style.color = statusColor; }

        const metaStatic = box.querySelector('.meta-static'); const metaProcessing = box.querySelector('.meta-processing'); let metaHtml = "";
        if (state.meta) {
            const v_col = state.meta.v_opt ? "var(--f-completato)" : "var(--text-muted)"; const a_col = state.meta.a_opt ? "var(--f-completato)" : "var(--text-muted)"; const lufs_col = state.meta.lufs_opt ? "var(--f-completato)" : "var(--text-muted)"; const lufs_val = state.meta.lufs !== null ? state.meta.lufs.toFixed(1) + " LUFS" : "N/A";

            // Rimosso esplicitamente il sizeStr dai meta del file espanso (richiesta utente)
            metaHtml = `<span><i class="fa-solid fa-film" style="color: ${v_col}"></i> <span class="val" style="color: ${v_col}">${state.meta.v_codec.toUpperCase()}</span></span><span><i class="fa-solid fa-headphones" style="color: ${a_col}"></i> <span class="val" style="color: ${a_col}">${state.meta.a_codec.toUpperCase()}</span></span><span><i class="fa-solid fa-volume-high" style="color: ${lufs_col}"></i> <span class="val" style="color: ${lufs_col}">${lufs_val}</span></span><span><i class="fa-regular fa-clock"></i> ${formatTime(state.meta.dur)}</span>`;
        }
        if (metaStatic && metaStatic.innerHTML !== metaHtml) metaStatic.innerHTML = metaHtml; if (metaProcessing && metaProcessing.innerHTML !== metaHtml) metaProcessing.innerHTML = metaHtml;
        if (!box.style.animationDelay) box.style.animationDelay = `${(idx % 20) * 15}ms`;
    });
}