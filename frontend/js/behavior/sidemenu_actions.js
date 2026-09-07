// frontend/js/behavior/sidemenu_actions.js

export const SideMenuBehaviors = {
    openSettings: () => console.log("Apertura pagina Impostazioni..."),
    openLog: () => console.log("Apertura pagina Log..."),
    openDatabase: () => {
        if (window.openDbViewer) window.openDbViewer();
    },
    openCompleted: () => console.log("Apertura Pagina Completati..."),
    openStorage: () => console.log("Apertura Storage..."),
    openProcessesModal: () => console.log("Apertura Modal Processi...")
};