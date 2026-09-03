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

function updateDashboard(metrics) {
    const g = metrics.global;
    if (g.is_paused !== undefined && isPaused !== g.is_paused) {
        isPaused = g.is_paused;
        updateTutorialUI();
    }
    const blocker = document.getElementById("canvas-blocker");
    if (g.is_scanning) {
        if (scannerWidget) scannerWidget.classList.remove("hidden");
        if (blocker) blocker.classList.remove("hidden");
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
        if (blocker) blocker.classList.add("hidden");
    }

    if(lblFiles) lblFiles.textContent = `${g.completed} / ${g.total_files}`;
    if(lblSkipped) lblSkipped.textContent = `${g.skipped}`;
    if(lblErrors) lblErrors.textContent = `${g.errors}`;
    if(lblSavedSpace) lblSavedSpace.textContent = formatBytes(g.saved_space || 0);

    updateAllCoreStates();
}

function getCoreAggregatedState(corePath) {
    let isProcessing = false;
    let isCompleted = true;
    let hasFiles = false;

    if (lastMetrics && lastMetrics.cores[corePath]) {
        const subs = lastMetrics.cores[corePath];
        let totFiles = 0;
        let totDone = 0;
        for (const sub in subs) {
            const data = subs[sub];
            if (data.is_processing) isProcessing = true;
            totFiles += data.total_files || 0;
            totDone += (data.completed || 0) + (data.errors || 0) + (data.skipped || 0);
        }
        if (totFiles > 0) {
            hasFiles = true;
            if (totDone < totFiles) isCompleted = false;
        } else {
            isCompleted = false;
        }
    }

    if (isProcessing) return "processing";
    if (hasFiles && isCompleted) return "completed";
    return "pending";
}

function updateAllCoreStates() {
    const selector = document.getElementById("core-selector");
    if(!selector) return;

    // Ignoriamo le pillole che stanno già affrontando l'animazione di uscita
    const existingPills = Array.from(selector.querySelectorAll('.core-pill:not(.animate-leave)'));
    if (existingPills.length !== coreList.length) return; // Attende che renderCoreDots abbia sincronizzato il DOM

    existingPills.forEach((pill, index) => {
        const corePath = coreList[index];
        if (pill.dataset.corePath !== corePath) return; // Sicurezza aggiuntiva

        const state = getCoreAggregatedState(corePath);

        let stateClass = ""; let iconClass = "";
        if (state === "processing") { stateClass = "state-processing"; iconClass = "fa-solid fa-circle-notch fa-spin core-status-icon"; }
        else if (state === "completed") { stateClass = "state-completed"; iconClass = "fa-solid fa-check core-status-icon"; }
        else { stateClass = "state-pending"; iconClass = "fa-solid fa-hourglass-half core-status-icon"; }

        const isActive = index === currentCoreIndex ? " active" : "";
        const currentClasses = pill.className;
        const newClassName = `core-pill ${stateClass}${isActive}`;

        if (!currentClasses.includes(stateClass)) {
            pill.className = newClassName;
            pill.classList.remove('status-changed');
            void pill.offsetWidth;
            pill.classList.add('status-changed');
        } else if (currentClasses !== newClassName) {
            pill.className = newClassName;
        }

        const iconEl = pill.querySelector('.core-status-icon');
        if (iconEl && iconEl.className !== iconClass) {
            iconEl.className = iconClass;
        }
    });
}

