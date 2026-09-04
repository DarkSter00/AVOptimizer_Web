// frontend/components/AVButton/AVButton.js
export class AVButton {
    constructor(config) {
        this.direction = config.direction || 'right';
        this.height = config.height || 42;

        this.reactOnHover = config.reactOnHover !== undefined ? config.reactOnHover : true;
        this.isDisabled = config.disabled || false;

        this.hoverFeedback = config.hoverFeedback !== undefined ? config.hoverFeedback : true;
        this.clickFeedback = config.clickFeedback !== undefined ? config.clickFeedback : true;

        // ARRAY DI STATI DI LUNGHEZZA N
        this.states = config.states || [];

        this.initialStateConfig = config.initialState || null;
        this.isInitialStateActive = !!this.initialStateConfig;

        this.currentState = 0;
        this.isExpanded = false;

        this.hoverEnterTimer = null;
        this.hoverLeaveTimer = null;
        this.revertTimer = null;

        this.element = this._createDOM();
        this.element.style.setProperty('--av-h', `${this.height}px`);

        if (this.hoverFeedback) {
            this.element.classList.add('av-btn--hover-feedback');
        }

        if (this.isDisabled) this.setDisabled(true);

        if (this.isInitialStateActive) {
            this._applyCustomStateConfig(this.initialStateConfig);
        } else {
            this._applyState(0, false); // Applica lo stato 0 senza triggerare la sua action
        }

        this._attachEvents();
    }

    setDisabled(disabled) {
        this.isDisabled = disabled;
        if (disabled) {
            this.element.classList.add('is-disabled');
            this.isExpanded = false;
            this.element.classList.remove('is-expanded');
        } else {
            this.element.classList.remove('is-disabled');
        }
    }

    _createDOM() {
        const btn = document.createElement('button');
        btn.className = `av-btn av-btn--${this.direction}`;

        btn.innerHTML = `
            <div class="av-btn__icon-wrapper">
                <i class="main-icon"></i>
            </div>
            <div class="av-btn__text-container">
                <div class="av-btn__pill">
                    <span class="pill-content"></span>
                </div>
            </div>
        `;
        return btn;
    }

    _applyCustomStateConfig(s) {
        const el = this.element;

        el.style.setProperty('--av-current-w', `${s.width}px`);
        el.style.setProperty('--av-gap', `${s.gap}px`);
        el.style.setProperty('--av-transition', `${s.transitionDuration}ms`);

        el.style.setProperty('--av-btn-bg', s.colors.buttonBg);
        el.style.setProperty('--av-btn-border', s.colors.buttonBorder);
        el.style.setProperty('--av-icon-color', s.colors.icon);

        el.style.setProperty('--av-pill-bg', s.colors.pillBg);
        el.style.setProperty('--av-pill-border', s.colors.pillBorder);
        el.style.setProperty('--av-pill-text', s.colors.pillText);

        const mainIcon = el.querySelector('.main-icon');
        mainIcon.className = `main-icon ${s.icon}`;

        const pillContent = el.querySelector('.pill-content');
        let html = '';
        if (s.pillIcon) html += `<i class="${s.pillIcon}" style="margin-right: 6px;"></i>`;
        html += s.text;
        pillContent.innerHTML = html;

        if (this.isExpanded) el.classList.add('is-expanded');
        else el.classList.remove('is-expanded');

        el.classList.remove('av-btn--glow-border', 'av-btn--glow-pill', 'av-btn--glow-icon');

        if (s.glow && s.glow.enabled) {
            const targets = Array.isArray(s.glow.target) ? s.glow.target : [s.glow.target || 'border'];
            const glowColor = s.glow.color || '#FFFFFF';

            el.style.setProperty('--av-glow-color', glowColor);
            el.style.setProperty('--av-glow-speed', `${s.glow.speed || 1.8}s`);

            targets.forEach(t => {
                if (t === 'border') el.classList.add('av-btn--glow-border');
                if (t === 'pill') el.classList.add('av-btn--glow-pill');
                if (t === 'icon') el.classList.add('av-btn--glow-icon');
            });
        }
    }

