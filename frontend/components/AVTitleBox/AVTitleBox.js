// frontend/components/AVTitleBox/AVTitleBox.js

export class AVTitleBox {
    constructor(config = {}) {
        this.title = config.title || 'Titolo';
        this.badgeText = config.badgeText || '';
        this.styles = config.styles || {};
        this.element = this._createDOM();
        if (this.badgeText) this.setBadge(this.badgeText, this.styles.badge || {});
    }

    _createDOM() {
        const el = document.createElement('div');
        el.className = 'av-title-box';

        // Applica tutte le variabili CSS passate dal JS
        this._applyStyles(el, this.styles);

        el.innerHTML = `
            <span class="av-title-box__text">${this.title}</span>
            <div class="av-title-box__badge" style="display: none;"></div>
        `;
        return el;
    }

    _applyStyles(el, styles) {
        if (styles.bg) el.style.setProperty('--tb-bg', styles.bg);
        if (styles.border) el.style.setProperty('--tb-border', styles.border);
        if (styles.color) el.style.setProperty('--tb-color', styles.color);
        if (styles.radius) el.style.setProperty('--tb-radius', styles.radius);
        if (styles.padding) el.style.setProperty('--tb-padding', styles.padding);
        if (styles.gap) el.style.setProperty('--tb-gap', styles.gap);
        if (styles.minWidth) el.style.setProperty('--tb-min-width', styles.minWidth);
        if (styles.maxWidth) el.style.setProperty('--tb-max-width', styles.maxWidth);
        if (styles.fontSize) el.style.setProperty('--tb-font-size', styles.fontSize);
    }

    setTitle(text) {
        this.title = text;
        const textNode = this.element.querySelector('.av-title-box__text');
        if (textNode) textNode.textContent = text;
    }

    setBadge(text, config = {}) {
        const badge = this.element.querySelector('.av-title-box__badge');
        if (!badge) return;

        if (!text) {
            badge.style.display = 'none';
            return;
        }
        badge.style.display = 'block';
        badge.textContent = text;

        // Personalizzazione Badge on-the-fly
        if (config.bg) badge.style.setProperty('--tb-badge-bg', config.bg);
        if (config.color) badge.style.setProperty('--tb-badge-color', config.color);
        if (config.border) badge.style.setProperty('--tb-badge-border', config.border);
    }

    getNode() { return this.element; }
}