function renderCoreDots() {
    const selector = document.getElementById("core-selector");
    if(!selector) return;

    if (coreList.length === 0) {
        // Animazione di chiusura se svuotiamo del tutto
        const existing = Array.from(selector.querySelectorAll('.core-pill'));
        if (existing.length > 0) {
            existing.forEach(pill => pill.classList.add('animate-leave'));
            setTimeout(() => { selector.innerHTML = ""; updateCoreScrollButtons(); }, 450);
        } else {
            selector.innerHTML = "";
            updateCoreScrollButtons();
        }
        return;
    }

    let spacerL = selector.querySelector('.core-spacer.left-spacer');
    let spacerR = selector.querySelector('.core-spacer.right-spacer');

    if (!spacerL || !spacerR) {
        selector.innerHTML = "";
        spacerL = document.createElement("div");
        spacerL.className = "core-spacer left-spacer";
        selector.appendChild(spacerL);

        spacerR = document.createElement("div");
        spacerR.className = "core-spacer right-spacer";
        selector.appendChild(spacerR);
    }

    const existingPills = Array.from(selector.querySelectorAll('.core-pill:not(.animate-leave)'));

    // 1. GESTIONE RIMOZIONE (Uscita Animata)
    existingPills.forEach(pill => {
        if (!coreList.includes(pill.dataset.corePath)) {
            pill.classList.add('animate-leave');
            setTimeout(() => { if (pill.parentNode) pill.remove(); }, 450);
        }
    });

    let activeElement = null;

    // 2. GESTIONE AGGIUNTA E AGGIORNAMENTO
    coreList.forEach((corePath, index) => {
        let pill = existingPills.find(p => p.dataset.corePath === corePath);

        const state = getCoreAggregatedState(corePath);
        let stateClass = ""; let iconClass = "";
        if (state === "processing") { stateClass = "state-processing"; iconClass = "fa-solid fa-circle-notch fa-spin core-status-icon"; }
        else if (state === "completed") { stateClass = "state-completed"; iconClass = "fa-solid fa-check core-status-icon"; }
        else { stateClass = "state-pending"; iconClass = "fa-solid fa-hourglass-half core-status-icon"; }

        const isActive = index === currentCoreIndex ? " active" : "";
        const newClassName = `core-pill ${stateClass}${isActive}`;

        if (!pill) {
            // Nuova Pillola: Entra con Animazione
            pill = document.createElement("div");
            pill.dataset.corePath = corePath;
            pill.className = newClassName + " animate-enter";
            pill.innerHTML = `<i class="fa-solid fa-folder-tree"></i> <span>${corePath.split(/[\\/]/).pop()}</span> <i class="${iconClass}"></i>`;

            pill.addEventListener("click", () => {
                const currIdx = coreList.indexOf(pill.dataset.corePath);
                if (currIdx !== -1 && currentCoreIndex !== currIdx) {
                    currentCoreIndex = currIdx;
                    expandedCards.clear();
                    userOpenedCards.clear();
                    renderCoreDots();
                    if (lastMetrics) renderCanvas(lastMetrics);
                }
            });
        } else {
            // Pillola Esistente: Aggiornamento dolce
            pill.classList.remove("animate-enter");
            const currentClasses = pill.className;

            if (!currentClasses.includes(stateClass)) {
                pill.className = newClassName;
                pill.classList.remove('status-changed');
                void pill.offsetWidth;
                pill.classList.add('status-changed');
            } else if (currentClasses !== newClassName) {
                pill.className = newClassName;
            }

            const iconEl = pill.querySelector('.core-status-icon');
            if (iconEl && iconEl.className !== iconClass) {
                iconEl.className = iconClass;
            }
        }

        if (index === currentCoreIndex) activeElement = pill;

        // Mantieni sempre l'ordine corretto nel DOM (posiziona prima dello spacer finale)
        selector.insertBefore(pill, spacerR);
    });

    // Auto-Centratura Assoluta
    if (activeElement) {
        setTimeout(() => {
            activeElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }, 100);
    }

    updateCoreScrollButtons();
}

function updateCoreScrollButtons() {
    const selector = document.getElementById("core-selector");
    const btnPrev = document.getElementById("btn-core-prev");
    const btnNext = document.getElementById("btn-core-next");
    if (!selector || !btnPrev || !btnNext) return;

    if (coreList.length <= 1) {
        btnPrev.classList.add("btn-hidden");
        btnNext.classList.add("btn-hidden");
        return;
    }

    if (currentCoreIndex > 0) btnPrev.classList.remove("btn-hidden");
    else btnPrev.classList.add("btn-hidden");

    if (currentCoreIndex < coreList.length - 1) btnNext.classList.remove("btn-hidden");
    else btnNext.classList.add("btn-hidden");
}

document.addEventListener("DOMContentLoaded", () => {
    const selector = document.getElementById("core-selector");
    const btnPrev = document.getElementById("btn-core-prev");
    const btnNext = document.getElementById("btn-core-next");

    if (selector) {
        selector.addEventListener("wheel", (e) => {
            if (selector.scrollWidth > selector.clientWidth) {
                e.preventDefault();
                selector.scrollBy({ left: Math.sign(e.deltaY) * 150, behavior: 'smooth' });
            }
        }, { passive: false });
    }

    if (btnPrev) {
        btnPrev.addEventListener("click", () => {
            if (currentCoreIndex > 0) {
                currentCoreIndex--;
                expandedCards.clear(); userOpenedCards.clear();
                renderCoreDots();
                if (lastMetrics) renderCanvas(lastMetrics);
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener("click", () => {
            if (currentCoreIndex < coreList.length - 1) {
                currentCoreIndex++;
                expandedCards.clear(); userOpenedCards.clear();
                renderCoreDots();
                if (lastMetrics) renderCanvas(lastMetrics);
            }
        });
    }
});