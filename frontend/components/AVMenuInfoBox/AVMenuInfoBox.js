// frontend/components/AVMenuInfoBox/AVMenuInfoBox.js
export class AVMenuInfoBox {
    constructor(config = {}) {
        this.title = config.title || 'Informazioni';
        this.icon = config.icon || 'fa-solid fa-circle-info';
        this.contentHTML = config.contentHTML || '';
        this.styles = config.styles || {};
        this.element = this._createDOM();
    }
    _createDOM() {
        const el = document.createElement('div');
        el.className = 'av-menu-infobox';

        if(this.styles.bg) el.style.setProperty('--ib-bg', this.styles.bg);
        if(this.styles.border) el.style.setProperty('--ib-border', this.styles.border);

        el.innerHTML = `
            <div class="av-menu-infobox__header">
                <i class="${this.icon}"></i><span>${this.title}</span>
            </div>
            <div class="av-menu-infobox__content">${this.contentHTML}</div>
        `;
        return el;
    }
    updateContent(html) {
        this.contentHTML = html;
        const contentArea = this.element.querySelector('.av-menu-infobox__content');
        if (contentArea) contentArea.innerHTML = html;
    }
    getNode() { return this.element; }
}