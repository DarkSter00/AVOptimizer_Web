// frontend/components/AVFolder/AVFolder.js

export class AVFolder {
    constructor(config = {}) {
        this.id = config.id;
        this.status = config.status || 'default';

        // Sezioni completamente configurabili dall'esterno
        this.headerConfig = config.header || { items: [], gap: '10px' };
        this.midderConfig = config.midder || { items: [] };
        this.footerConfig = config.footer || { items: [] };

        this.states = config.states || {};

        this.isMidderOpen = false;

        this.element = this._createDOM();
        this.updateState(this.status);
    }

    _createDOM() {
        const el = document.createElement('div');
        el.className = 'av-folder-card';
        if (this.id) el.id = this.id;

        // 1. HEADER (Accetta AVButton, AVTitleBox o nodi generici)
        const header = document.createElement('div');
        header.className = 'av-folder-header';
        header.style.gap = this.headerConfig.gap || '10px';

        if (this.headerConfig.items && this.headerConfig.items.length > 0) {
            this.headerConfig.items.forEach(item => {
                if (item && typeof item.getNode === 'function') {
                    header.appendChild(item.getNode());
                } else if (item instanceof Node) {
                    header.appendChild(item);
                }
            });
        }

        // 2. MIDDER (Per AVFile e AVProcess futuri)
        this.midder = document.createElement('div');
        this.midder.className = 'av-folder-midder';
        this.midderContent = document.createElement('div');
        this.midderContent.className = 'av-folder-midder-content';

        if (this.midderConfig.items && this.midderConfig.items.length > 0) {
            this.midderConfig.items.forEach(item => {
                if (item && typeof item.getNode === 'function') {
                    this.midderContent.appendChild(item.getNode());
                } else if (item instanceof Node) {
                    this.midderContent.appendChild(item);
                }
            });
        } else {
            this.midderContent.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted);">[Midder Vuoto - In attesa di AVFile]</div>`;
        }
        this.midder.appendChild(this.midderContent);

        // 3. FOOTER (Per AVTabMenu futuro)
        this.footer = document.createElement('div');
        this.footer.className = 'av-folder-footer';

        if (this.footerConfig.items && this.footerConfig.items.length > 0) {
            this.footerConfig.items.forEach(item => {
                if (item && typeof item.getNode === 'function') {
                    this.footer.appendChild(item.getNode());
                } else if (item instanceof Node) {
                    this.footer.appendChild(item);
                }
            });
        } else {
            this.footer.innerHTML = `<span style="color: var(--text-muted); font-size: 12px;">[Footer Vuoto - In attesa di AVTabMenu]</span>`;
        }

        // Overlay Fisso per messaggi di sistema (es. "Spostamento in corso")
        const overlay = document.createElement('div');
        overlay.className = 'card-status-overlay';
        overlay.id = `overlay-${this.id}`;
        overlay.innerHTML = `
            <i class="card-status-icon" id="overlay-icon-${this.id}"></i>
            <div class="card-status-title" id="overlay-title-${this.id}"></div>
            <div class="card-status-subtitle"><i class="fa-solid fa-arrows-up-down"></i> Spostamento in corso...</div>
        `;

        // Ring (Cerchio di caricamento in bg)
        const ring = document.createElement('div');
        ring.className = 'ring-main';
        ring.id = `ring-main-${this.id}`;

        el.appendChild(ring);
        el.appendChild(overlay);
        el.appendChild(header);
        el.appendChild(this.midder);
        el.appendChild(this.footer);

        return el;
    }

    toggleMidder() {
        this.isMidderOpen = !this.isMidderOpen;
        if (this.isMidderOpen) {
            this.midder.classList.add('is-open');
        } else {
            this.midder.classList.remove('is-open');
        }
    }

    // Motore di renderizzazione degli stili dinamico (Framework pattern)
    updateState(newStatus) {
        this.status = newStatus;

        const defaultStyles = (this.states['default'] && this.states['default'].styles) ? this.states['default'].styles : {};
        const activeStyles = (this.states[this.status] && this.states[this.status].styles) ? this.states[this.status].styles : {};

        // Unisce lo stile di default a quello attivo (le proprietà dello stato attivo sovrascrivono il default)
        const mergedStyles = { ...defaultStyles, ...activeStyles };

        if (mergedStyles.border) this.element.style.setProperty('--fld-border', mergedStyles.border);
        if (mergedStyles.bg) this.element.style.setProperty('--fld-bg', mergedStyles.bg);
        if (mergedStyles.shadow) this.element.style.setProperty('--fld-shadow', mergedStyles.shadow);
        if (mergedStyles.opacity) this.element.style.setProperty('--fld-opacity', mergedStyles.opacity);
        if (mergedStyles.filter) this.element.style.setProperty('--fld-filter', mergedStyles.filter);
    }

    getNode() { return this.element; }
}