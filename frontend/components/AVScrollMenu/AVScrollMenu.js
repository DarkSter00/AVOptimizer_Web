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

        this._initDOM();
        this._attachHoverEvents();
        this._attachWheelEvent();
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
        this.btnPrev.getNode().addEventListener('mouseenter', () => {
            if (this.activeIndex > 0) {
                const prevItem = this.track.children[this.activeIndex - 1];
                if (prevItem) prevItem.classList.add('preview-target');
            }
        });
        this.btnPrev.getNode().addEventListener('mouseleave', () => {
            if (this.activeIndex > 0) {
                const prevItem = this.track.children[this.activeIndex - 1];
                if (prevItem) prevItem.classList.remove('preview-target');
            }
        });

        this.btnNext.getNode().addEventListener('mouseenter', () => {
            if (this.activeIndex < this.items.length - 1) {
                const nextItem = this.track.children[this.activeIndex + 1];
                if (nextItem) nextItem.classList.add('preview-target');
            }
        });
        this.btnNext.getNode().addEventListener('mouseleave', () => {
            if (this.activeIndex < this.items.length - 1) {
                const nextItem = this.track.children[this.activeIndex + 1];
                if (nextItem) nextItem.classList.remove('preview-target');
            }
        });
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
        this.track.innerHTML = '';

        this.items.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = `av-scroll-menu-item ${item.themeClass || 'theme-pending'}`;

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
        });

        requestAnimationFrame(() => {
            this._updateButtonsVisibility();
            if (this.centerActive && this.items.length > 0) {
                const trackWidth = this.container.clientWidth;
                const activeEl = this.track.children[this.activeIndex] || this.track.children[0];
                const itemWidth = activeEl.offsetWidth;

                const pad = Math.max(0, (trackWidth / 2) - (itemWidth / 2));
                this.track.style.paddingLeft = `${pad}px`;
                this.track.style.paddingRight = `${pad}px`;

                this._scrollToActive(activeEl);
            }
        });
    }

    _updateButtonsVisibility() {
        const needsScroll = this.track.scrollWidth > this.track.clientWidth;

        if (this.hideDisabledButtons && !needsScroll) {
            this.wrapPrev.classList.add('is-hidden');
            this.wrapNext.classList.add('is-hidden');
            return;
        }

        if (this.activeIndex <= 0) {
            this.hideDisabledButtons ? this.wrapPrev.classList.add('is-hidden') : this.wrapPrev.classList.add('is-disabled');
        } else {
            this.wrapPrev.classList.remove('is-disabled', 'is-hidden');
        }

        if (this.activeIndex >= this.items.length - 1) {
            this.hideDisabledButtons ? this.wrapNext.classList.add('is-hidden') : this.wrapNext.classList.add('is-disabled');
        } else {
            this.wrapNext.classList.remove('is-disabled', 'is-hidden');
        }
    }

    _scrollToActive(activeEl) {
        if (!activeEl) return;
        requestAnimationFrame(() => {
            // Calcolo infallibile della centratura basato sui pixel effettivi a schermo
            const trackRect = this.track.getBoundingClientRect();
            const elRect = activeEl.getBoundingClientRect();
            const trackCenter = trackRect.left + (trackRect.width / 2);
            const elCenter = elRect.left + (elRect.width / 2);
            const scrollDiff = elCenter - trackCenter;

            this.track.scrollBy({ left: scrollDiff, behavior: 'smooth' });
        });
    }
}