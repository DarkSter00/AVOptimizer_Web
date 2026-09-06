// frontend/js/ui_dashboard.js
import { AVButton } from "../components/AVButton/AVButton.js";
import { AVScrollMenu } from "../components/AVScrollMenu/AVScrollMenu.js";
import { AVDashboardGlobalBar } from "./dashboard/ui_global_bar.js";
import { AVSideMenu } from "../components/AVDashboardGlobalSideMenu/AVSideMenu.js";
import { AVAppLogo } from "../components/AVAppLogo/AVAppLogo.js";
import { AVMenuButton } from "../components/AVMenuButton/AVMenuButton.js";
import { AVMenuInfoBox } from "../components/AVMenuInfoBox/AVMenuInfoBox.js";
import { AVInfoCounterBox } from "../components/AVInfoCounterBox/AVInfoCounterBox.js";
import { AVInfoContainer } from "../components/AVInfoContainer/AVInfoContainer.js";
import { AVCanvas } from "../components/AVCanvas/AVCanvas.js";
import { AVFolder } from "../components/AVFolder/AVFolder.js";

window.btnAddFolderGlobal = null;
window.coreMenu = null;
window.globalBar = null;
window.globalSideMenu = null;
window.coreTransitionTimer = null;

let isBooting = true; // Blocca la UI finché il timer non scatta

// =========================================================================
// 1. SISTEMA DI BOOT CON TIMER FORZATO (1 SECONDO) E COMPONENTS
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    console.log("Avvio timer di 1 secondo in attesa dei dati dal WebSocket...");

    setTimeout(() => {
        // Dopo 1 secondo esatto, la variabile coreList sarà popolata dal WebSocket.
        // Costruiamo l'interfaccia con la certezza dei dati reali.
        initGlobalButtons();
        initGlobalSideMenu();
        isBooting = false;
        window.syncDashboardState();
    }, 1000);
});

function createScrollMenu() {
    return new AVScrollMenu({
        containerId: 'global-bar-center-zone',
        centerActive: true,
        cardGap: 8,
        shrunkMargin: -10,
        hideDisabledButtons: false,
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
    const hasCores = coreList && coreList.length > 0;

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

    // RIMOSSO initialState: nasce direttamente nello stato normale
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
        expanded: hasCores
    });

    if (hasCores) {
        window.coreMenu = createScrollMenu();
    }
}

