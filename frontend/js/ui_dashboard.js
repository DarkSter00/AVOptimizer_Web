// frontend/js/ui_dashboard.js
import { AVButton } from "../components/AVButton/AVButton.js";
import { AVFolder } from "../components/AVFolder/AVFolder.js";
import { buildMainUpperBar } from "./ui/builder/main/dashboard/upperbar/main_upperbar.js";
import { buildMainSideMenu } from "./ui/builder/main/dashboard/sidemenu/main_sidemenu.js";
import { buildMainCanvas } from "./ui/builder/main/dashboard/canvas/main_canvas.js";
import { AVNotificationCenter } from "../components/AVNotificationCenter/AVNotificationCenter.js";
import { ScannerManager } from "./behavior/scanner_manager.js";

window.btnAddFolderGlobal = null;
window.coreMenu = null;
window.globalBar = null;
window.globalSideMenu = null;
window.coreTransitionTimer = null;
window.folderInstancesCache = {};

let isBooting = true; // Blocco globale

// =========================================================================
// 1. SISTEMA DI BOOT E ASSEMBLAGGIO MODULARE
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    console.log("Avvio timer di 1 secondo in attesa dei dati dal WebSocket...");
    // Inizializzazione centro notifiche
    window.notificationCenter = new AVNotificationCenter();

    setTimeout(() => {
        // FIX: Recuperiamo i core dalla cache del WebSocket PRIMA di costruire la UI
        if (lastMetrics && lastMetrics.cores) {
            coreList = Object.keys(lastMetrics.cores);
            if (coreList.length > 0) currentCoreIndex = 0; // Seleziona il primo core
        }

        const hasCores = coreList && coreList.length > 0;

        // 1. Costruzione Barra Superiore
        const upperBarComponents = buildMainUpperBar('av-global-bar', hasCores);
        window.globalBar = upperBarComponents.bar;
        window.btnAddFolderGlobal = upperBarComponents.btnAddFolder;
        if (hasCores) {
            window.coreMenu = upperBarComponents.createScrollMenu();
        }

        // 2. Costruzione Menu Laterale
        window.globalSideMenu = buildMainSideMenu('av-global-menu');

        // 3. Costruzione Canvas
        const canvasComponents = buildMainCanvas('av-canvas');
        window.mainCanvas = canvasComponents.canvas;
        window.canvasTitleBox = canvasComponents.titleBox;

        isBooting = false;
        window.syncDashboardState();

        // FIX: Ora che l'UI è pronta, forziamo il primo rendering del canvas con i dati in memoria
        if (lastMetrics) window.processRenderLogic(lastMetrics);
    }, 1000);
});

// =========================================================================
// 2. SINCRONIZZAZIONE STATO GLOBALE
// =========================================================================
window.syncDashboardState = function() {
    if (isBooting || !window.globalBar) return;
    const hasCores = coreList && coreList.length > 0;

    if (hasCores) {
        document.body.classList.add('has-cores');
        window.globalBar.setExpanded(true);
        if (!window.coreMenu) {
            import("./ui/builder/main/dashboard/upperbar/scrollmenu/main_upperbar_scroll_menu.js")
                .then(module => window.coreMenu = module.buildScrollMenu());
        }
        if (window.btnAddFolderGlobal) window.btnAddFolderGlobal.getNode().classList.remove('pulse-primary');
    } else {
        document.body.classList.remove('has-cores');
        window.globalBar.setExpanded(false);
        if (window.coreMenu) window.coreMenu.updateItems([], 0);
        if (window.btnAddFolderGlobal) window.btnAddFolderGlobal.getNode().classList.add('pulse-primary');
    }
    if (window.updateAllCoreStates) window.updateAllCoreStates();
};

