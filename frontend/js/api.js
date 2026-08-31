const ws = new WebSocket(WS_URL);
ws.onopen = () => console.log("Connesso al motore Python tramite WebSocket!");
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "metrics") {
        lastMetrics = message.data;
        updateDashboard(lastMetrics);

        if (!isBuildingCanvas) {
            const now = Date.now();
            if (now - lastRenderTime > 200 || !lastMetrics.global.is_scanning) {
                clearTimeout(renderTimeout);
                lastRenderTime = now;
                requestAnimationFrame(() => renderCanvas(lastMetrics));
            } else {
                clearTimeout(renderTimeout);
                renderTimeout = setTimeout(() => {
                    lastRenderTime = Date.now();
                    requestAnimationFrame(() => renderCanvas(lastMetrics));
                }, 200);
            }
        }
    } else if (message.type === "progress") {
        requestAnimationFrame(() => updateProgress(message.data));
    }
};

window.openSystemFolder = async function(path) {
    try {
        await fetch(`${API_URL}/open_folder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: path })
        });
    } catch (e) {}
};

window.toggleFolderExclusion = async function(coreName, subName, safeId) {
    const btn = document.getElementById(`btn-exclude-${safeId}`);
    const card = document.getElementById(safeId);
    if(!btn || !card) return;

    btn.style.pointerEvents = 'none';
    const isExcluded = btn.textContent === "▶";

    if (isExcluded) {
        btn.className = "btn-mini btn-mini-danger btn-exclude-action";
        btn.textContent = "🚫";
        card.classList.remove("folder-excluded");
        const innerCard = document.getElementById(`inner-${safeId}`);
        if(innerCard) innerCard.style.backgroundColor = "var(--bg-card)";
    } else {
        btn.className = "btn-mini btn-mini-success btn-exclude-action";
        btn.textContent = "▶";
        card.classList.add("folder-excluded");
        const innerCard = document.getElementById(`inner-${safeId}`);
        if(innerCard) innerCard.style.backgroundColor = "rgba(25, 25, 30, 0.5)";
        const badgeEl = document.getElementById(`badge-${safeId}`);
        if(badgeEl) { badgeEl.style.backgroundColor = "transparent"; badgeEl.style.borderColor = "#555"; badgeEl.style.color = "#888"; badgeEl.textContent = "ESCLUSA"; }
        userOpenedCards.delete(subName);
        expandedCards.delete(subName);
    }

    const endpoint = isExcluded ? "/include_target" : "/exclude_target";
    setTimeout(async () => {
        try {
            await fetch(`${API_URL}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ core_name: coreName, sub_name: subName }) });
        } catch(e) {}
        btn.style.pointerEvents = 'auto';
    }, 600);
};

window.retryErrors = async function() {
    try {
        await fetch(`${API_URL}/retry_errors`, { method: "POST" });
        closeModal();
    } catch(e) {}
};

window.openDbViewer = async function() {
    const modal = document.getElementById("data-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
    const modalBody = document.getElementById("modal-body");
    modalBody.innerHTML = `<p>Caricamento database...</p>`;
    document.getElementById("modal-title").innerText = "🗄️ Database Storico";

    try {
        const res = await fetch(`${API_URL}/db/records`);
        const data = await res.json();

        if (!data.records || data.records.length === 0) {
            modalBody.innerHTML = `<p>Nessun record presente nel Database.</p>`;
            return;
        }

        let html = `
            <div style="margin-bottom: 15px; display: flex; justify-content: flex-end;">
                <button class="btn btn-outline-danger" onclick="clearAllDb()">✖ Cancella Tutto</button>
            </div>
            <table class="db-table">
                <thead><tr><th>File</th><th>Data Completamento</th><th>Azione</th></tr></thead>
                <tbody>
        `;
        data.records.forEach(r => {
            const fName = r.file_path.split(/[\\/]/).pop();
            const fDate = new Date(r.date).toLocaleString();
            html += `
                <tr>
                    <td><strong>${fName}</strong></td>
                    <td>${fDate}</td>
                    <td><button class="btn-mini btn-mini-danger" title="Rimuovi" onclick="deleteDbRecord('${r.pseudo_hash}')">✖</button></td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        modalBody.innerHTML = html;
    } catch(e) {
        modalBody.innerHTML = `<p style="color:red;">Errore caricamento database.</p>`;
    }
};

window.deleteDbRecord = async function(hash) {
    if(!confirm("Cancellare il record dal DB?")) return;
    try {
        await fetch(`${API_URL}/db/delete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pseudo_hash: hash }) });
        openDbViewer();
    } catch(e) {}
};

window.clearAllDb = async function() {
    if(!confirm("Svuotare l'intero database?")) return;
    try {
        await fetch(`${API_URL}/db/clear_all`, { method: "POST" });
        openDbViewer();
    } catch(e) {}
};

async function addFolder() {
    try {
        const browseRes = await fetch(`${API_URL}/browse`);
        const browseData = await browseRes.json();
        if (browseData.folder) {
            const forceCheckbox = document.getElementById("chk-force-rescan");
            const forceRescan = forceCheckbox ? forceCheckbox.checked : false;
            await fetch(`${API_URL}/scan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ directory: browseData.folder, force_rescan: forceRescan })
            });
        }
    } catch (error) {}
}

async function deleteActiveCore() {
    if (currentCoreIndex >= 0 && currentCoreIndex < coreList.length) {
        try { await fetch(`${API_URL}/delete_core`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ directory: coreList[currentCoreIndex] }) }); }
        catch (error) {}
    }
}

async function togglePlayPause() {
    try {
        const res = await fetch(`${API_URL}/toggle_pause`, { method: "POST" });
        const data = await res.json();
        isPaused = data.status === "paused";
        updateTutorialUI();
    } catch (error) {}
}

async function stopAll() {
    await fetch(`${API_URL}/stop`, { method: "POST" });
    isPaused = true;
    if(canvasArea) canvasArea.innerHTML = "";
    if(topNavbar) topNavbar.style.display = "none";
    coreList = []; fileEtaCache = {}; folderEtaCache = {}; expandedCards.clear(); userOpenedCards.clear();
    currentCoreIndex = -1;
    lastMetrics = null;
    updateTutorialUI();
}