// frontend/components/AVCanvas/AVCanvas.js
import { AVUpperBar } from "../AVDashboardGlobalBar/AVUpperBar.js";

export class AVCanvas {
    constructor(config = {}) {
        this.containerId = config.containerId;
        this.container = document.getElementById(this.containerId);
        if (!this.container) return;

        this.columnCount = config.columns || 2;
        this.items = config.items || [];

        this.priorityMap = config.priorityMap || {
            "In Esecuzione": 10,
            "Completando...": 10,
            "Errore": 5,
            "In attesa": 0,
            "Completato": -1,
            "Esclusa": -10
        };

        this.styles = config.styles || {};
        this.topBarConfig = config.topBarConfig || null;
        this.upperBarInstance = null;

        this._initDOM();
    }

    _initDOM() {
        if (this.styles.bg) this.container.style.setProperty('--cv-bg', this.styles.bg);
        if (this.styles.border) this.container.style.setProperty('--cv-border', this.styles.border);
        if (this.styles.radius) this.container.style.setProperty('--cv-radius', this.styles.radius);
        if (this.styles.padding) this.container.style.setProperty('--cv-padding', this.styles.padding);
        if (this.styles.colGap) this.container.style.setProperty('--cv-col-gap', this.styles.colGap);
        if (this.styles.itemGap) this.container.style.setProperty('--cv-item-gap', this.styles.itemGap);
        if (this.styles.workPadding) this.container.style.setProperty('--cv-work-padding', this.styles.workPadding);

        this.container.innerHTML = `
            <div class="av-canvas-container">
                <div class="av-canvas-topbar-zone" id="${this.containerId}-topbar"></div>
                <div class="av-canvas-workspace" id="${this.containerId}-workspace">
                    ${this._generateColumnsHTML()}
                </div>
            </div>
        `;

        this.workspace = this.container.querySelector('.av-canvas-workspace');

        if (this.topBarConfig) {
            this.topBarConfig.containerId = `${this.containerId}-topbar`;
            this.upperBarInstance = new AVUpperBar(this.topBarConfig);
        }
    }

    _generateColumnsHTML() {
        let colsHtml = '';
        for (let i = 0; i < this.columnCount; i++) {
            colsHtml += `<div class="av-canvas-column" id="${this.containerId}-col-${i}"></div>`;
        }
        return colsHtml;
    }

    updateItems(newItems) {
        this.items = newItems;

        let mappedItems = this.items.map((item, index) => {
            const priority = this.priorityMap[item.status] !== undefined ? this.priorityMap[item.status] : 0;
            return { originalItem: item, originalIndex: index, priority: priority };
        });

        mappedItems.sort((a, b) => {
            if (a.priority !== b.priority) return b.priority - a.priority;
            return a.originalIndex - b.originalIndex;
        });

        const cols = [];
        for (let i = 0; i < this.columnCount; i++) {
            const colEl = this.container.querySelector(`#${this.containerId}-col-${i}`);
            // Pulisce fisicamente il DOM della colonna
            while (colEl.firstChild) { colEl.removeChild(colEl.firstChild); }
            cols.push(colEl);
        }

        mappedItems.forEach((mappedObj, i) => {
            const colIndex = i % this.columnCount;
            const node = typeof mappedObj.originalItem.getNode === 'function' ? mappedObj.originalItem.getNode() : mappedObj.originalItem;
            if (node) cols[colIndex].appendChild(node);
        });
    }

    getTopBar() { return this.upperBarInstance; }
}