    // Applica uno stato e, opzionalmente, esegue l'azione associata
    _applyState(index, runAction = true) {
        if (index >= this.states.length) index = 0; // Previene errori se l'indice sfora
        this.currentState = index;
        const s = this.states[index];

        this._applyCustomStateConfig(s);

        // Se lo stato prevede un'azione, eseguila
        if (runAction && typeof s.action === 'function') {
            s.action(this); // Passa l'istanza del pulsante stesso come parametro (utile per controlli futuri)
        }

        // Gestione Auto-Ritorno
        clearTimeout(this.revertTimer);
        if (s.autoRevertDelay > 0) {
            this.revertTimer = setTimeout(() => {
                // Ritorna allo stato specificato, o di default allo stato 0
                const revertTarget = s.revertToIndex !== undefined ? s.revertToIndex : 0;

                if (revertTarget === 0 && !this.element.matches(':hover')) {
                    this.isExpanded = false;
                }
                this._applyState(revertTarget, false); // Non triggera l'azione quando ci torna in automatico
            }, s.autoRevertDelay);
        }
    }

    nextState() {
        if (this.currentState < this.states.length - 1) {
            this._applyState(this.currentState + 1, true);
        } else if (this.states[this.currentState].loopOnClick) {
            this._applyState(0, true);
        }
    }

    _attachEvents() {
        this.element.addEventListener('mouseenter', () => {
            if (this.isDisabled) return;

            // Brucia lo stato iniziale (lo applica visivamente ma senza lanciare action)
            if (this.isInitialStateActive) {
                this.isInitialStateActive = false;
                this._applyState(0, false);
            }

            const s = this.states[this.currentState];

            // SE IL TRIGGER È L'HOVER, SCATTA LO STATO SUCCESSIVO
            if (s && s.triggerToNext === 'hover') {
                this.nextState();
            }

            if (!this.reactOnHover) return;
            clearTimeout(this.hoverLeaveTimer);

            this.hoverEnterTimer = setTimeout(() => {
                this.isExpanded = true;
                this.element.classList.add('is-expanded');
            }, s?.hoverEnterDelay || 150);
        });

        this.element.addEventListener('mouseleave', () => {
            if (this.isDisabled) return;

            clearTimeout(this.hoverEnterTimer);
            const s = this.states[this.currentState];

            this.hoverLeaveTimer = setTimeout(() => {
                this.isExpanded = false;
                this.element.classList.remove('is-expanded');
            }, s?.hoverLeaveDelay || 600);
        });

        this.element.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.isDisabled) return;

            if (this.clickFeedback) {
                this.element.classList.add('is-clicked');
                setTimeout(() => this.element.classList.remove('is-clicked'), 150);
            }

            if (this.isInitialStateActive) {
                this.isInitialStateActive = false;
                this._applyState(0, false);
            }

            if (!this.isExpanded) {
                this.isExpanded = true;
                this.element.classList.add('is-expanded');
                return;
            }

            const s = this.states[this.currentState];

            // SE IL TRIGGER È IL CLICK (O di default se omesso)
            if (!s.triggerToNext || s.triggerToNext === 'click') {
                this.nextState();
            }
        });
    }

    getNode() { return this.element; }

    _getDefaultStates() {
        return [
            // STATO 0: Normale
            {
                icon: 'fa-solid fa-folder', text: 'Apri', pillIcon: '',
                width: 150, gap: 5, transitionDuration: 400,
                autoRevertDelay: 0, hoverEnterDelay: 200, hoverLeaveDelay: 800,
                colors: { buttonBg: 'transparent', buttonBorder: 'var(--primary)', icon: 'var(--primary)', pillBg: 'rgba(255,255,255,0.08)', pillBorder: 'rgba(255,255,255,0.15)', pillText: 'var(--text-main)' }
            },
            // STATO 1: Primo Click (Conferma)
            {
                icon: 'fa-solid fa-question', text: 'Sicuro?', pillIcon: 'fa-solid fa-exclamation-triangle',
                width: 130, gap: 3, transitionDuration: 250,
                autoRevertDelay: 3000, hoverEnterDelay: 0, hoverLeaveDelay: 800,
                colors: { buttonBg: 'color-mix(in srgb, var(--warning) 15%, transparent)', buttonBorder: 'var(--warning)', icon: 'var(--warning)', pillBg: 'transparent', pillBorder: 'var(--warning)', pillText: 'var(--warning)' }
            },
            // STATO 2: Secondo Click (Eseguito)
            {
                icon: 'fa-solid fa-check', text: 'Fatto!', pillIcon: '',
                width: 120, gap: 6, transitionDuration: 300,
                autoRevertDelay: 2000, hoverEnterDelay: 0, hoverLeaveDelay: 800,
                colors: { buttonBg: 'color-mix(in srgb, var(--success) 20%, transparent)', buttonBorder: 'var(--success)', icon: 'var(--success)', pillBg: 'var(--success)', pillBorder: 'var(--success)', pillText: '#000' }
            }
        ];
    }
}