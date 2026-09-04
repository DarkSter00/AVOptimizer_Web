// frontend/js/ui_dashboard.js
import { AVButton } from "../components/AVButton/AVButton.js";
import { AVScrollMenu } from "../components/AVScrollMenu/AVScrollMenu.js";
import { AVDashboardGlobalBar } from "./dashboard/ui_global_bar.js";

window.btnAddFolderGlobal = null;
window.coreMenu = null;
window.globalBar = null;

// =========================================================================
// 1. INIZIALIZZAZIONE STRUTTURA BASE
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initGlobalButtons();
});

function createScrollMenu() {
    return new AVScrollMenu({
        containerId: 'global-bar-center-zone',
        centerActive: true,
        hideDisabledButtons: true,
        btnPrevConfig: {
            direction: 'left', height: 38,
            states: [{ icon: 'fa-solid fa-chevron-left', text: '', pillIcon: '', width: 38, colors: { buttonBg: 'rgba(255,255,255,0.05)', buttonBorder: 'var(--border)', icon: '#fff', pillBg: 'transparent', pillBorder: 'transparent', pillText: 'transparent' } }]
        },
        btnNextConfig: {
            direction: 'right', height: 38,
            states: [{ icon: 'fa-solid fa-chevron-right', text: '', pillIcon: '', width: 38, colors: { buttonBg: 'rgba(255,255,255,0.05)', buttonBorder: 'var(--border)', icon: '#fff', pillBg: 'transparent', pillBorder: 'transparent', pillText: 'transparent' } }]
        },
        onItemClick: (item, index) => { if(window.changeCoreWithAnimation) window.changeCoreWithAnimation(index); },
        onPrevClick: (index) => { if(window.changeCoreWithAnimation) window.changeCoreWithAnimation(index - 1); },
        onNextClick: (index) => { if(window.changeCoreWithAnimation) window.changeCoreWithAnimation(index + 1); }
    });
}

function initGlobalButtons() {
    const btnMenu = new AVButton({
        direction: 'right', height: 42,
        states: [{
            action: () => document.body.classList.toggle('menu-open'),
            icon: 'fa-solid fa-bars', text: 'Menu', pillIcon: '',
            width: 110, gap: 4, transitionDuration: 250, loopOnClick: true,
            colors: { buttonBg: 'transparent', buttonBorder: 'var(--border)', icon: 'var(--text-main)', pillBg: 'rgba(255,255,255,0.08)', pillBorder: 'rgba(255,255,255,0.15)', pillText: 'var(--text-main)' }
        }]
    });
    btnMenu.getNode().classList.add('av-btn-hamburger');

    // NIENTE initialState. Il bottone nasce con la sua forma standard definitiva.
    window.btnAddFolderGlobal = new AVButton({
        direction: 'right', height: 42,
        states: [
            {
                icon: 'fa-solid fa-folder-plus', text: 'Aggiungi cartella', pillIcon: '',
                width: 190, gap: 4, transitionDuration: 350, autoRevertDelay: 0, hoverEnterDelay: 250, hoverLeaveDelay: 1200,
                glow: { enabled: false },
                colors: { buttonBg: 'rgba(59, 130, 246, 0.1)', buttonBorder: 'var(--primary)', icon: 'var(--primary)', pillBg: 'rgba(255, 255, 255, 0.08)', pillBorder: 'rgba(255, 255, 255, 0.15)', pillText: 'var(--text-main)' }
            },
            {
                action: () => { if(window.addFolder) window.addFolder(); },
                icon: 'fa-solid fa-check', text: 'Apertura in corso...', pillIcon: '',
                width: 200, gap: 5, transitionDuration: 300, autoRevertDelay: 1500,
                glow: { enabled: false },
                colors: { buttonBg: 'rgba(16, 185, 129, 0.2)', buttonBorder: 'var(--success)', icon: 'var(--success)', pillBg: 'var(--success)', pillBorder: 'var(--success)', pillText: '#000' }
            }
        ]
    });
    window.btnAddFolderGlobal.getNode().id = "btn-add-folder-smart";

    const btnResetAllGlobal = new AVButton({
        direction: 'left', height: 42,
        states: [
            {
                icon: 'fa-solid fa-power-off', text: 'Resetta tutto', pillIcon: '',
                width: 160, gap: 4, transitionDuration: 350, autoRevertDelay: 0, hoverEnterDelay: 250, hoverLeaveDelay: 1200,
                glow: { enabled: false },
                colors: { buttonBg: 'rgba(239, 68, 68, 0.1)', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'rgba(255, 255, 255, 0.08)', pillBorder: 'rgba(255, 255, 255, 0.15)', pillText: 'var(--text-main)' }
            },
            {
                icon: 'fa-solid fa-power-off', text: 'Svuotare RAM?', pillIcon: 'fa-solid fa-triangle-exclamation',
                width: 180, gap: 2, transitionDuration: 250, autoRevertDelay: 3000,
                glow: { enabled: true, target: ['border', 'icon'], color: 'var(--danger)', speed: 1.2 },
                colors: { buttonBg: 'rgba(239, 68, 68, 0.15)', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'rgba(239, 68, 68, 0.2)', pillBorder: 'var(--danger)', pillText: 'var(--danger)' }
            },
            {
                action: () => { if(window.resetAllConfirm) window.resetAllConfirm(); },
                icon: 'fa-solid fa-check', text: 'Reset...', pillIcon: '',
                width: 130, gap: 5, transitionDuration: 300, autoRevertDelay: 1500,
                glow: { enabled: false },
                colors: { buttonBg: 'rgba(239, 68, 68, 0.3)', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'var(--danger)', pillBorder: 'var(--danger)', pillText: '#fff' }
            }
        ]
    });

    window.globalBar = new AVDashboardGlobalBar({
        containerId: 'av-global-bar',
        height: '64px', padding: '0 12px', gap: '24px', innerGap: '12px',
        bg: 'var(--bg-panel, #1e293b)', border: '1px solid rgba(255,255,255,0.05)', radius: '32px',
        leftItems: [btnMenu, window.btnAddFolderGlobal],
        centerItems: [],
        rightItems: [btnResetAllGlobal],
        expanded: false // Di default chiusa, sarà syncDashboardState ad aprirla
    });
}

