// frontend/components/dashboard/AVDashboardGlobalBar/AVDashboardGlobalBar.js

export class AVDashboardGlobalBar {
    constructor(config) {
        // Parametri Strutturali e di Stile (con valori di default)
        this.height = config.height || '64px';
        this.padding = config.padding || '0 12px';
        this.gap = config.gap || '16px';
        this.innerGap = config.innerGap || '12px';
        this.bg = config.bg || 'var(--bg-surface, rgba(255, 255, 255, 0.05))';
        this.border = config.border || '1px solid var(--border, rgba(255, 255, 255, 0.1))';
        this.radius = config.radius || '32px';
        this.compactWidth = config.compactWidth || '220px'; // Larghezza da chiusa

        // Contenuti passati dal parent
        this.leftItems = config.leftItems || [];
        this.centerItems = config.centerItems || [];
        this.rightItems = config.rightItems || [];

        // Stato interno
        this.isExpanded = config.expanded || false;

        this.element = this._createDOM();
        this._applyStyles();
        this._renderItems();

        if (this.isExpanded) this.setExpanded(true);
    }

    _createDOM() {
        const bar = document.createElement('div');
        bar.className = 'av-global-bar';
        bar.innerHTML = `
            <div class="av-global-bar__left"></div>
            <div class="av-global-bar__center"></div>
            <div class="av-global-bar__right"></div>
        `;
        return bar;
    }

    _applyStyles() {
        this.element.style.setProperty('--gb-height', this.height);
        this.element.style.setProperty('--gb-padding', this.padding);
        this.element.style.setProperty('--gb-gap', this.gap);
        this.element.style.setProperty('--gb-inner-gap', this.innerGap);
        this.element.style.setProperty('--gb-bg', this.bg);
        this.element.style.setProperty('--gb-border', this.border);
        this.element.style.setProperty('--gb-radius', this.radius);
        this.element.style.setProperty('--gb-compact-width', this.compactWidth);
    }

    _renderItems() {
        const leftZone = this.element.querySelector('.av-global-bar__left');
        const centerZone = this.element.querySelector('.av-global-bar__center');
        const rightZone = this.element.querySelector('.av-global-bar__right');

        // Helper per iniettare elementi (Supporta istanze di componenti o nodi DOM nativi)
        const appendItems = (zone, items) => {
            items.forEach(item => {
                if (!item) return;
                if (typeof item.getNode === 'function') {
                    zone.appendChild(item.getNode());
                } else if (item instanceof Node) {
                    zone.appendChild(item);
                }
            });
        };

        appendItems(leftZone, this.leftItems);
        appendItems(centerZone, this.centerItems);
        appendItems(rightZone, this.rightItems);
    }

    // Metodo pubblico per Allargare/Stringere la barra
    setExpanded(isExpanded) {
        this.isExpanded = isExpanded;
        if (isExpanded) {
            this.element.classList.add('is-expanded');
        } else {
            this.element.classList.remove('is-expanded');
        }
    }

    getNode() {
        return this.element;
    }
}