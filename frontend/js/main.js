// --- GESTIONE DRAG & DROP AVANZATA A TUTTO SCHERMO ---
document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    const overlay = document.getElementById('dnd-overlay');
    if (dragCounter === 1) {
        // Calcola la posizione del pulsante Aggiungi Cartella per l'origine dell'animazione
        const btn = document.getElementById('btn-add-folder');
        const box = overlay.querySelector('.dnd-box');
        if (btn && box) {
            const rect = btn.getBoundingClientRect();
            box.style.transformOrigin = `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`;
        }
        overlay.classList.add('active');
    }
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
        document.getElementById('dnd-overlay').classList.remove('active');
    }
});

document.addEventListener('dragover', (e) => {
    e.preventDefault(); // Necessario per permettere il Drop nativo
});

document.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    document.getElementById('dnd-overlay').classList.remove('active');

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
        // BLOCCO DI SICUREZZA
        if (!isPaused) {
            const proceed = confirm("⚠️ ATTENZIONE: Ci sono processi in corso!\n\nVuoi interrompere le elaborazioni attuali per caricare le nuove cartelle trascinate?");
            if (!proceed) return;
            await window.stopAll();
        }

        const forceCheckbox = document.getElementById("chk-force-rescan");
        const forceRescan = forceCheckbox ? forceCheckbox.checked : false;

        let hasNativePath = false;
        const promises = [];

        // Cicla tutti gli item trascinati e li manda al backend
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file && file.path) { // file.path esiste solo in Electron/Ambienti Nativi Locali
                    hasNativePath = true;
                    promises.push(
                        fetch(`${API_URL}/scan`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ directory: file.path, force_rescan: forceRescan })
                        })
                    );
                }
            }
        }

        if (hasNativePath) {
            await Promise.all(promises);
        } else {
            // Fallback: se stiamo operando da un browser classico Web che non ci passa l'absolute path
            alert("Il browser non ha fornito i percorsi assoluti dei file. Si apre la finestra di selezione classica.");
            window.addFolder();
        }
    }
});

// --- ESPANSIONE NOTIFICA INFERIORE ---
if (scannerWidget) {
    scannerWidget.addEventListener('click', () => {
        scannerWidget.classList.toggle('expanded');
    });
}

// --- LISTENERS BASE PER IL MENU LATERALE ---
if(btnMobileMenu) btnMobileMenu.addEventListener("click", () => {
    sidebar.classList.add("open");
    mobileOverlay.classList.add("active");
    btnMobileMenu.classList.add("hidden-by-sidebar");
});

if(mobileOverlay) mobileOverlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    mobileOverlay.classList.remove("active");
    btnMobileMenu.classList.remove("hidden-by-sidebar");
});

if(document.getElementById("btn-add-folder"))
    document.getElementById("btn-add-folder").addEventListener("click", () => {
        window.addFolder();
        sidebar.classList.remove("open");
        mobileOverlay.classList.remove("active");
        btnMobileMenu.classList.remove("hidden-by-sidebar");
    });

if(document.getElementById("btn-stop"))
    document.getElementById("btn-stop").addEventListener("click", window.stopAll);

if(document.getElementById("btn-toggle-play"))
    document.getElementById("btn-toggle-play").addEventListener("click", window.togglePlayPause);

if(document.getElementById("btn-delete-core"))
    document.getElementById("btn-delete-core").addEventListener("click", window.deleteActiveCore);

if(document.getElementById("btn-db-viewer"))
    document.getElementById("btn-db-viewer").addEventListener("click", window.openDbViewer);

window.updateTutorialUI();