// =========================================================================
// 2. MOTORE DI SINCRONIZZAZIONE
// =========================================================================
window.syncDashboardState = function() {
    const hasCores = coreList && coreList.length > 0;

    if (hasCores) {
        document.body.classList.add('has-cores');
        if (window.globalBar) window.globalBar.setExpanded(true);

        if (!window.coreMenu) {
            window.coreMenu = createScrollMenu();
        }

        // Togliamo l'effetto attenzione dal pulsante aggiungi
        if (window.btnAddFolderGlobal) {
            window.btnAddFolderGlobal.getNode().classList.remove('pulse-primary');
        }
    } else {
        document.body.classList.remove('has-cores');
        if (window.globalBar) window.globalBar.setExpanded(false);
        if (window.coreMenu) window.coreMenu.updateItems([], 0);

        // Accendiamo il lampeggiamento CSS per attirare l'attenzione sul bottone standard
        if (window.btnAddFolderGlobal) {
            window.btnAddFolderGlobal.getNode().classList.add('pulse-primary');
        }
    }

    if (window.updateAllCoreStates) window.updateAllCoreStates();
};

window.updateAllCoreStates = function() {
    if (!window.coreMenu) return;

    if (!coreList || coreList.length === 0) {
        window.coreMenu.updateItems([], 0);
        return;
    }

    const formattedItems = coreList.map(corePath => {
        let isProcessing = false;
        let isCompleted = true;
        let hasFiles = false;
        let hasErrors = false;

        if (lastMetrics && lastMetrics.cores[corePath]) {
            const subs = lastMetrics.cores[corePath];
            let totFiles = 0;
            let totDone = 0;
            for (const sub in subs) {
                const data = subs[sub];
                if (data.is_processing) isProcessing = true;
                if (data.errors > 0) hasErrors = true;
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

        let themeClass = "theme-pending";
        let statusIcon = "fa-solid fa-hourglass-half status-icon";

        if (hasErrors) {
            themeClass = "theme-error";
            statusIcon = "fa-solid fa-triangle-exclamation status-icon";
        } else if (isProcessing) {
            themeClass = "theme-processing";
            statusIcon = "fa-solid fa-circle-notch fa-spin status-icon";
        } else if (hasFiles && isCompleted) {
            themeClass = "theme-completed";
            statusIcon = "fa-solid fa-check status-icon";
        }

        return {
            id: corePath,
            label: corePath.split(/[\\/]/).pop(),
            mainIcon: 'fa-solid fa-folder-tree',
            themeClass: themeClass,
            statusIcon: statusIcon
        };
    });

    window.coreMenu.updateItems(formattedItems, currentCoreIndex);
};

// =========================================================================
// 3. AGGIORNAMENTO DATI IN TEMPO REALE E ANIMAZIONI DEL CANVAS
// =========================================================================
window.updateDashboard = function(metrics) {
    const g = metrics.global;

    if (g.is_paused !== undefined && isPaused !== g.is_paused) {
        isPaused = g.is_paused;
        if(btnTogglePlay && coreList.length > 0) {
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

    window.syncDashboardState();
}

window.resetAllConfirm = async function() {
    try {
        await fetch(`${API_URL}/stop`, { method: "POST" });
        window.stopAll();
    } catch(e) {}
};

window.changeCoreWithAnimation = function(newIndex) {
    if (currentCoreIndex !== newIndex && newIndex >= 0 && newIndex < coreList.length) {
        if (window.isTransitioningCore) return;
        window.isTransitioningCore = true;
        currentCoreIndex = newIndex;

        window.updateAllCoreStates();

        const canvasWrapper = document.getElementById('canvas-scroll-wrapper');
        if(canvasWrapper) canvasWrapper.classList.add('canvas-hidden');

        setTimeout(() => {
            expandedCards.clear();
            userOpenedCards.clear();
            if (lastMetrics) window.processRenderLogic(lastMetrics);
            window.isTransitioningCore = false;
            if(canvasWrapper) canvasWrapper.classList.remove('canvas-hidden');
        }, 400);
    }
};

window.getCoreAggregatedState = function() {};
window.renderCoreDots = () => {};
window.updateCoreScrollButtons = () => {};
window.updateTutorialUI = () => {};