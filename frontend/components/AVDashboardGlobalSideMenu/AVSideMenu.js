// frontend/components/dashboard/AVSideMenu/AVSideMenu.js

export class AVSideMenu {
    constructor(config = {}) {
        this.containerId = config.containerId || 'av-global-menu';
        this.container = document.getElementById(this.containerId);
        this.title = config.title || "Menu";
        this.backgroundColor = config.backgroundColor || config.bg || 'rgba(255, 255, 255, 0.03)';
        this.zoneStyles = config.zoneStyles || [];
        this.items = config.items || [];
        this.onItemClick = config.onItemClick || (() => {});
        this.onClose = config.onClose || (() => {});
        this.isOpen = false;

        this._initDOM();
    }

    _initDOM() {
        if (!this.container) return;
        this.container.style.background = this.backgroundColor;

        this.container.innerHTML = `
            <div class="av-side-menu-container">
                <div class="av-side-menu-header">
                    <h3 class="av-side-menu-title">${this.title}</h3>
                </div>
                <div class="av-side-menu-body" id="av-side-menu-content-area"></div>
                <div class="av-side-menu-footer" id="av-side-menu-footer-area" style="display: none;"></div>
            </div>
        `;

        const headerArea = this.container.querySelector('.av-side-menu-header');
        const bodyArea = this.container.querySelector('#av-side-menu-content-area');
        const footerArea = this.container.querySelector('#av-side-menu-footer-area');

        // Funzione helper con parametri univoci per evitare ReferenceError
        const applyZoneStyles = (element, styleConfig, prefix) => {
            if (!styleConfig || !element) return;
            if (styleConfig.padding) element.style.setProperty(`--sm-${prefix}-padding`, styleConfig.padding);
            if (styleConfig.margin) element.style.setProperty(`--sm-${prefix}-margin`, styleConfig.margin);
            if (styleConfig.bg) element.style.setProperty(`--sm-${prefix}-bg`, styleConfig.bg);
            if (styleConfig.border) element.style.setProperty(`--sm-${prefix}-border`, styleConfig.border);
            if (styleConfig.gap) element.style.setProperty(`--sm-${prefix}-gap`, styleConfig.gap);
        };

        // Applica gli stili solo se l'oggetto zoneStyles è stato definito nella configurazione
        if (this.zoneStyles) {
            applyZoneStyles(headerArea, this.zoneStyles.top, 'top');
            applyZoneStyles(bodyArea, this.zoneStyles.center, 'center');
            applyZoneStyles(footerArea, this.zoneStyles.bottom, 'bottom');
        }

        this.renderItems(this.items);
    }

    renderItems(items) {
        this.items = items;
        if (!this.container) return;

        // Separiamo logicamente header, body e footer
        const headerArea = this.container.querySelector('.av-side-menu-header');
        const bodyArea = this.container.querySelector('#av-side-menu-content-area');
        const footerArea = this.container.querySelector('#av-side-menu-footer-area');

        if (!bodyArea) return;

        // Pulizia
        headerArea.innerHTML = '';
        bodyArea.innerHTML = '';
        footerArea.innerHTML = '';
        footerArea.style.display = 'none';

        const appendItems = (zone, elementList) => {
            if (!elementList) return;
            elementList.forEach(item => {
                if (typeof item.getNode === 'function') {
                    zone.appendChild(item.getNode());
                } else if (item instanceof Node) {
                    zone.appendChild(item);
                }
            });
        };

        // Supponiamo che config.items sia ora un oggetto con { top: [], center: [], bottom: [] }
        if (Array.isArray(this.items)) {
            // Retrocompatibilità: se è un array semplice, mettiamo tutto nel centro
            appendItems(bodyArea, this.items);
        } else {
            // Nuova struttura modulare
            if (this.items.top && this.items.top.length > 0) {
                appendItems(headerArea, this.items.top);
            }
            if (this.items.center && this.items.center.length > 0) {
                appendItems(bodyArea, this.items.center);
            }
            if (this.items.bottom && this.items.bottom.length > 0) {
                footerArea.style.display = 'block';
                appendItems(footerArea, this.items.bottom);
            }
        }
    }

    open() {
        this.isOpen = true;
        document.body.classList.add('menu-open');
    }

    close() {
        this.isOpen = false;
        document.body.classList.remove('menu-open');
        this.onClose();
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }
}