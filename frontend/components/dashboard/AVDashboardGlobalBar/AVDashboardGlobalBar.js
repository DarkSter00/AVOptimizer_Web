// frontend/components/dashboard/AVDashboardGlobalBar/AVDashboardGlobalBar.js

export class AVDashboardGlobalBar {
    constructor(config) {
        this.container = document.getElementById(config.containerId);
        if (!this.container) return;

        this.height = config.height || '64px';
        this.padding = config.padding || '0 12px';
        this.gap = config.gap || '24px';
        this.innerGap = config.innerGap || '12px';

        this.bg = config.bg || 'rgba(255, 255, 255, 0.03)';
        this.border = config.border || '1px solid rgba(255, 255, 255, 0.08)';
        this.radius = config.radius || '32px';
        this.shadow = config.shadow || 'none';
        this.compactWidth = config.compactWidth || '220px';

        this.leftItems = config.leftItems || [];
        this.centerItems = config.centerItems || [];
        this.rightItems = config.rightItems || [];

        // NUOVA IMPOSTAZIONE: Quali zone possono essere schiacciate dal Flexbox?
        this.squishableZones = config.squishableZones || ['center'];

        this.isExpanded = config.expanded || false;

        this._initDOM();
        this._applyStyles();
        this._renderItems();

        if (this.isExpanded) this.setExpanded(true);
    }

    _initDOM() {
        this.container.innerHTML = `
            <div class="av-global-bar-inner">
                <div class="av-global-bar__left"></div>
                <div class="av-global-bar__center" id="global-bar-center-zone"></div>
                <div class="av-global-bar__right"></div>
            </div>
        `;
        this.inner = this.container.querySelector('.av-global-bar-inner');
        this.leftZone = this.container.querySelector('.av-global-bar__left');
        this.centerZone = this.container.querySelector('.av-global-bar__center');
        this.rightZone = this.container.querySelector('.av-global-bar__right');
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