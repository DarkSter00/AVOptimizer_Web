window.confirmTimers = {};

window.handleTopAction = function(btnId, actionType) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    if (btn.classList.contains('confirm-state')) {
        btn.classList.remove('confirm-state');
        if (actionType === 'add-folder') window.addFolder();
        if (actionType === 'delete-core') window.deleteActiveCore();
        if (actionType === 'reset-all') window.resetAllConfirm();
    } else {
        btn.classList.add('confirm-state');
    }
}

window.handleBtnLeave = function(btn) {
    // ESTREMA TOLLERANZA: Aspetta più di 1 secondo prima di far scomparire il "Sicuro?" via JS
    window.confirmTimers[btn.id] = setTimeout(() => {
        btn.classList.remove('confirm-state');
    }, 1200);
}

window.handleBtnEnter = function(btn) {
    clearTimeout(window.confirmTimers[btn.id]);
}

window.resetAllConfirm = async function() {
    try {
        await fetch(`${API_URL}/stop`, { method: "POST" });
        window.stopAll();
    } catch(e) {}
}

window.changeCoreWithAnimation = function(newIndex) {
    if (currentCoreIndex !== newIndex && newIndex >= 0 && newIndex < coreList.length) {
        if (window.isTransitioningCore) return;
        window.isTransitioningCore = true;

        currentCoreIndex = newIndex;
        renderCoreDots();

        const canvasWrapper = document.getElementById('canvas-scroll-wrapper');
        if(canvasWrapper) canvasWrapper.classList.add('canvas-hidden');

        setTimeout(() => {
            expandedCards.clear(); userOpenedCards.clear();
            if (lastMetrics) window.processRenderLogic(lastMetrics);

            window.isTransitioningCore = false;
            if(canvasWrapper) canvasWrapper.classList.remove('canvas-hidden');
        }, 400);
    }
}

function updateTutorialUI() {
    const wrapAddFolder = document.getElementById("btn-add-folder-smart");
    if (coreList.length === 0) {
        if(wrapAddFolder) wrapAddFolder.classList.add("pulse-primary");
        if(btnTogglePlay) {
            btnTogglePlay.disabled = true;
            btnTogglePlay.className = "btn btn-secondary";
            btnTogglePlay.innerHTML = '<i class="fa-solid fa-play"></i> Avvia';
        }
    } else {
        if(wrapAddFolder) wrapAddFolder.classList.remove("pulse-primary");
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

    const existingPills = Array.from(selector.querySelectorAll('.core-pill:not(.animate-leave)'));
    if (existingPills.length !== coreList.length) return;

    existingPills.forEach((pill, index) => {
        const corePath = coreList[index];
        if (pill.dataset.corePath !== corePath) return;

        const state = getCoreAggregatedState(corePath);

        let stateClass = ""; let iconClass = "";
        if (state === "processing") { stateClass = "state-processing"; iconClass = "fa-solid fa-circle-notch fa-spin core-status-icon"; }
        else if (state === "completed") { stateClass = "state-completed"; iconClass = "fa-solid fa-check core-status-icon"; }
        else { stateClass = "state-pending"; iconClass = "fa-solid fa-hourglass-half core-status-icon"; }

        const isActive = index === currentCoreIndex ? " active" : "";
        const currentClasses = pill.className;
        const newClassName = `core-pill ${stateClass}${isActive}`;

        if (currentClasses !== newClassName) {
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

    existingPills.forEach(pill => {
        if (!coreList.includes(pill.dataset.corePath)) {
            pill.classList.add('animate-leave');
            setTimeout(() => { if (pill.parentNode) pill.remove(); }, 450);
        }
    });

    let activeElement = null;

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
            pill = document.createElement("div");
            pill.dataset.corePath = corePath;
            pill.className = newClassName + " animate-enter";
            pill.innerHTML = `<i class="fa-solid fa-folder-tree"></i> <span>${corePath.split(/[\\/]/).pop()}</span> <i class="${iconClass}"></i>`;

            // Fix per evitare listener doppi (sovrascrive brutalmente .onclick)
            pill.onclick = () => {
                const currIdx = coreList.indexOf(pill.dataset.corePath);
                window.changeCoreWithAnimation(currIdx);
            };
        } else {
            pill.classList.remove("animate-enter");
            if (pill.className !== newClassName) {
                pill.className = newClassName;
            }
            const iconEl = pill.querySelector('.core-status-icon');
            if (iconEl && iconEl.className !== iconClass) {
                iconEl.className = iconClass;
            }
        }

        if (index === currentCoreIndex) activeElement = pill;
        selector.insertBefore(pill, spacerR);
    });

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
    // Inizializzazione Pulsanti Scorrimento: sovrascriviamo rigidamente l'onclick per evitare salti doppi
    const selector = document.getElementById("core-selector");
    const btnPrev = document.getElementById("btn-core-prev");
    const btnNext = document.getElementById("btn-core-next");

    if (selector) {
        selector.onwheel = (e) => {
            if (selector.scrollWidth > selector.clientWidth) {
                e.preventDefault();
                selector.scrollBy({ left: Math.sign(e.deltaY) * 150, behavior: 'smooth' });
            }
        };
    }

    if (btnPrev) {
        btnPrev.onclick = () => window.changeCoreWithAnimation(currentCoreIndex - 1);
    }

    if (btnNext) {
        btnNext.onclick = () => window.changeCoreWithAnimation(currentCoreIndex + 1);
    }
});