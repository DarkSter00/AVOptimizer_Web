// frontend/components/AVNotificationCenter/AVNotificationCenter.js

export const NotificationDB = {
    records: [],
    log: function(id, type, title, message) {
        const lastIndex = this.records.findLastIndex(r => r.id === id);
        if (lastIndex !== -1) {
            this.records[lastIndex].title = title;
            this.records[lastIndex].message = message;
            this.records[lastIndex].type = type;
            this.records[lastIndex].time = new Date();
        } else {
            this.records.push({ id, type, title, message, time: new Date() });
        }
    },
    getHistory: function() { return this.records; }
};

export class AVNotificationCenter {
    constructor(config = {}) {
        if (AVNotificationCenter.instance) return AVNotificationCenter.instance;
        AVNotificationCenter.instance = this;

        this.notifications = new Map();
        this.currentId = null;

        this.isTall = false;
        this.isContentVisible = false;
        this.historyMode = false;
        this.historyIndex = 0;

        this._initDOM();
    }

    _initDOM() {
        this.container = document.createElement('div');
        this.container.className = 'av-nc-wrapper';
        this.container.innerHTML = `
            <div class="av-nc-sidebar" id="av-nc-sidebar">
                <div class="av-nc-sidebar__bg" id="av-nc-side-bg"></div>
                
                <div class="av-nc-sidebar-buttons">
                    <button class="av-nc-btn btn-history-toggle" id="btn-nc-history" title="Sfoglia Cronologia"><i class="fa-solid fa-clock-rotate-left"></i></button>
                    <button class="av-nc-btn btn-nc-minimize is-collapsed" id="btn-nc-minimize" title="Nascondi / Mostra Testo"><i class="fa-solid fa-chevron-left"></i></button>
                </div>
                
                <div class="av-nc-bell-btn" id="btn-nc-bell" title="Chiudi a icona / Apri">
                    <svg class="av-nc-circle-prog" viewBox="0 0 44 44">
                        <circle class="av-nc-circle-bg" cx="22" cy="22" r="20"></circle>
                        <circle class="av-nc-circle-fill" id="av-nc-ring-fill" cx="22" cy="22" r="20"></circle>
                    </svg>
                    <i class="fa-solid fa-bell av-nc-icon-status" id="av-nc-side-icon"></i>
                </div>
            </div>
            
            <div class="av-nc-content-area" id="av-nc-content">
                <div class="av-nc-current" id="av-nc-current"></div>
                <div class="av-nc-history" id="av-nc-history"></div>
            </div>
        `;
        document.body.appendChild(this.container);

        // BINDING HOVER SULLA SIDEBAR
        const sidebar = this.container.querySelector('#av-nc-sidebar');
        sidebar.addEventListener('mouseenter', () => {
            if (!this.isTall) this.setTall(true);
        });

        sidebar.addEventListener('mouseleave', () => {
            if (!this.isContentVisible) {
                this.setTall(false);
            }
        });

        // BINDING CLICK (PULITI E SINGOLI)
        this.container.querySelector('#btn-nc-minimize').addEventListener('click', () => {
            if (this.historyMode) this.toggleHistory(); // Esce dallo storico se riduciamo
            this.setContentVisible(!this.isContentVisible);
        });

        this.container.querySelector('#btn-nc-bell').addEventListener('click', () => {
            if (!this.isTall) {
                this.setTall(true);
                if (this.currentId || this.historyMode) setTimeout(() => this.setContentVisible(true), 300);
            } else {
                this.minimizeToCircle();
            }
        });

        this.container.querySelector('#btn-nc-history').addEventListener('click', () => this.toggleHistory());
    }

    addNotification(notifInstance) {
        NotificationDB.log(notifInstance.id, notifInstance.type, notifInstance.title, notifInstance.message);

        // Se arriva una notifica mentre si guarda lo storico, usciamo per mostrarla
        if (this.historyMode) this.toggleHistory();

        this.notifications.set(notifInstance.id, notifInstance);
        const currentSlot = this.container.querySelector('#av-nc-current');

        this.currentId = notifInstance.id;
        currentSlot.innerHTML = '';
        currentSlot.appendChild(notifInstance.getNode());
        currentSlot.classList.add('is-active'); // Mostra il box corrente

        if (!this.isTall) {
            this.setTall(true);
            setTimeout(() => { if (!this.isContentVisible) this.setContentVisible(true); }, 300);
        } else if (!this.isContentVisible && notifInstance.type === 'error') {
            this.setContentVisible(true);
        }

        this._syncSidebar();
    }

    updateNotification(id, payload = {}) {
        const notif = this.notifications.get(id);
        if (!notif) return;
        notif.update(payload);

        NotificationDB.log(notif.id, notif.type, notif.title, notif.message);

        // Se lo stiamo guardando nello storico, aggiorna la UI in real-time
        if (this.historyMode && NotificationDB.records[this.historyIndex]?.id === id) {
            this.renderHistoryViewer();
        }

        if (id === this.currentId) this._syncSidebar();
    }

    removeNotification(id) {
        const notif = this.notifications.get(id);
        if (notif) {
            const node = notif.getNode();
            node.style.opacity = '0';
            setTimeout(() => {
                if (node.parentElement) node.parentElement.removeChild(node);
                this.notifications.delete(id);
                if (id === this.currentId) {
                    this.currentId = null;
                    this._syncSidebar();
                }
                if (this.notifications.size === 0 && !this.historyMode) this.minimizeToCircle();
            }, 300);
        }
    }

