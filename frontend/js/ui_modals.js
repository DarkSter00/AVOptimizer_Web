function renderMorphContent(safeId, subData, category) {
    const content = document.getElementById(`morph-content-${safeId}`);
    if (!content) return;
    let itemsHtml = '<ul class="error-list" style="margin-top: 5px;">';
    let count = 0; let borderClass = ""; let bgItemClass = "";

    if (category === 'error') { borderClass = "var(--danger)"; bgItemClass = "rgba(0,0,0,0.4)"; }
    else if (category === 'completed') { borderClass = "var(--success)"; bgItemClass = "rgba(0,0,0,0.4)"; }
    else if (category === 'skipped') { borderClass = "var(--cyan)"; bgItemClass = "rgba(0,0,0,0.4)"; }
    else if (category === 'analyzed_waiting') { borderClass = "var(--purple)"; bgItemClass = "rgba(0,0,0,0.4)"; }

    for (const [fname, state] of Object.entries(subData.files)) {
        let match = false;
        if (category === 'completed' && state.status.startsWith('completed')) match = true; else if (state.status === category) match = true;
        if (match) {
            count++;
            itemsHtml += `<li class="error-item" style="background: ${bgItemClass}; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 5px; padding: 8px 12px; border-left-color: ${borderClass};"><span class="error-item-name" style="font-size:12px; color: #fff;">${fname}</span></li>`;
        }
    }
    itemsHtml += '</ul>';
    if (count === 0) itemsHtml = `<div style="text-align:center; padding: 15px; color: var(--text-muted); font-size: 13px;">Nessun file presente in questa categoria.</div>`;
    content.innerHTML = itemsHtml;
}

window.openModal = function(type) {
    const modal = document.getElementById("data-modal"); if (!modal) return;
    const modalTitle = document.getElementById("modal-title"); const modalBody = document.getElementById("modal-body");
    if (type === 'errors') {
        modalTitle.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Gestione Errori Globali Attuali';
        let html = `<p style="margin-bottom: 15px;">File andati in errore in tutte le cartelle:</p>`; let hasErrors = false; let errorListHtml = `<ul class="error-list">`;
        if (lastMetrics && lastMetrics.cores) {
            for (const [core, subs] of Object.entries(lastMetrics.cores)) {
                for (const [sub, data] of Object.entries(subs)) {
                    for (const [fname, state] of Object.entries(data.files)) {
                        if (state.status === 'error') { hasErrors = true; errorListHtml += `<li class="error-item"><div><div class="error-item-name">${fname}</div><div class="error-item-path">${sub.split(/[\\/]/).pop()}</div></div><span class="badge badge-danger">ERRORE</span></li>`; }
                    }
                }
            }
        }
        errorListHtml += `</ul>`;
        if (hasErrors) { html += errorListHtml; html += `<div style="margin-top:25px; text-align:right;"><button class="btn btn-warning pulse-warning" onclick="retryErrors()"><i class="fa-solid fa-rotate-right"></i> Riprova Tutti gli Errori Globali</button></div>`; }
        else { html = `<div style="text-align:center; padding: 30px;"><span style="font-size:40px">🎉</span><p style="color:var(--success); font-size: 16px; margin-top: 15px;">Nessun errore rilevato in questa sessione!</p></div>`; }
        modalBody.innerHTML = html;
    } else { modalTitle.innerText = "Dettagli"; modalBody.innerHTML = "<p>Nessun dettaglio disponibile.</p>"; }
    modal.classList.remove("hidden");
}

window.openFolderErrors = function(coreName, subName) {
    const modal = document.getElementById("data-modal"); const modalTitle = document.getElementById("modal-title"); const modalBody = document.getElementById("modal-body");
    modalTitle.innerHTML = `<span style="color:var(--danger)"><i class="fa-solid fa-triangle-exclamation"></i> Errori in:</span> <span style="font-size:12px; color:var(--text-muted)">${subName.split(/[\\/]/).pop()}</span>`;
    let html = ``; let hasErrors = false; let errorListHtml = `<ul class="error-list">`;
    if (lastMetrics && lastMetrics.cores && lastMetrics.cores[coreName] && lastMetrics.cores[coreName][subName]) {
        const subData = lastMetrics.cores[coreName][subName];
        for (const [fname, state] of Object.entries(subData.files)) {
            if (state.status === 'error') { hasErrors = true; errorListHtml += `<li class="error-item"><span class="error-item-name">${fname}</span><span class="badge badge-danger">ERRORE</span></li>`; }
        }
    }
    errorListHtml += `</ul>`;
    if (hasErrors) { html += errorListHtml; html += `<div style="margin-top:25px; text-align:right;"><button class="btn btn-warning pulse-warning" onclick="retryErrors()"><i class="fa-solid fa-rotate-right"></i> Riprova Tutti gli Errori Globali</button></div>`; }
    else { html = `<div style="text-align:center; padding: 30px;"><span style="font-size:40px">🎉</span><p style="color:var(--success); font-size: 16px; margin-top: 15px;">Nessun errore in questa cartella!</p></div>`; }
    modalBody.innerHTML = html; modal.classList.remove("hidden");
}

window.closeModal = function() { const modal = document.getElementById("data-modal"); if (modal) modal.classList.add("hidden"); };