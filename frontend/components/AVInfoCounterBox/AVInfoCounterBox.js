// frontend/components/AVInfoCounterBox/AVInfoCounterBox.js

import {AVHoveringWidget, globalHoverWidget} from "../AVHoveringWidget/AVHoveringWidget.js";

export class AVInfoCounterBox {
    constructor(config = {}) {

        this.label = config.label || '';
        this.value = config.value || '0';
        this.icon = config.icon || 'fa-solid fa-circle-info';
        this.baseColor = config.color || 'var(--text-muted)';
        this.fullWidth = config.fullWidth || false;

        // NUOVA CONFIGURAZIONE: Disabilita/Abilita e personalizza il widget di Hover
        this.hoverWidgetConfig = config.hoverWidget || null;

        this.states = config.states || [{ id: 'default' }];
        this.currentState = 0;
        this.revertTimer = null;

        this.element = this._createDOM();
        this._attachEvents();
    }

    _createDOM() {
        const el = document.createElement('div');
        el.className = `av-info-counter expand-${this.expandDirection}`;
        if (this.fullWidth) el.classList.add('is-full-width');

        const valColor = this.baseColor === 'var(--text-muted)' ? 'var(--text-main)' : this.baseColor;

        el.innerHTML = `
            <div class="av-info-counter__base">
                <div class="av-info-counter__header">
                    <i class="${this.icon}" style="color: ${this.baseColor}"></i>
                    <span>${this.label}</span>
                </div>
                <div class="av-info-counter__value" style="color: ${valColor}">
                    ${this.value}
                </div>
            </div>
            <div class="av-info-counter__overlay">
                <div class="overlay-inner-box">
                    <i class="overlay-icon"></i>
                    <span class="overlay-text"></span>
                </div>
            </div>
        `;
        return el;
    }

    // Metodo per aggiornare i dati in tempo reale (indipendente dallo stato)
    updateValue(newValue) {
        const valEl = this.element.querySelector('.av-info-counter__value');
        if (valEl) valEl.innerHTML = newValue;
        this.value = newValue;
    }

    _attachEvents() {
        // Teniamo traccia dell'ultima posizione del mouse per far nascere il widget nel punto giusto dopo il delay
        this.lastMouseEvent = null;
        this.hoverDelayTimer = null;

        this.element.addEventListener('mouseenter', (e) => {
            this.lastMouseEvent = e;

            if (this.hoverWidgetConfig && this.currentState === 0) {

                // NUOVO: Preleva il delay dai config, di default 1000ms
                const startDelay = this.hoverWidgetConfig.delay !== undefined ? this.hoverWidgetConfig.delay : 1000;

                // Usa la nuova variabile startDelay
                this.hoverDelayTimer = setTimeout(() => {
                    globalHoverWidget.start(this.lastMouseEvent, this.hoverWidgetConfig, () => {
                        this.element.classList.add('is-expanded');
                    });
                }, startDelay);
            }
        });

        this.element.addEventListener('mousemove', (e) => {
            this.lastMouseEvent = e;
            if (this.hoverWidgetConfig) {
                globalHoverWidget.updatePosition(e);
            }
        });

        this.element.addEventListener('mouseleave', () => {
            // Se si esce prima del secondo, annulla la comparsa
            clearTimeout(this.hoverDelayTimer);

            if (this.hoverWidgetConfig) {
                globalHoverWidget.cancel();
            }

            // Richiude il box quando si toglie il cursore
            this.element.classList.remove('is-expanded');
        });

        this.element.addEventListener('click', (e) => {
            e.stopPropagation();

            // Al click, stoppa tutto quello che stava facendo l'hover
            clearTimeout(this.hoverDelayTimer);
            if (this.hoverWidgetConfig) globalHoverWidget.cancel();

            // Feedback visivo interattivo
            this.element.classList.add('is-clicked');
            setTimeout(() => this.element.classList.remove('is-clicked'), 150);

            // 3. IL CLICK GESTISCE GLI STATI REALI (es. Apre in sovrimpressione)
            this.nextState();
        });
    }

    nextState() {
        if (this.currentState < this.states.length - 1) {
            this._applyState(this.currentState + 1, true);
        } else if (this.states[this.currentState].loopOnClick) {
            this._applyState(0, true);
        }
    }

    _applyState(index, runAction = true) {
        if (index >= this.states.length) index = 0;
        this.currentState = index;
        const s = this.states[index];

        if (runAction && typeof s.action === 'function') {
            s.action(this);
        }

        const overlayIcon = this.element.querySelector('.overlay-icon');
        const overlayText = this.element.querySelector('.overlay-text');
        const overlayInner = this.element.querySelector('.overlay-inner-box');

        if (index === 0) {
            this.element.classList.remove('has-overlay');
            this.element.style.removeProperty('--ic-state-border');
        } else {
            this.element.classList.add('has-overlay');

            if (s.overlayBg) this.element.style.setProperty('--ic-overlay-bg', s.overlayBg);
            if (s.overlayColor) this.element.style.setProperty('--ic-overlay-color', s.overlayColor);
            if (s.overlayBorder) this.element.style.setProperty('--ic-state-border', s.overlayBorder);

            overlayIcon.className = `overlay-icon ${s.icon || ''}`;
            overlayText.innerHTML = s.text || '';

            if (overlayInner) {
                overlayInner.classList.remove('state-pulse');
                void overlayInner.offsetWidth;
                overlayInner.classList.add('state-pulse');
            }
        }

        clearTimeout(this.revertTimer);
        if (s.autoRevertDelay > 0) {
            this.revertTimer = setTimeout(() => {
                const revertTarget = s.revertToIndex !== undefined ? s.revertToIndex : 0;
                this._applyState(revertTarget, false);
            }, s.autoRevertDelay);
        }
    }

    // Permette di aggiornare anche il testo aggiuntivo in runtime
    updateExtraInfo(newText) {
        const extraEl = this.element.querySelector('.av-info-counter__extra');
        if (extraEl) {
            extraEl.innerHTML = newText;
            this.extraInfo = newText;
        }
    }

    getNode() { return this.element; }
}