function initGlobalSideMenu() {

    // Template ricorrente per gli stati dei contatori
    const getStandardStates = (actionCallback) => [
        { id: 'default' }, // Stato 0: Base
        {
            id: 'confirm',
            icon: 'fa-solid fa-arrow-up-right-from-square',
            text: 'Apri',
            overlayBg: 'rgba(59, 130, 246, 0.15)', // Sfondo Blu tenue e traslucido
            overlayColor: '#fff',        // Testo solido
            overlayBorder: 'var(--primary)',       // Bordo solido
            autoRevertDelay: 3000
        },
        {
            id: 'execute',
            icon: 'fa-solid fa-spinner fa-spin',
            text: 'Apro',
            overlayBg: 'rgba(16, 185, 129, 0.15)', // Sfondo Verde tenue
            overlayColor: '#fff',        // Testo solido
            overlayBorder: 'var(--success)',       // Bordo solido
            autoRevertDelay: 1500,
            action: actionCallback
        }
    ];

    // 1. HEADER: Logo (omogeneizzato con sfondi trasparenti e colori a tema)
    const appLogo = new AVAppLogo({
        title: "A/V Optimizer",
        version: "v8.5 Core",
        icon: "fa-solid fa-layer-group",
        styles: {
            iconColor: 'var(--primary)',
            bg: 'transparent',
            border: 'transparent'
        }
    });

    // 2. CENTER: Navigazione Menu
    const btnSettings = new AVMenuButton({
        label: "Impostazioni",
        icon: "fa-solid fa-gear",
        onClick: () => console.log("Apertura pagina Impostazioni...")
    });

    const btnLog = new AVMenuButton({
        label: "Log di Sistema",
        icon: "fa-solid fa-rectangle-list",
        onClick: () => console.log("Apertura pagina Log...")
    });

    const btnDb = new AVMenuButton({
        label: "Visualizza Database",
        icon: "fa-solid fa-database",
        onClick: () => console.log("Apertura pagina Database...")
    });

    const globalBtnContainerCenter = new AVInfoContainer({
        itemGap: '5px',    // Spazio orizzontale tra box
        rowGap: '5px',     // Spazio verticale tra righe
        padding: '5px',
        margin: '5px 0 0 0',
        backgroundColor: 'rgba(255, 255, 255, 0.02)', // Un grigio flebile, per evidenziare il gruppo
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: '12px',

        // Struttura a Righe!
        rows: [
            [btnSettings],
            [btnLog],
            [btnDb]
        ]
    });

    // 3. BOTTOM: Contenitore Info Globali e Counters
    const counterCompleted = new AVInfoCounterBox({
        label: "Completati",
        value: "0",
        icon: "fa-solid fa-check",
        color: "var(--success)",
        // CONFIGURAZIONE HOVERING WIDGET (Dwell to Click)
        hoverWidget: {
            delay: 600,
            duration: 1500, // Tempo in ms per riempire l'anello
            text: 'Espansione dettagli...',
            icon: 'fa-solid fa-expand',
            color: 'var(--success)'
        },
        states: getStandardStates(() => console.log("Apertura Pagina Completati..."))
    });
    const counterSaved = new AVInfoCounterBox({
        label: "Spazio",
        value: "0 B",
        extraInfo: "Risparmiato",
        icon: "fa-solid fa-hard-drive",
        color: "var(--primary)",
        // CONFIGURAZIONE HOVERING WIDGET (Dwell to Click)
        hoverWidget: {
            delay: 600,
            duration: 1500, // Tempo in ms per riempire l'anello
            text: 'Espansione dettagli...',
            icon: 'fa-solid fa-expand',
            color: 'var(--success)'
        },
        states: getStandardStates(() => console.log("Apertura Storage..."))
    });
    const counterSkipped = new AVInfoCounterBox({
        label: "Saltati",
        value: "0",
        icon: "fa-solid fa-forward-step",
        // CONFIGURAZIONE HOVERING WIDGET (Dwell to Click)
        hoverWidget: {
            delay: 600,
            duration: 1500, // Tempo in ms per riempire l'anello
            text: 'Espansione dettagli...',
            icon: 'fa-solid fa-expand',
            color: 'var(--success)'
        },
        color: "var(--cyan)" });
    const counterErrors = new AVInfoCounterBox({
        label: "Errori",
        value: "0",
        icon: "fa-solid fa-xmark",
        // CONFIGURAZIONE HOVERING WIDGET (Dwell to Click)
        hoverWidget: {
            delay: 600,
            duration: 1500, // Tempo in ms per riempire l'anello
            text: 'Espansione dettagli...',
            icon: 'fa-solid fa-expand',
            color: 'var(--success)'
        },
        color: "var(--danger)" });

    const waitMeta = new AVInfoCounterBox({
        label: "Attesa Meta",
        value: "0",
        icon: "fa-solid fa-magnifying-glass",
        // CONFIGURAZIONE HOVERING WIDGET (Dwell to Click)
        hoverWidget: {
            delay: 600,
            duration: 1500, // Tempo in ms per riempire l'anello
            text: 'Espansione dettagli...',
            icon: 'fa-solid fa-expand',
            color: 'var(--success)'
        },
        color: "var(--f-attesa)" });
    const waitCombo = new AVInfoCounterBox({
        label: "Attesa A/V",
        value: "0",
        icon: "fa-solid fa-photo-film",
        // CONFIGURAZIONE HOVERING WIDGET (Dwell to Click)
        hoverWidget: {
            delay: 600,
            duration: 1500, // Tempo in ms per riempire l'anello
            text: 'Espansione dettagli...',
            icon: 'fa-solid fa-expand',
            color: 'var(--success)'
        },
        color: "var(--f-attesa)" });

    const waitVideo = new AVInfoCounterBox({
        label: "Attesa Video",
        value: "0",
        icon: "fa-solid fa-film",
        // CONFIGURAZIONE HOVERING WIDGET (Dwell to Click)
        hoverWidget: {
            delay: 600,
            duration: 1500, // Tempo in ms per riempire l'anello
            text: 'Espansione dettagli...',
            icon: 'fa-solid fa-expand',
            color: 'var(--success)'
        },
        color: "var(--f-attesa)" });
    const waitAudio = new AVInfoCounterBox({
        label: "Attesa Audio",
        value: "0",
        icon: "fa-solid fa-headphones",
        // CONFIGURAZIONE HOVERING WIDGET (Dwell to Click)
        hoverWidget: {
            delay: 600,
            duration: 1500, // Tempo in ms per riempire l'anello
            text: 'Espansione dettagli...',
            icon: 'fa-solid fa-expand',
            color: 'var(--success)'
        },
        color: "var(--f-attesa)" });

    const waitVol = new AVInfoCounterBox({ label: "Attesa Vol",
        value: "0",
        icon: "fa-solid fa-wave-square",
        // CONFIGURAZIONE HOVERING WIDGET (Dwell to Click)
        hoverWidget: {
            delay: 600,
            duration: 1500, // Tempo in ms per riempire l'anello
            text: 'Espansione dettagli...',
            icon: 'fa-solid fa-expand',
            color: 'var(--success)'
        },
        color: "var(--f-attesa)" });

    // Riquadro a larghezza piena per i processi attivi
    const activeProcesses = new AVInfoCounterBox({
        label: "In Elaborazione",
        value: "<span style='color: var(--text-muted)'>Nessuna operazione in corso...</span>",
        icon: "fa-solid fa-microchip",
        color: "var(--warning)",
        fullWidth: true,
        states: [
            { id: 'default' },
            {
                id: 'execute',
                icon: 'fa-solid fa-satellite-dish',
                text: 'Dettaglio Esecuzioni...',
                overlayBg: 'rgba(245, 158, 11, 0.15)', // Giallo Warning tenue
                overlayColor: '#000',
                overlayBorder: 'var(--warning)',
                autoRevertDelay: 2000,
                action: () => console.log("Apertura Modal Processi...")
            }
        ]
    });

    const globalStatsContainerBottomUp = new AVInfoContainer({
        itemGap: '5px',    // Spazio orizzontale tra box
        rowGap: '5px',     // Spazio verticale tra righe
        padding: '5px',
        margin: '5px 0 0 0',
        backgroundColor: 'rgba(255, 255, 255, 0.02)', // Un grigio flebile, per evidenziare il gruppo
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: '12px',

        // Struttura a Righe!
        rows: [
            [counterCompleted, counterSaved],
            [counterSkipped, counterErrors],
            [activeProcesses]
        ]
    });
    const globalStatsContainerBottomDown = new AVInfoContainer( {
        itemGap: '5px',
        rowGap: '5px',
        padding: '5px',
        margin: '5px 0 0 0',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: '12px',

        rows: [
            [waitMeta, waitCombo],
            [waitVideo, waitAudio],
            [waitVol]
        ]
    })

    // ASSEMBLAGGIO
    window.globalSideMenu = new AVSideMenu({
        containerId: 'av-global-menu',
        backgroundColor: 'var(--bg-panel, #1e293b)',
        zoneStyles: {
            top: {
                padding: '10px 10px',
                border: 'none',
            },
            center: {
                padding: '10px 10px',
                gap: '5px',
            },
            bottom: {
                padding: '10px 10px 10px 10px',
                border: 'none',
                gap: '10px',
            }
        },

        items: {
            top: [appLogo],
            center: [globalBtnContainerCenter],
            bottom: [globalStatsContainerBottomUp, globalStatsContainerBottomDown]
        }
    });

    let peekTimer = null;
    const hamburgerNode = document.querySelector('.av-btn-hamburger');
    if (hamburgerNode) {
        hamburgerNode.addEventListener('mouseenter', () => {
            if (!document.body.classList.contains('menu-open')) {
                peekTimer = setTimeout(() => {
                    document.body.classList.add('menu-peek');
                }, 3000);
            }
        });

        hamburgerNode.addEventListener('mouseleave', () => {
            clearTimeout(peekTimer);
            document.body.classList.remove('menu-peek');
        });

        hamburgerNode.addEventListener('click', (e) => {
            e.stopPropagation();
            clearTimeout(peekTimer);
            document.body.classList.remove('menu-peek');
            if (window.globalSideMenu) window.globalSideMenu.toggle();
        });
    }
}

