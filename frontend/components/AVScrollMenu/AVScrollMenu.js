// frontend/components/AVScrollMenu/AVScrollMenu.js
import { AVButton } from "../AVButton/AVButton.js";

export class AVScrollMenu {
    constructor(config) {
        this.container = document.getElementById(config.containerId);
        if (!this.container) return;

        this.onItemClick = config.onItemClick || (() => {});
        this.onPrevClick = config.onPrevClick || (() => {});
        this.onNextClick = config.onNextClick || (() => {});

        this.hideDisabledButtons = config.hideDisabledButtons !== undefined ? config.hideDisabledButtons : true;
        this.centerActive = config.centerActive !== undefined ? config.centerActive : true;

        this.btnPrevConfig = config.btnPrevConfig || {};
        this.btnNextConfig = config.btnNextConfig || {};

        this.items = [];
        this.activeIndex = 0;
        this.cardGap = config.cardGap !== undefined ? config.cardGap : 8;
        this.shrunkMargin = config.shrunkMargin !== undefined ? config.shrunkMargin : -10;

        this.lastActiveIndex = -1; // Usato per ottimizzare i calcoli

        this._initDOM();
        this._attachHoverEvents();
        this._attachWheelEvent();

        // Osserva il contenitore padre per ricalcolare il centro in tempo reale durante i ridimensionamenti
        this.resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => this._recenterActiveItem(true)); // true = scroll istantaneo senza lag visivi
        });
        if (this.container) this.resizeObserver.observe(this.container);
    }

    _initDOM() {
        this.container.innerHTML = `
            <div class="av-scroll-menu-wrapper">
                <div class="av-sm-btn-wrapper" id="av-sm-wrap-prev"></div>
                <div class="av-scroll-menu-track" id="av-sm-track"></div>
                <div class="av-sm-btn-wrapper" id="av-sm-wrap-next"></div>
            </div>
        `;
        this.wrapPrev = this.container.querySelector('#av-sm-wrap-prev');
        this.wrapNext = this.container.querySelector('#av-sm-wrap-next');
        this.track = this.container.querySelector('#av-sm-track');

        this.track.style.setProperty('--card-gap', `${this.cardGap}px`);
        this.track.style.setProperty('--shrunk-margin', `${this.shrunkMargin}px`);

        this.btnPrev = new AVButton(this.btnPrevConfig);
        this.btnNext = new AVButton(this.btnNextConfig);

        this.wrapPrev.appendChild(this.btnPrev.getNode());
        this.wrapNext.appendChild(this.btnNext.getNode());

        this.btnPrev.getNode().addEventListener('click', () => {
            if (this.activeIndex > 0) this.onPrevClick(this.activeIndex);
        });
        this.btnNext.getNode().addEventListener('click', () => {
            if (this.activeIndex < this.items.length - 1) this.onNextClick(this.activeIndex);
        });
    }

    _attachHoverEvents() {
        this.isPrevHovered = false;
        this.isNextHovered = false;

        this.btnPrev.getNode().addEventListener('mouseenter', () => {
            this.isPrevHovered = true;
            this._refreshHoverPreview();
        });
        this.btnPrev.getNode().addEventListener('mouseleave', () => {
            this.isPrevHovered = false;
            this._refreshHoverPreview();
        });

        this.btnNext.getNode().addEventListener('mouseenter', () => {
            this.isNextHovered = true;
            this._refreshHoverPreview();
        });
        this.btnNext.getNode().addEventListener('mouseleave', () => {
            this.isNextHovered = false;
            this._refreshHoverPreview();
        });
    }

    _refreshHoverPreview() {
        if (!this.track) return;
        Array.from(this.track.children).forEach(c => c.classList.remove('preview-target'));

        if (this.isPrevHovered && this.activeIndex > 0) {
            const prevItem = this.track.children[this.activeIndex - 1];
            if (prevItem) prevItem.classList.add('preview-target');
        }
        if (this.isNextHovered && this.activeIndex < this.items.length - 1) {
            const nextItem = this.track.children[this.activeIndex + 1];
            if (nextItem) nextItem.classList.add('preview-target');
        }
    }

    _attachWheelEvent() {
        this.track.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                this.track.scrollLeft += e.deltaY;
            }
        }, { passive: false });
    }

    updateItems(items, activeIndex) {
        this.items = items;
        this.activeIndex = activeIndex;
        this.render();
    }

    render() {
        // RENDERING INTELLIGENTE (SMART UPDATE)
        // Evita di distruggere il DOM 5 volte al secondo bloccando le animazioni CSS!
        let requiresFullRender = false;

        if (this.track.children.length !== this.items.length) {
            requiresFullRender = true;
        } else {
            for (let i = 0; i < this.items.length; i++) {
                if (this.track.children[i].dataset.id !== this.items[i].id) {
                    requiresFullRender = true;
                    break;
                }
            }
        }

        if (requiresFullRender) {
            // Costruzione da zero (con Animazione di ingresso 'is-entering')
            this.track.innerHTML = '';

            this.items.forEach((item, index) => {
                const el = document.createElement('div');
                // Aggiungiamo 'is-entering' per avviare il Keyframe CSS!
                el.className = `av-scroll-menu-item is-entering ${item.themeClass || 'theme-pending'}`;
                el.dataset.id = item.id;

                if (index === this.activeIndex) el.classList.add('is-active');

                el.innerHTML = `
                    <i class="${item.mainIcon || 'fa-solid fa-folder-tree'}"></i>
                    <span>${item.label}</span>
                    ${item.statusIcon ? `<i class="${item.statusIcon}"></i>` : ''}
                `;

                el.addEventListener('mousedown', () => el.style.transform = 'scale(0.85)');
                el.addEventListener('click', () => {
                    Array.from(this.track.children).forEach(c => c.classList.remove('preview-target'));
                    el.style.transform = '';
                    this.onItemClick(item, index);
                });

                this.track.appendChild(el);

                // Rimuoviamo la classe di animazione dopo 1 secondo per non intaccare gli hover successivi
                setTimeout(() => el.classList.remove('is-entering'), 1000);
            });
        } else {
            // Aggiornamento Silenzioso: Tocca solo le classi e l'HTML interno
            this.items.forEach((item, index) => {
                const el = this.track.children[index];

                let newClass = `av-scroll-menu-item ${item.themeClass || 'theme-pending'}`;
                // Manteniamo la classe is-entering se sta ancora venendo su
                if (el.classList.contains('is-entering')) newClass += ' is-entering';
                if (index === this.activeIndex) newClass += ' is-active';

                if (el.className !== newClass) el.className = newClass;

                const newHtml = `
                    <i class="${item.mainIcon || 'fa-solid fa-folder-tree'}"></i>
                    <span>${item.label}</span>
                    ${item.statusIcon ? `<i class="${item.statusIcon}"></i>` : ''}
                `;
                if (el.innerHTML !== newHtml) {
                    el.innerHTML = newHtml;
                }
            });
        }

        // Calcolo Scroll Infallibile
        setTimeout(() => {
            //this._updateButtonsVisibility();
            //this._refreshHoverPreview();
            this._recenterActiveItem(false);
/*
            if (this.centerActive && this.items.length > 0) {
                const trackWidth = this.container.clientWidth;
                const activeEl = this.track.children[this.activeIndex] || this.track.children[0];
                const itemWidth = activeEl.offsetWidth;
                const pad = Math.max(0, (trackWidth / 2) - (itemWidth / 2));

                this.track.style.paddingLeft = `${pad}px`;
                this.track.style.paddingRight = `${pad}px`;
                this._scrollToActive(activeEl);
            } else if (this.items.length > 0) {
                this._scrollToActive(this.track.children[this.activeIndex]);
            }

 */
        }, 50);
    }

    _updateButtonsVisibility() {
        const hasPrev = this.activeIndex > 0;
        const hasNext = this.activeIndex < this.items.length - 1;

        if (!hasPrev && this.hideDisabledButtons) this.wrapPrev.classList.add('is-hidden');
        else {
            this.wrapPrev.classList.remove('is-hidden');
            if (!hasPrev) this.wrapPrev.classList.add('is-disabled');
            else this.wrapPrev.classList.remove('is-disabled');
        }

        if (!hasNext && this.hideDisabledButtons) this.wrapNext.classList.add('is-hidden');
        else {
            this.wrapNext.classList.remove('is-hidden');
            if (!hasNext) this.wrapNext.classList.add('is-disabled');
            else this.wrapNext.classList.remove('is-disabled');
        }
    }

    _recenterActiveItem(instant = false) {
        if (!this.track || this.items.length === 0) return;

        this._updateButtonsVisibility();
        this._refreshHoverPreview();

        const activeEl = this.track.children[this.activeIndex] || this.track.children[0];
        if (!activeEl) return;

        if (this.centerActive) {
            this.track.classList.add('is-centered');
            // 1. Sblocco del Flexbox: azzeriamo il padding in modo che la traccia si comprima allo spazio reale
            //this.track.style.paddingLeft = '0px';
            //this.track.style.paddingRight = '0px';

            // Passiamo la larghezza della scheda al CSS SOLO se la scheda cambia (Zero Lag!)
            if (this.lastActiveIndex !== this.activeIndex) {
                const itemWidth = activeEl.offsetWidth;
                this.track.style.setProperty('--active-item-width', `${itemWidth}px`);
                this.lastActiveIndex = this.activeIndex;
            }

            /*
            // 2. Lettura dello spazio reale concesso dalla barra esterna
            const trackWidth = this.track.clientWidth;
            const itemWidth = activeEl.offsetWidth;
            const pad = Math.max(0, (trackWidth / 2) - (itemWidth / 2));

            // 3. Riapplichiamo il padding matematicamente corretto
            this.track.style.paddingLeft = `${pad}px`;
            this.track.style.paddingRight = `${pad}px`;

             */
        }

        // Calcolo millimetrico dello scroll necessario
        const trackRect = this.track.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();

        const trackCenter = trackRect.left + (trackRect.width / 2);
        const elCenter = elRect.left + (elRect.width / 2);
        const scrollDiff = elCenter - trackCenter;

        if (Math.abs(scrollDiff) > 1) {
            // Utilizziamo lo smooth scroll nativo via JS solo per i click, rendendolo istantaneo durante l'allargamento della barra
            this.track.scrollBy({ left: scrollDiff, behavior: instant ? 'auto' : 'smooth' });
        }
    }
}