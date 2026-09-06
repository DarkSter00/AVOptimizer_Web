// frontend/components/AVInfoContainer/AVInfoContainer.js
export class AVInfoContainer {
    constructor(config = {}) {
        this.rows = config.rows || []; // Array di Array (Righe -> Box)
        this.rowGap = config.rowGap || '8px';
        this.itemGap = config.itemGap || '8px';
        this.padding = config.padding || '0px';
        this.margin = config.margin || '10px 0 0 0';

        this.backgroundColor = config.backgroundColor || 'transparent';
        this.border = config.border || 'none';
        this.borderRadius = config.borderRadius || '0px';

        this.element = this._createDOM();
    }

    _createDOM() {
        const el = document.createElement('div');
        el.className = 'av-info-container';

        el.style.setProperty('--aic-row-gap', this.rowGap);
        el.style.setProperty('--aic-item-gap', this.itemGap);
        el.style.setProperty('--aic-padding', this.padding);
        el.style.setProperty('--aic-margin', this.margin);

        el.style.setProperty('--aic-bg', this.backgroundColor);
        el.style.setProperty('--aic-border', this.border);
        el.style.setProperty('--aic-radius', this.borderRadius);

        this.rows.forEach((rowItems, rowIndex) => {
            const rowEl = document.createElement('div');
            rowEl.className = 'av-info-row';

            rowItems.forEach((item, itemIndex) => {
                if (item && typeof item.getNode === 'function') {
                    const node = item.getNode();
                    node.classList.add('is-entering');
                    // Calcolo animazione a cascata bidimensionale (riga + colonna)
                    node.style.animationDelay = `${(rowIndex * 0.05) + (itemIndex * 0.03)}s`;
                    rowEl.appendChild(node);
                    setTimeout(() => node.classList.remove('is-entering'), 1000);
                }
            });

            el.appendChild(rowEl);
        });

        return el;
    }

    getNode() { return this.element; }
}