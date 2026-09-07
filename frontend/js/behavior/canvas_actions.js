// frontend/js/behavior/canvas_actions.js

export const CanvasBehaviors = {
    toggleFullscreen: (expand) => {
        if (expand) {
            document.body.classList.add('canvas-fullscreen');
            document.body.classList.remove('menu-open'); // Forza la chiusura del menu
        } else {
            document.body.classList.remove('canvas-fullscreen');
        }
    },

    openGraph: () => {
        console.log("Apertura Grafo...");
    },

    deleteActiveCore: () => {
        if (window.deleteActiveCore) window.deleteActiveCore();
    }
};