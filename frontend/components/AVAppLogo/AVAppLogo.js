// frontend/components/AVAppLogo/AVAppLogo.js
export class AVAppLogo {
    constructor(config = {}) {
        this.title = config.title || "App Name";
        this.version = config.version || "v1.0.0";
        this.icon = config.icon || "fa-solid fa-cube";
        this.styles = config.styles || {};
        this.element = this._createDOM();
    }
    _createDOM() {
        const el = document.createElement('div');
        el.className = 'av-app-logo';
        // Inietta le variabili CSS personalizzate
        if(this.styles.bg) el.style.setProperty('--logo-bg', this.styles.bg);
        if(this.styles.border) el.style.setProperty('--logo-border', this.styles.border);
        if(this.styles.iconColor) el.style.setProperty('--logo-icon-color', this.styles.iconColor);
        if(this.styles.titleColor) el.style.setProperty('--logo-title-color', this.styles.titleColor);

        el.innerHTML = `
            <div class="av-app-logo__icon"><i class="${this.icon}"></i></div>
            <div class="av-app-logo__text">
                <div class="av-app-logo__title">${this.title}</div>
                <div class="av-app-logo__version">${this.version}</div>
            </div>
        `;
        return el;
    }
    getNode() { return this.element; }
}