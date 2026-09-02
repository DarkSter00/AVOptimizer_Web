window.getFolderHeaderHTML = function(shortName, safeTitle, escapedSubPath, safeId) {
    return `
        <div class="card-header">
            <div class="card-title-row">
                
                <!-- Tasto Sinistro (Apri) -->
                <div class="folder-header-btn left-btn" onclick="window.handleFolderOpenClick(event, this, '${escapedSubPath}')" onmouseleave="window.handleHeaderMouseLeave(this)" title="Apri cartella nel sistema">
                    <div class="btn-icon-circle"><i class="fa-solid fa-folder-open"></i></div>
                    <div class="btn-text-wrapper">
                        <span class="btn-text normal-text">Apri cartella</span>
                        <span class="btn-text confirm-text"><i class="fa-solid fa-check"></i> Sicuro?</span>
                    </div>
                </div>

                <!-- Pillola Centrale (Titolo + Status) -->
                <div class="clickable-header-box" onclick="toggleCard('${escapedSubPath}', '${safeId}')" title="Espandi / Riduci" onmouseenter="window.startTitleHoverScroll(this)" onmouseleave="window.stopTitleHoverScroll(this)">
                    <div class="card-title-text-wrapper">
                        <span class="card-title-text" title="${safeTitle}">${shortName}</span>
                    </div>
                    <span class="status-badge" id="badge-${safeId}">ATTESA</span>
                </div>

                <!-- Tasto Destro (Escludi/Includi) -->
                <div class="folder-header-btn right-btn btn-exclude-action" id="btn-exclude-${safeId}" onclick="window.handleExcludeClick(event, this)" onmouseleave="window.handleHeaderMouseLeave(this)" title="Escludi / Includi Cartella">
                    <div class="btn-text-wrapper">
                        <span class="btn-text normal-text" id="btn-exclude-text-${safeId}">Escludi cartella</span>
                        <span class="btn-text confirm-text">Sicuro? <i class="fa-solid fa-check"></i></span>
                    </div>
                    <div class="btn-icon-circle" id="btn-exclude-icon-${safeId}"><i class="fa-solid fa-ban"></i></div>
                </div>

            </div>
        </div>
    `;
};

window.handleFolderOpenClick = function(event, btn, path) {
    event.stopPropagation();

    if (btn.classList.contains('confirm-state')) {
        btn.classList.remove('confirm-state');
        clearTimeout(btn.confirmTimeout);
        openSystemFolder(path);
    } else {
        btn.classList.add('confirm-state');
        btn.confirmTimeout = setTimeout(() => {
            btn.classList.remove('confirm-state');
        }, 3000);
    }
};

window.handleExcludeClick = function(event, btn) {
    if (btn.classList.contains('confirm-state')) {
        btn.classList.remove('confirm-state');
        clearTimeout(btn.confirmTimeout);
        // Si lascia propagare verso l'evento originale in api.js
    } else {
        event.stopImmediatePropagation();
        btn.classList.add('confirm-state');

        btn.confirmTimeout = setTimeout(() => {
            btn.classList.remove('confirm-state');
        }, 3000);
    }
};

window.handleHeaderMouseLeave = function(btn) {
    // Chiude all'istante la conferma se il cursore abbandona l'area
    if (btn.classList.contains('confirm-state')) {
        btn.classList.remove('confirm-state');
        clearTimeout(btn.confirmTimeout);
    }
};

window.startTitleHoverScroll = function(wrapper) {
    const nameEl = wrapper.querySelector('.card-title-text');
    if (!nameEl) return;
    nameEl.isHovering = true;
    clearTimeout(nameEl.restoreTimer); clearTimeout(nameEl.scrollTimeout); clearTimeout(nameEl.pauseTimeout);

    if (nameEl.scrollWidth > nameEl.clientWidth) {
        const overflow = nameEl.scrollWidth - nameEl.clientWidth;
        nameEl.style.textOverflow = 'clip';
        nameEl.style.width = 'max-content';
        const duration = Math.max(overflow * 20, 1000);
        let isAtEnd = false;

        function animate() {
            if (!nameEl.isHovering) return;
            nameEl.style.transition = `transform ${duration}ms linear`;
            nameEl.style.transform = `translateX(${isAtEnd ? 0 : -(overflow + 5)}px)`;
            nameEl.scrollTimeout = setTimeout(() => {
                isAtEnd = !isAtEnd;
                if (nameEl.isHovering) nameEl.pauseTimeout = setTimeout(animate, 2000);
            }, duration);
        }
        nameEl.pauseTimeout = setTimeout(animate, 1000);
    }
};

window.stopTitleHoverScroll = function(wrapper) {
    const nameEl = wrapper.querySelector('.card-title-text');
    if (!nameEl) return;
    nameEl.isHovering = false;
    clearTimeout(nameEl.scrollTimeout); clearTimeout(nameEl.pauseTimeout);

    if (nameEl.style.width === 'max-content') {
        nameEl.style.transition = 'transform 0.4s ease';
        nameEl.style.transform = 'translateX(0)';
        nameEl.restoreTimer = setTimeout(() => {
            nameEl.style.textOverflow = 'ellipsis';
            nameEl.style.width = '100%';
        }, 400);
    }
};