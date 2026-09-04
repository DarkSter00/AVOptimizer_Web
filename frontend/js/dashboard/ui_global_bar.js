// frontend/js/dashboard/ui_global_bar.js

export class AVDashboardGlobalBar {
    constructor(config) {
        this.container = document.getElementById(config.containerId);
        if (!this.container) return;

        // Parametri Strutturali e di Stile (Completamente Customizzabili)
        this.height = config.height || '64px';
        this.padding = config.padding || '0 12px';
        this.gap = config.gap || '24px';
        this.innerGap = config.innerGap || '12px';

        // Colori e Bordi
        this.bg = config.bg || 'rgba(255, 255, 255, 0.03)';
        this.border = config.border || '1px solid rgba(255, 255, 255, 0.08)';
        this.radius = config.radius || '32px';
        this.shadow = config.shadow || 'none';
        this.compactWidth = config.compactWidth || '220px';

        this.leftItems = config.leftItems || [];
        this.centerItems = config.centerItems || [];
        this.rightItems = config.rightItems || [];

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
        this.inner.style.setProperty('--gb-height', this.height);
        this.inner.style.setProperty('--gb-padding', this.padding);
        this.inner.style.setProperty('--gb-gap', this.gap);
        this.inner.style.setProperty('--gb-inner-gap', this.innerGap);
        this.inner.style.setProperty('--gb-bg', this.bg);
        this.inner.style.setProperty('--gb-border', this.border);
        this.inner.style.setProperty('--gb-radius', this.radius);
        this.inner.style.setProperty('--gb-shadow', this.shadow);
        this.inner.style.setProperty('--gb-compact-width', this.compactWidth);
    }

    _renderItems() {
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

        appendItems(this.leftZone, this.leftItems);
        appendItems(this.centerZone, this.centerItems);
        appendItems(this.rightZone, this.rightItems);
    }

    setExpanded(isExpanded) {
        this.isExpanded = isExpanded;
        if (!this.inner) return;

        if (isExpanded) {
            this.inner.classList.add('is-expanded');
        } else {
            this.inner.classList.remove('is-expanded');
        }
    }
}