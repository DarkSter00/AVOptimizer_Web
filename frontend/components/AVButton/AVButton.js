// frontend/components/AVButton/AVButton.js
export class AVButton {
    constructor(config) {
        this.direction = config.direction || 'left';
        this.height = config.height || 42;

        // Reazione in Hover (true = si espande al passaggio del mouse)
        this.reactOnHover = config.reactOnHover !== undefined ? config.reactOnHover : true;

        // Callbacks
        this.onState1 = config.onState1 || (() => {}); // Azione al primo click
        this.onState2 = config.onState2 || (() => {}); // Azione finale al secondo click

        // Array dei 3 Stati (0: Normale, 1: Primo Click, 2: Secondo Click)
        this.states = config.states || this._getDefaultStates();

        this.currentState = 0;
        this.isExpanded = false;

        // Timers indipendenti
        this.hoverEnterTimer = null;
        this.hoverLeaveTimer = null;
        this.revertTimer = null;

        // Inizializzazione
        this.element = this._createDOM();
        this.element.style.setProperty('--av-h', `${this.height}px`);

        this._applyState(0);
        this._attachEvents();
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

    _applyState(index) {
        this.currentState = index;
        const s = this.states[index];
        const el = this.element;

        // 1. Applica Variabili CSS Dinamiche (Colori, Gap, Dimensioni, Velocità Transizione)
        el.style.setProperty('--av-current-w', `${s.width}px`);
        el.style.setProperty('--av-gap', `${s.gap}px`);
        el.style.setProperty('--av-transition', `${s.transitionDuration}ms`);

        el.style.setProperty('--av-btn-bg', s.colors.buttonBg);
        el.style.setProperty('--av-btn-border', s.colors.buttonBorder);
        el.style.setProperty('--av-icon-color', s.colors.icon);

        el.style.setProperty('--av-pill-bg', s.colors.pillBg);
        el.style.setProperty('--av-pill-border', s.colors.pillBorder);
        el.style.setProperty('--av-pill-text', s.colors.pillText);
        // Pulizia classi di glow precedenti
        el.classList.remove('av-btn--glow-border', 'av-btn--glow-pill', 'av-btn--glow-icon');

        // Gestione del Glowing flessibile per target
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

        // 2. Aggiorna l'Icona Esterna (il cerchio)
        const mainIcon = el.querySelector('.main-icon');
        mainIcon.className = `main-icon ${s.icon}`;

        // 3. Aggiorna il testo e l'icona della Pillola Interna
        const pillContent = el.querySelector('.pill-content');
        let html = '';
        if (s.pillIcon) html += `<i class="${s.pillIcon}" style="margin-right: 6px;"></i>`;
        html += s.text;
        pillContent.innerHTML = html;

        // Applica visivamente la larghezza
        if (this.isExpanded) el.classList.add('is-expanded');
        else el.classList.remove('is-expanded');

        // 4. Gestione Auto-Ritorno (Auto-Revert)
        clearTimeout(this.revertTimer);
        if (s.autoRevertDelay > 0) {
            this.revertTimer = setTimeout(() => {
                let previousState = this.currentState - 1;
                if (previousState < 0) previousState = 0;

                // Se torniamo a 0 e il mouse non è sopra, chiudiamo il bottone
                if (previousState === 0 && !this.element.matches(':hover')) {
                    this.isExpanded = false;
                }
                this._applyState(previousState);
            }, s.autoRevertDelay);
        }
    }

    _attachEvents() {
        this.element.addEventListener('mouseenter', () => {
            if (!this.reactOnHover) return;
            clearTimeout(this.hoverLeaveTimer);

            const s = this.states[this.currentState];
            this.hoverEnterTimer = setTimeout(() => {
                this.isExpanded = true;
                this.element.classList.add('is-expanded');
            }, s.hoverEnterDelay || 150);
        });

        this.element.addEventListener('mouseleave', () => {
            clearTimeout(this.hoverEnterTimer);
            const s = this.states[this.currentState];

            this.hoverLeaveTimer = setTimeout(() => {
                // In HoverLeave collassiamo l'elemento, ma NON resettiamo lo stato (ci pensa l'AutoRevert)
                this.isExpanded = false;
                this.element.classList.remove('is-expanded');
            }, s.hoverLeaveDelay || 600);
        });

        this.element.addEventListener('click', (e) => {
            e.stopPropagation();

            if (!this.isExpanded) {
                // Se è chiuso e ho il reactOnHover disattivato, il primo click lo espande solo.
                this.isExpanded = true;
                this.element.classList.add('is-expanded');
                return;
            }

            if (this.currentState === 0) {
                this._applyState(1);
                this.onState1();
            } else if (this.currentState === 1) {
                this._applyState(2);
                this.onState2();
            }
        });
    }

    getNode() { return this.element; }

    // Genera un template di base se l'utente non passa l'array config.states
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