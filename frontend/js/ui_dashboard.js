function updateTutorialUI() {
    if (coreList.length === 0) {
        if(btnAddFolder) btnAddFolder.classList.add("pulse-primary");
        if(btnTogglePlay) {
            btnTogglePlay.disabled = true;
            btnTogglePlay.className = "btn btn-secondary";
            btnTogglePlay.innerHTML = '<i class="fa-solid fa-play"></i> Avvia';
        }
    } else {
        if(btnAddFolder) btnAddFolder.classList.remove("pulse-primary");
        if(btnTogglePlay) {
            btnTogglePlay.disabled = false;
            if (isPaused) {
                btnTogglePlay.className = "btn btn-success pulse-success";
                btnTogglePlay.innerHTML = '<i class="fa-solid fa-play"></i> Avvia';
            } else {
                btnTogglePlay.className = "btn btn-warning pulse-warning";
                btnTogglePlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pausa';
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
        if (g.scan_step === 1) { stepName = "Mappatura disco..."; progress = 5; }
        else if (g.scan_step === 2) { stepName = "Interrogazione Database RAM..."; progress = 10; }
        else if (g.scan_step === 3) { stepName = "Lettura Cache DB Metadati"; progress = g.scan_progress || 0; fileStr = g.scan_file || "Controllo file in cache..."; }
        else if (g.scan_step === 4) {
            stepName = "Estrazione Metadati (ffprobe)";
            progress = g.scan_progress || 0;
            if (g.scan_file && g.scan_file.includes('|')) {
                const parts = g.scan_file.split('|');
                fileStr = parts.slice(1).join('|').trim() + ` (${parts[0].trim()})`;
            } else { fileStr = g.scan_file || ""; }
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