// CREAZIONE DEL CANVAS PRINCIPALE
window.mainCanvas = new AVCanvas({
    containerId: 'av-canvas',
    columns: 2,
    styles: {
        bg: 'var(--bg-card)',
        border: '1px solid var(--border)',
        colGap: '30px',
        itemGap: '30px',
        workPadding: '20px 30px'
    }
});

// FUNZIONE CENTRALE CHIAMATA DA API.JS AD OGNI TICK
window.updateDashboard = function(metrics) {
    if (isBooting) return;
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

    // Aggiornamento testuale etichette UI (se esistono nel DOM nativo)
    const lblFiles = document.getElementById("lbl-files");
    const lblSkipped = document.getElementById("lbl-skipped");
    const lblErrors = document.getElementById("lbl-errors");
    if(lblFiles) lblFiles.textContent = `${g.completed} / ${g.total_files}`;
    if(lblSkipped) lblSkipped.textContent = `${g.skipped}`;
    if(lblErrors) lblErrors.textContent = `${g.errors}`;

    window.syncDashboardState();
};

window.syncDashboardState = function() {
    if (isBooting || !window.globalBar) return;
    const hasCores = coreList && coreList.length > 0;

    if (hasCores) {
        document.body.classList.add('has-cores');
        window.globalBar.setExpanded(true);
    } else {
        document.body.classList.remove('has-cores');
        window.globalBar.setExpanded(false);
    }

    if (window.updateAllCoreStates) window.updateAllCoreStates();
};