window.updateAllCoreStates = function() {
    if (!window.coreMenu || !coreList || coreList.length === 0) {
        if (window.coreMenu) window.coreMenu.updateItems([], 0);
        return;
    }
    const formattedItems = coreList.map(corePath => {
        let isProcessing = false, isCompleted = true, hasFiles = false, hasErrors = false;

        if (lastMetrics && lastMetrics.cores[corePath]) {
            const subs = lastMetrics.cores[corePath];
            let totFiles = 0, totDone = 0;
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
            } else isCompleted = false;
        }

        let themeClass = "theme-pending", statusIcon = "fa-solid fa-hourglass-half status-icon";
        if (hasErrors) { themeClass = "theme-error"; statusIcon = "fa-solid fa-triangle-exclamation status-icon"; }
        else if (isProcessing) { themeClass = "theme-processing"; statusIcon = "fa-solid fa-circle-notch fa-spin status-icon"; }
        else if (hasFiles && isCompleted) { themeClass = "theme-completed"; statusIcon = "fa-solid fa-check status-icon"; }

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
// 3. GESTIONE DEI DATI WEBSOCKET
// =========================================================================
window.updateDashboard = function(metrics) {
    if (isBooting || !window.mainCanvas) return; // PROTEZIONE RACE CONDITION
    const g = metrics.global;

    if (g.is_paused !== undefined && isPaused !== g.is_paused) {
        isPaused = g.is_paused;
        const btnTogglePlay = document.getElementById("btn-toggle-play");
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
    // Scanner API
    ScannerManager.processScanMetrics(g);

    // Aggiornamento testuale etichette UI (se esistono nel DOM nativo)
    const lblFiles = document.getElementById("lbl-files");
    const lblSkipped = document.getElementById("lbl-skipped");
    const lblErrors = document.getElementById("lbl-errors");
    const lblSavedSpace = document.getElementById("lbl-saved-space");

    // Gestione Scanner Visivo
    const blocker = document.getElementById("canvas-blocker");
    const scannerWidget = document.getElementById("scanner-widget");
    if (g.is_scanning) {
        if (scannerWidget) scannerWidget.classList.remove("hidden");
        if (blocker) blocker.classList.remove("hidden");
        let stepName = "Inizializzazione...", fileStr = g.scan_file || "Attendere...", progress = g.scan_progress || 0;

        if (g.scan_step === 1) { stepName = "Mappatura disco..."; progress = 5; }
        else if (g.scan_step === 2) { stepName = "Interrogazione Database RAM..."; progress = 10; }
        else if (g.scan_step === 3) { stepName = "Lettura Cache DB Metadati"; fileStr = g.scan_file || "Controllo file in cache..."; }
        else if (g.scan_step === 4) {
            stepName = "Estrazione Metadati (ffprobe)";
            if (g.scan_file && g.scan_file.includes('|')) {
                const parts = g.scan_file.split('|');
                fileStr = parts.slice(1).join('|').trim() + ` (${parts[0].trim()})`;
            }
        }

        const stText = document.getElementById("scanner-step-text"), fText = document.getElementById("scanner-file-text");
        const sBg = document.getElementById("scanner-bg"), pText = document.getElementById("scanner-pct-text");
        if (stText) stText.textContent = stepName;
        if (fText) fText.textContent = fileStr;
        if (sBg) sBg.style.width = `${progress}%`;
        if (pText) pText.textContent = `${Math.floor(progress)}%`;
    } else {
        if (scannerWidget) scannerWidget.classList.add("hidden");
        if (blocker) blocker.classList.add("hidden");
    }

    if(lblFiles) lblFiles.textContent = `${g.completed} / ${g.total_files}`;
    if(lblSkipped) lblSkipped.textContent = `${g.skipped}`;
    if(lblErrors) lblErrors.textContent = `${g.errors}`;
    if(lblSavedSpace && typeof formatBytes === 'function') lblSavedSpace.textContent = formatBytes(g.saved_space || 0);

    window.syncDashboardState();
};

window.renderCanvas = function(metrics) {
    if (isBooting || window.isTransitioningCore || !window.mainCanvas) return; // PROTEZIONE RACE CONDITION

    if (!metrics.cores) {
        if(window.updateTutorialUI) window.updateTutorialUI();
        return;
    }

    const newCoreList = Object.keys(metrics.cores);
    if (JSON.stringify(coreList) !== JSON.stringify(newCoreList)) {
        const isNewCoreAdded = newCoreList.length > coreList.length;
        let nextIndex = currentCoreIndex;
        if (newCoreList.length === 0) nextIndex = -1;
        else if (isNewCoreAdded || nextIndex >= newCoreList.length) nextIndex = newCoreList.length - 1;

        window.isTransitioningCore = true;
        if (window.mainCanvas && window.mainCanvas.workspace) {
            window.mainCanvas.workspace.style.transition = 'opacity 0.2s ease';
            window.mainCanvas.workspace.style.opacity = '0';
        }

        setTimeout(() => {
            coreList = newCoreList;
            currentCoreIndex = nextIndex;
            expandedCards.clear();
            userOpenedCards.clear();
            if(window.updateTutorialUI) window.updateTutorialUI();

            window.isTransitioningCore = false;
            window.syncDashboardState();
            window.processRenderLogic(metrics);

            if (window.mainCanvas && window.mainCanvas.workspace) {
                window.mainCanvas.workspace.style.opacity = '1';
            }
        }, 400);
        return;
    }
    window.processRenderLogic(metrics);
};

window.processRenderLogic = function(metrics) {
    if (isBooting || window.isTransitioningCore || !window.mainCanvas) return; // PROTEZIONE RACE CONDITION

    if (currentCoreIndex === -1 || !metrics.cores) {
        if (window.canvasTitleBox) {
            window.canvasTitleBox.setTitle("Nessun Core Selezionato");
            window.canvasTitleBox.setBadge("Vuoto", { bg: 'rgba(255,255,255,0.05)', color: '#666', border: 'transparent' });
        }
        window.mainCanvas.updateItems([]);
        return;
    }

    const activeCoreName = coreList[currentCoreIndex];
    const subfolders = metrics.cores[activeCoreName];
    if (!subfolders) return;

    if (window.canvasTitleBox) {
        const shortCoreName = activeCoreName.split(/[\\/]/).pop();
        window.canvasTitleBox.setTitle(shortCoreName);
        let hasProcessing = false, hasErrors = false;
        Object.values(subfolders).forEach(data => {
            if (data.is_processing) hasProcessing = true;
            if (data.errors > 0) hasErrors = true;
        });

        if (hasErrors) window.canvasTitleBox.setBadge("Attenzione", { bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: 'var(--danger)' });
        else if (hasProcessing) window.canvasTitleBox.setBadge("In Esecuzione", { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', border: 'var(--warning)' });
        else window.canvasTitleBox.setBadge("Pronto", { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: 'var(--success)' });
    }

    const subfolderKeys = (metrics.ui_order && metrics.ui_order[activeCoreName]) ? metrics.ui_order[activeCoreName] : Object.keys(subfolders);
    const folderItemsForCanvas = [];

    subfolderKeys.forEach(subPath => {
        const safeId = typeof getSafeId === 'function' ? getSafeId(subPath) : subPath.replace(/[^a-zA-Z0-9]/g, '_');
        const data = subfolders[subPath];
        let visualStatus = data.status;
        if (data.is_processing) visualStatus = "In Esecuzione";
        if (data.errors > 0 && visualStatus !== "Esclusa") visualStatus = "Errore";

        if (!window.folderInstancesCache[safeId]) {
            const btnOpen = new AVButton({
                direction: 'right', height: 42,
                states: [
                    { icon: 'fa-solid fa-folder-open', text: 'Apri', width: 120, gap: 4, transitionDuration: 350, hoverEnterDelay: 250, hoverLeaveDelay: 800, colors: { buttonBg: 'rgba(59, 130, 246, 0.15)', buttonBorder: 'var(--primary)', icon: 'var(--primary)', pillBg: 'rgba(255, 255, 255, 0.08)', pillBorder: 'rgba(255, 255, 255, 0.15)', pillText: 'var(--text-main)' } },
                    { action: () => { if (window.openSystemFolder) window.openSystemFolder(subPath); }, icon: 'fa-solid fa-check', text: 'Aperta', width: 110, gap: 5, transitionDuration: 300, autoRevertDelay: 1500, colors: { buttonBg: 'rgba(16, 185, 129, 0.2)', buttonBorder: 'var(--success)', icon: 'var(--success)', pillBg: 'var(--success)', pillBorder: 'var(--success)', pillText: '#000' } }
                ]
            });
            const titleDummyNode = document.createElement('div');
            titleDummyNode.className = 'av-folder-title-placeholder';
            const shortName = subPath === activeCoreName ? "(Root)" : subPath.split(/[\\/]/).pop();
            titleDummyNode.innerHTML = `<span>${shortName}</span> <div class="status-badge" id="badge-${safeId}">IN ATTESA</div>`;

            const btnExclude = new AVButton({
                direction: 'left', height: 42,
                states: [
                    { icon: 'fa-solid fa-trash', text: 'Escludi', width: 135, gap: 4, transitionDuration: 350, hoverEnterDelay: 250, hoverLeaveDelay: 800, colors: { buttonBg: 'rgba(239, 68, 68, 0.15)', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'rgba(255, 255, 255, 0.08)', pillBorder: 'rgba(255, 255, 255, 0.15)', pillText: 'var(--text-main)' } },
                    { icon: 'fa-solid fa-triangle-exclamation', text: 'Sicuro?', width: 130, gap: 2, transitionDuration: 250, autoRevertDelay: 3000, glow: { enabled: true, target: ['border', 'icon'], color: 'var(--danger)', speed: 1.2 }, colors: { buttonBg: 'rgba(239, 68, 68, 0.2)', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'rgba(239, 68, 68, 0.3)', pillBorder: 'var(--danger)', pillText: 'var(--danger)' } },
                    { action: () => { if (window.toggleFolderExclusion) window.toggleFolderExclusion(activeCoreName, subPath, safeId); }, icon: 'fa-solid fa-ban', text: 'Esclusa', width: 110, gap: 5, transitionDuration: 300, autoRevertDelay: 1000, colors: { buttonBg: 'rgba(239, 68, 68, 0.3)', buttonBorder: 'var(--danger)', icon: '#fff', pillBg: 'var(--danger)', pillBorder: 'var(--danger)', pillText: '#fff' } }
                ]
            });
            const btnInclude = new AVButton({
                direction: 'left', height: 42,
                states: [
                    { icon: 'fa-solid fa-rotate-left', text: 'Includi', width: 130, gap: 4, transitionDuration: 350, hoverEnterDelay: 250, hoverLeaveDelay: 800, colors: { buttonBg: 'rgba(16, 185, 129, 0.15)', buttonBorder: 'var(--success)', icon: 'var(--success)', pillBg: 'rgba(255, 255, 255, 0.08)', pillBorder: 'rgba(255, 255, 255, 0.15)', pillText: 'var(--text-main)' } },
                    { action: () => { if (window.toggleFolderExclusion) window.toggleFolderExclusion(activeCoreName, subPath, safeId); }, icon: 'fa-solid fa-check', text: 'Inclusa', width: 110, gap: 5, transitionDuration: 300, autoRevertDelay: 1000, colors: { buttonBg: 'rgba(16, 185, 129, 0.3)', buttonBorder: 'var(--success)', icon: '#000', pillBg: 'var(--success)', pillBorder: 'var(--success)', pillText: '#000' } }
                ]
            });

            const folderInstance = new AVFolder({
                id: safeId, status: visualStatus,
                header: { gap: '10px', items: [btnOpen, titleDummyNode, btnExclude, btnInclude] },
                states: {
                    "default": { styles: { border: "var(--border)", bg: "var(--bg-folder-attesa)", shadow: "0 10px 30px rgba(0,0,0,0.2)", opacity: "1", filter: "none" } },
                    "In Esecuzione": { styles: { border: "var(--warning)", bg: "rgba(245, 158, 11, 0.03)", shadow: "0 0 20px rgba(245, 158, 11, 0.2)" } },
                    "Completando...": { styles: { border: "var(--warning)", bg: "rgba(245, 158, 11, 0.03)", shadow: "0 0 20px rgba(245, 158, 11, 0.2)" } },
                    "Completato": { styles: { border: "var(--f-completato)", bg: "rgba(16, 185, 129, 0.05)" } },
                    "Errore": { styles: { border: "var(--danger)" } },
                    "Esclusa": { styles: { border: "#333", bg: "#18181E", opacity: "0.4", filter: "grayscale(100%)", shadow: "none" } }
                }
            });
            titleDummyNode.onclick = () => folderInstance.toggleMidder();
            window.folderInstancesCache[safeId] = { folder: folderInstance, btnExclude: btnExclude, btnInclude: btnInclude };
        } else {
            window.folderInstancesCache[safeId].folder.updateState(visualStatus);
        }

        const cacheEntry = window.folderInstancesCache[safeId];
        if (visualStatus === "Esclusa") {
            cacheEntry.btnExclude.getNode().style.display = 'none';
            cacheEntry.btnInclude.getNode().style.display = 'block';
            if (cacheEntry.folder.isMidderOpen) cacheEntry.folder.toggleMidder();
        } else {
            cacheEntry.btnExclude.getNode().style.display = 'block';
            cacheEntry.btnInclude.getNode().style.display = 'none';
        }
        folderItemsForCanvas.push({ status: visualStatus, getNode: () => cacheEntry.folder.getNode() });
    });
    window.mainCanvas.updateItems(folderItemsForCanvas);
};

window.changeCoreWithAnimation = function(newIndex) {
    if (currentCoreIndex !== newIndex && newIndex >= 0 && newIndex < coreList.length) {
        currentCoreIndex = newIndex;
        window.updateAllCoreStates();
        if (!window.isTransitioningCore) {
            window.isTransitioningCore = true;
            if (window.mainCanvas && window.mainCanvas.workspace) {
                window.mainCanvas.workspace.style.transition = 'opacity 0.2s ease';
                window.mainCanvas.workspace.style.opacity = '0';
            }
        } else clearTimeout(window.coreTransitionTimer);

        window.coreTransitionTimer = setTimeout(() => {
            expandedCards.clear();
            userOpenedCards.clear();
            window.isTransitioningCore = false;
            if (lastMetrics) window.processRenderLogic(lastMetrics);
            else window.mainCanvas.updateItems([]);
            if (window.mainCanvas && window.mainCanvas.workspace) window.mainCanvas.workspace.style.opacity = '1';
        }, 350);
    }
};

window.resetAllConfirm = async function() {
    try { await fetch(`${API_URL}/stop`, { method: "POST" }); window.stopAll(); } catch(e) {}
};