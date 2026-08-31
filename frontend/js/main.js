// --- GESTIONE DRAG & DROP AVANZATA (Cartelle Multiple) ---
document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    document.getElementById('dnd-overlay').classList.add('active');
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
        document.getElementById('dnd-overlay').classList.remove('active');
    }
});

document.addEventListener('dragover', (e) => { e.preventDefault(); });

document.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    document.getElementById('dnd-overlay').classList.remove('active');

    const items = e.dataTransfer.items;
    if (items) {
        const forceCheckbox = document.getElementById("chk-force-rescan");
        const forceRescan = forceCheckbox ? forceCheckbox.checked : false;

        let hasNativePath = false;
        // Permette l'invio di N cartelle in simultanea al server
        const promises = [];

        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file && file.path) {
                    hasNativePath = true;
                    // Manda tutte le chiamate POST in batch
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
            await Promise.all(promises); // Attende l'accodamento di tutti i Core
        } else {
            addFolder(); // Fallback se il browser omette il path
        }
    }
});

// --- ESPANSIONE NOTIFICA INFERIORE (Widget) ---
scannerWidget.addEventListener('click', () => {
    scannerWidget.classList.toggle('expanded');
});

// --- LISTENERS BASE ---
if(btnMobileMenu) btnMobileMenu.addEventListener("click", () => { sidebar.classList.add("open"); mobileOverlay.classList.add("active"); btnMobileMenu.classList.add("hidden-by-sidebar"); });
if(mobileOverlay) mobileOverlay.addEventListener("click", () => { sidebar.classList.remove("open"); mobileOverlay.classList.remove("active"); btnMobileMenu.classList.remove("hidden-by-sidebar"); });
if(document.getElementById("btn-add-folder")) document.getElementById("btn-add-folder").addEventListener("click", () => { addFolder(); sidebar.classList.remove("open"); mobileOverlay.classList.remove("active"); btnMobileMenu.classList.remove("hidden-by-sidebar");});
if(document.getElementById("btn-stop")) document.getElementById("btn-stop").addEventListener("click", stopAll);
if(document.getElementById("btn-toggle-play")) document.getElementById("btn-toggle-play").addEventListener("click", togglePlayPause);
if(document.getElementById("btn-delete-core")) document.getElementById("btn-delete-core").addEventListener("click", deleteActiveCore);
if(document.getElementById("btn-db-viewer")) document.getElementById("btn-db-viewer").addEventListener("click", window.openDbViewer);

updateTutorialUI();