window.folderInstancesCache = {};

window.processRenderLogic = function(metrics) {
    if (window.isTransitioningCore) return;

    if (currentCoreIndex === -1 || !metrics.cores) {
        window.mainCanvas.updateItems([]);
        return;
    }

    const activeCoreName = coreList[currentCoreIndex];
    const subfolders = metrics.cores[activeCoreName];
    if (!subfolders) return;

    const subfolderKeys = (metrics.ui_order && metrics.ui_order[activeCoreName])
        ? metrics.ui_order[activeCoreName]
        : Object.keys(subfolders);

    const folderItemsForCanvas = [];

    subfolderKeys.forEach(subPath => {
        const safeId = getSafeId(subPath);
        const data = subfolders[subPath];

        let visualStatus = data.status;
        if (data.is_processing) visualStatus = "In Esecuzione";
        if (data.errors > 0 && visualStatus !== "Esclusa") visualStatus = "Errore";

        // SE LA CARTELLA NON ESISTE, COSTRUIAMO L'INTERO ECOSISTEMA
        if (!window.folderInstancesCache[safeId]) {

            // 1. Creazione Bottone "Apri"
            const btnOpen = new AVButton({
                direction: 'right', height: 42,
                states: [
                    { icon: 'fa-solid fa-folder-open', text: 'Apri', width: 120, gap: 4, transitionDuration: 350, hoverEnterDelay: 250, hoverLeaveDelay: 800, colors: { buttonBg: 'rgba(59, 130, 246, 0.15)', buttonBorder: 'var(--primary)', icon: 'var(--primary)', pillBg: 'rgba(255, 255, 255, 0.08)', pillBorder: 'rgba(255, 255, 255, 0.15)', pillText: 'var(--text-main)' } },
                    { action: () => { if (window.openSystemFolder) window.openSystemFolder(subPath); }, icon: 'fa-solid fa-check', text: 'Aperta', width: 110, gap: 5, transitionDuration: 300, autoRevertDelay: 1500, colors: { buttonBg: 'rgba(16, 185, 129, 0.2)', buttonBorder: 'var(--success)', icon: 'var(--success)', pillBg: 'var(--success)', pillBorder: 'var(--success)', pillText: '#000' } }
                ]
            });

            // 2. Creazione Placeholder del Titolo (Futuro AVTitleBox)
            const titleDummyNode = document.createElement('div');
            titleDummyNode.className = 'av-folder-title-placeholder';
            const shortName = subPath === activeCoreName ? "(Root)" : subPath.split(/[\\/]/).pop();
            titleDummyNode.innerHTML = `<span>${shortName}</span> <div class="status-badge" id="badge-${safeId}">IN ATTESA</div>`;

            // 3. Creazione Bottone "Escludi"
            const btnExclude = new AVButton({
                direction: 'left', height: 42,
                states: [
                    { icon: 'fa-solid fa-trash', text: 'Escludi', width: 135, gap: 4, transitionDuration: 350, hoverEnterDelay: 250, hoverLeaveDelay: 800, colors: { buttonBg: 'rgba(239, 68, 68, 0.15)', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'rgba(255, 255, 255, 0.08)', pillBorder: 'rgba(255, 255, 255, 0.15)', pillText: 'var(--text-main)' } },
                    { icon: 'fa-solid fa-triangle-exclamation', text: 'Sicuro?', width: 130, gap: 2, transitionDuration: 250, autoRevertDelay: 3000, glow: { enabled: true, target: ['border', 'icon'], color: 'var(--danger)', speed: 1.2 }, colors: { buttonBg: 'rgba(239, 68, 68, 0.2)', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'rgba(239, 68, 68, 0.3)', pillBorder: 'var(--danger)', pillText: 'var(--danger)' } },
                    { action: () => { if (window.toggleFolderExclusion) window.toggleFolderExclusion(activeCoreName, subPath, safeId); }, icon: 'fa-solid fa-ban', text: 'Esclusa', width: 110, gap: 5, transitionDuration: 300, autoRevertDelay: 1000, colors: { buttonBg: 'rgba(239, 68, 68, 0.3)', buttonBorder: 'var(--danger)', icon: '#fff', pillBg: 'var(--danger)', pillBorder: 'var(--danger)', pillText: '#fff' } }
                ]
            });

            // 4. Creazione Bottone "Includi"
            const btnInclude = new AVButton({
                direction: 'left', height: 42,
                states: [
                    { icon: 'fa-solid fa-rotate-left', text: 'Includi', width: 130, gap: 4, transitionDuration: 350, hoverEnterDelay: 250, hoverLeaveDelay: 800, colors: { buttonBg: 'rgba(16, 185, 129, 0.15)', buttonBorder: 'var(--success)', icon: 'var(--success)', pillBg: 'rgba(255, 255, 255, 0.08)', pillBorder: 'rgba(255, 255, 255, 0.15)', pillText: 'var(--text-main)' } },
                    { action: () => { if (window.toggleFolderExclusion) window.toggleFolderExclusion(activeCoreName, subPath, safeId); }, icon: 'fa-solid fa-check', text: 'Inclusa', width: 110, gap: 5, transitionDuration: 300, autoRevertDelay: 1000, colors: { buttonBg: 'rgba(16, 185, 129, 0.3)', buttonBorder: 'var(--success)', icon: '#000', pillBg: 'var(--success)', pillBorder: 'var(--success)', pillText: '#000' } }
                ]
            });

            // Assemblaggio finale all'interno del contenitore AVFolder
            const folderInstance = new AVFolder({
                id: safeId,
                status: visualStatus,
                header: {
                    gap: '10px',
                    items: [btnOpen, titleDummyNode, btnExclude, btnInclude]
                },
                // CONFIGURAZIONE DEGLI STATI GLOBALI DELLA CARTELLA
                states: {
                    "default": {
                        styles: {
                            border: "var(--border)",
                            bg: "var(--bg-folder-attesa)",
                            shadow: "0 10px 30px rgba(0,0,0,0.2)",
                            opacity: "1",
                            filter: "none"
                        }
                    },
                    "In Esecuzione": {
                        styles: {
                            border: "var(--warning)",
                            bg: "rgba(245, 158, 11, 0.03)",
                            shadow: "0 0 20px rgba(245, 158, 11, 0.2)"
                        }
                    },
                    "Completando...": {
                        styles: {
                            border: "var(--warning)",
                            bg: "rgba(245, 158, 11, 0.03)",
                            shadow: "0 0 20px rgba(245, 158, 11, 0.2)"
                        }
                    },
                    "Completato": {
                        styles: {
                            border: "var(--f-completato)",
                            bg: "rgba(16, 185, 129, 0.05)"
                        }
                    },
                    "Errore": {
                        styles: {
                            border: "var(--danger)"
                        }
                    },
                    "Esclusa": {
                        styles: {
                            border: "#333",
                            bg: "#18181E",
                            opacity: "0.4",
                            filter: "grayscale(100%)",
                            shadow: "none"
                        }
                    }
                }
            });

            // L'apertura e chiusura del midder per ora è delegata al dummy node
            titleDummyNode.onclick = () => folderInstance.toggleMidder();

            // Cache globale estesa: conserviamo i riferimenti ai bottoni per gestirne la visibilità fuori dal componente
            window.folderInstancesCache[safeId] = {
                folder: folderInstance,
                btnExclude: btnExclude,
                btnInclude: btnInclude
            };

        } else {
            // Se esiste, aggiorna solo l'estetica esterna
            window.folderInstancesCache[safeId].folder.updateState(visualStatus);
        }

        // --- LOGICA DI VISIBILITA' ESTERNA AL COMPONENTE ---
        const cacheEntry = window.folderInstancesCache[safeId];

        if (visualStatus === "Esclusa") {
            cacheEntry.btnExclude.getNode().style.display = 'none';
            cacheEntry.btnInclude.getNode().style.display = 'block';
            if (cacheEntry.folder.isMidderOpen) cacheEntry.folder.toggleMidder();
        } else {
            cacheEntry.btnExclude.getNode().style.display = 'block';
            cacheEntry.btnInclude.getNode().style.display = 'none';
        }

        folderItemsForCanvas.push({
            status: visualStatus,
            getNode: () => cacheEntry.folder.getNode()
        });
    });

    window.mainCanvas.updateItems(folderItemsForCanvas);
};