    minimizeToCircle() {
        if (!this.isTall && !this.isContentVisible) return;

        if (this.historyMode) {
            this.historyMode = false;
            this.container.querySelector('#btn-nc-history').classList.remove('is-active');
            this.container.querySelector('#av-nc-history').classList.remove('is-active');
            if (this.currentId) this.container.querySelector('#av-nc-current').classList.add('is-active');
        }

        this.setContentVisible(false);
        setTimeout(() => this.setTall(false), 350);
    }

    setTall(state) {
        this.isTall = state;
        const sidebar = this.container.querySelector('#av-nc-sidebar');
        if (state) sidebar.classList.add('is-tall');
        else sidebar.classList.remove('is-tall');
    }

    setContentVisible(state) {
        this.isContentVisible = state;
        const content = this.container.querySelector('#av-nc-content');
        const btnMin = this.container.querySelector('#btn-nc-minimize');
        if (state) {
            content.classList.add('is-expanded');
            btnMin.classList.remove('is-collapsed');
        } else {
            content.classList.remove('is-expanded');
            btnMin.classList.add('is-collapsed');
        }
    }

    // ==========================================
    // MOTORE CRONOLOGIA A SCORRIMENTO (CAROUSEL)
    // ==========================================
    toggleHistory() {
        const records = NotificationDB.getHistory();
        if (records.length === 0) {
            this.showEmptyHistoryAlert();
            return;
        }

        this.historyMode = !this.historyMode;
        const btn = this.container.querySelector('#btn-nc-history');
        const histSlot = this.container.querySelector('#av-nc-history');
        const currSlot = this.container.querySelector('#av-nc-current');

        if (this.historyMode) {
            btn.classList.add('is-active');
            this.historyIndex = records.length - 1; // Parte dalla notifica più recente
            this.renderHistoryViewer();

            currSlot.classList.remove('is-active');
            histSlot.classList.add('is-active');

            if (!this.isTall) this.setTall(true);
            if (!this.isContentVisible) this.setContentVisible(true);
        } else {
            btn.classList.remove('is-active');
            histSlot.classList.remove('is-active');

            if (this.currentId) currSlot.classList.add('is-active');
            else this.minimizeToCircle();
        }
    }

    renderHistoryViewer() {
        const records = NotificationDB.getHistory();
        if (records.length === 0) return;

        const record = records[this.historyIndex];
        const histContainer = this.container.querySelector('#av-nc-history');

        let color = 'var(--warning)', icon = 'fa-solid fa-circle-info';
        if(record.type === 'error') { color = 'var(--danger)'; icon = 'fa-solid fa-triangle-exclamation'; }
        if(record.type === 'building') { color = 'var(--primary)'; icon = 'fa-solid fa-hammer'; }
        if(record.type === 'info' && record.title.toLowerCase().includes('completat')) { color = 'var(--success)'; icon = 'fa-solid fa-check'; }

        const timeStr = record.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second:'2-digit' });

        // Struttura HTML simile alla card AVNotification
        histContainer.innerHTML = `
            <div class="av-nc-history-viewer" style="--notif-color: ${color}">
                <div class="av-notif-header" style="margin-bottom: 5px;">
                    <div class="av-notif-pill" style="--notif-color: var(--text-muted); background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1);">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                        <span class="av-notif-title-text">Cronologia</span>
                    </div>
                    <div class="hi-nav">
                        <button class="av-nc-btn" id="hi-prev" ${this.historyIndex === 0 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
                        <span class="hi-counter">${this.historyIndex + 1} / ${records.length}</span>
                        <button class="av-nc-btn" id="hi-next" ${this.historyIndex === records.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </div>
                
                <div class="hi-record-header">
                    <i class="hi-record-icon ${icon}" style="color: ${color}"></i>
                    <span class="hi-record-title">${record.title}</span>
                    <span class="hi-record-time">${timeStr}</span>
                </div>
                <div class="hi-record-body" title="${record.message}">${record.message}</div>
            </div>
        `;

        histContainer.querySelector('#hi-prev').addEventListener('click', () => {
            if (this.historyIndex > 0) { this.historyIndex--; this.renderHistoryViewer(); }
        });

        histContainer.querySelector('#hi-next').addEventListener('click', () => {
            if (this.historyIndex < records.length - 1) { this.historyIndex++; this.renderHistoryViewer(); }
        });
    }

    showEmptyHistoryAlert() {
        const existing = this.container.querySelector('.av-nc-empty-alert');
        if (existing) existing.remove();
        const alert = document.createElement('div');
        alert.className = 'av-nc-empty-alert';
        alert.innerHTML = '<i class="fa-solid fa-info-circle"></i> Nessuna notifica registrata';
        this.container.appendChild(alert);
        setTimeout(() => { if (alert.parentElement) alert.remove(); }, 2500);
    }

    _syncSidebar() {
        const bg = this.container.querySelector('#av-nc-side-bg');
        const icon = this.container.querySelector('#av-nc-side-icon');
        const ringFill = this.container.querySelector('#av-nc-ring-fill');

        if (!this.currentId) {
            bg.style.height = '0%';
            if (ringFill) ringFill.style.strokeDashoffset = '126';
            icon.className = 'fa-solid fa-bell av-nc-icon-status';
            icon.style.color = 'var(--text-muted)';
            this.container.style.setProperty('--nc-active-color', 'var(--text-muted)');
            return;
        }

        const notif = this.notifications.get(this.currentId);
        const prog = notif.progress || 0;

        bg.style.height = `${prog}%`;
        if (ringFill) ringFill.style.strokeDashoffset = 126 - (prog / 100) * 126;

        this.container.style.setProperty('--nc-active-color', notif.currentColor);
        icon.className = `av-nc-icon-status ${notif.currentIcon}`;
        icon.style.color = notif.currentColor;
    }
}