// frontend/components/AVMenuButton/AVMenuButton.js
export class AVMenuButton {
    constructor(config = {}) {
        this.icon = config.icon || '';
        this.label = config.label || 'Menu Item';
        this.badge = config.badge || '';
        this.isActive = config.isActive || false;
        this.styles = config.styles || {};
        this.onClick = config.onClick || (() => {});
        this.element = this._createDOM();
        this._attachEvents();
    }
    _createDOM() {
        const el = document.createElement('button');
        el.className = 'av-menu-btn';
        if (this.isActive) el.classList.add('is-active');

        if(this.styles.hoverBg) el.style.setProperty('--mb-hover-bg', this.styles.hoverBg);
        if(this.styles.activeBg) el.style.setProperty('--mb-active-bg', this.styles.activeBg);
        if(this.styles.activeColor) el.style.setProperty('--mb-active-color', this.styles.activeColor);
        if(this.styles.activeBorder) el.style.setProperty('--mb-active-border', this.styles.activeBorder);

        el.innerHTML = `
            ${this.icon ? `<i class="av-menu-btn__icon ${this.icon}"></i>` : ''}
            <span class="av-menu-btn__label">${this.label}</span>
            ${this.badge ? `<span class="av-menu-btn__badge">${this.badge}</span>` : ''}
        `;
        return el;
    }
    _attachEvents() { this.element.addEventListener('click', (e) => this.onClick(e, this)); }
    setActive(state) {
        this.isActive = state;
        if (state) this.element.classList.add('is-active');
        else this.element.classList.remove('is-active');
    }
    getNode() { return this.element; }
}