// =========================================================================
// 2. SINCRONIZZAZIONE STATO E RENDERING MENU
// =========================================================================
window.syncDashboardState = function() {
    if (isBooting || !window.globalBar) return;

    const hasCores = coreList && coreList.length > 0;

    if (hasCores) {
        document.body.classList.add('has-cores');
        window.globalBar.setExpanded(true);

        if (!window.coreMenu) {
            window.coreMenu = createScrollMenu();
        }

        if (window.btnAddFolderGlobal) {
            window.btnAddFolderGlobal.getNode().classList.remove('pulse-primary');
        }
    } else {
        document.body.classList.remove('has-cores');
        window.globalBar.setExpanded(false);
        if (window.coreMenu) window.coreMenu.updateItems([], 0);

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
// 3. WEBSOCKET E AGGIORNAMENTI IN TEMPO REALE
// =========================================================================
window.updateDashboard = function(metrics) {
    if (isBooting) return; // Se il timer da 1 secondo è ancora in corso, blocca il render grafico

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

window.folderInstancesCache = {};

window.processRenderLogic = function(metrics) {
    if (window.isTransitioningCore) return;

    if (currentCoreIndex === -1 || !metrics.cores) {
        window.mainCanvas.updateItems([]);
        return;
    }

    const activeCoreName = coreList[currentCoreIndex];
    const subfolders = metrics.cores[activeCoreName];
    if (!subfolders) return;

    const subfolderKeys = (metrics.ui_order && metrics.ui_order[activeCoreName])
        ? metrics.ui_order[activeCoreName]
        : Object.keys(subfolders);

    const folderItemsForCanvas = [];

    subfolderKeys.forEach(subPath => {
        const safeId = getSafeId(subPath);
        const data = subfolders[subPath];

        let visualStatus = data.status;
        if (data.is_processing) visualStatus = "In Esecuzione";
        if (data.errors > 0 && visualStatus !== "Esclusa") visualStatus = "Errore";

        if (!window.folderInstancesCache[safeId]) {
            window.folderInstancesCache[safeId] = new AVFolder({
                id: safeId,
                path: subPath,
                status: visualStatus,
                onOpenSystem: (p) => { if (window.openSystemFolder) window.openSystemFolder(p); },
                onToggleExclude: (p, action) => {
                    if (window.toggleFolderExclusion) window.toggleFolderExclusion(activeCoreName, p, safeId);
                }
            });
        } else {
            window.folderInstancesCache[safeId].updateState(visualStatus);
        }

        folderItemsForCanvas.push({
            status: visualStatus,
            getNode: () => window.folderInstancesCache[safeId].getNode()
        });
    });

    window.mainCanvas.updateItems(folderItemsForCanvas);
};

window.changeCoreWithAnimation = function(newIndex) {
    if (currentCoreIndex !== newIndex && newIndex >= 0 && newIndex < coreList.length) {
        currentCoreIndex = newIndex;
        window.updateAllCoreStates();

        // Dissolvenza in Uscita
        if (!window.isTransitioningCore) {
            window.isTransitioningCore = true;
            if (window.mainCanvas && window.mainCanvas.workspace) {
                window.mainCanvas.workspace.style.transition = 'opacity 0.2s ease';
                window.mainCanvas.workspace.style.opacity = '0';
            }
        } else {
            clearTimeout(window.coreTransitionTimer);
        }

        window.coreTransitionTimer = setTimeout(() => {
            expandedCards.clear();
            userOpenedCards.clear();

            // SBLOCCO CRUCIALE: Permette a processRenderLogic di funzionare!
            window.isTransitioningCore = false;

            if (lastMetrics) {
                window.processRenderLogic(lastMetrics);
            } else {
                window.mainCanvas.updateItems([]);
            }

            // Dissolvenza in Entrata
            if (window.mainCanvas && window.mainCanvas.workspace) {
                window.mainCanvas.workspace.style.opacity = '1';
            }
        }, 350);
    }
};

// Integrazione del renderCanvas che viene chiamato costantemente da api.js
window.renderCanvas = function(metrics) {
    if (window.isTransitioningCore) return;
    if (!metrics.cores) {
        if(window.updateTutorialUI) window.updateTutorialUI();
        return;
    }

    const newCoreList = Object.keys(metrics.cores);

    // Rileva aggiunta o rimozione di cartelle master per ricalcolare l'indice
    if (JSON.stringify(coreList) !== JSON.stringify(newCoreList)) {
        const isNewCoreAdded = newCoreList.length > coreList.length;
        let nextIndex = currentCoreIndex;

        if (newCoreList.length === 0) {
            nextIndex = -1;
        } else if (isNewCoreAdded) {
            nextIndex = newCoreList.length - 1;
        } else if (nextIndex >= newCoreList.length) {
            nextIndex = newCoreList.length - 1;
        }

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
            window.processRenderLogic(metrics);

            if (window.mainCanvas && window.mainCanvas.workspace) {
                window.mainCanvas.workspace.style.opacity = '1';
            }
        }, 400);
        return;
    }

    // Aggiornamento standard senza salti
    window.processRenderLogic(metrics);
};

// Stub funzioni opzionali per la UI
window.getCoreAggregatedState = function() {};
window.renderCoreDots = () => {};
window.updateCoreScrollButtons = () => {};
window.updateTutorialUI = () => {};