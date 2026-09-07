// frontend/components/AVNotification/AVNotification.js
export class AVNotification {
    constructor(config = {}) {
        this.id = config.id || `notif_${Date.now()}`;
        this.type = config.type || 'info';
        this.title = config.title || 'Notifica';
        this.message = config.message || '';
        this.subMessage = config.subMessage || ''; // Nuovo campo
        this.progress = config.progress !== undefined ? config.progress : null;

        this.currentColor = 'var(--primary)';
        this.currentIcon = 'fa-solid fa-circle-info';

        this.element = this._createDOM();
        this.setType(this.type);
    }

    _createDOM() {
        const el = document.createElement('div');
        el.className = 'av-notification';
        el.id = this.id;

        el.innerHTML = `
            <div class="av-notif-bg-progress" style="--notif-prog: ${this.progress || 0}%"></div>
            <div class="av-notif-header">
                <div class="av-notif-pill">
                    <i class="av-notif-icon fa-solid fa-circle-info"></i>
                    <span class="av-notif-title-text">${this.title}</span>
                </div>
                <div class="av-notif-header-right">
                    <div class="av-notif-pill av-notif-pct-pill" style="display: ${this.progress !== null ? 'flex' : 'none'}">
                        <span class="av-notif-pct">${Math.floor(this.progress || 0)}%</span>
                    </div>
                </div>
            </div>
            <div class="av-notif-body-container">
                <div class="av-notif-sub" style="display: ${this.subMessage ? 'inline-block' : 'none'}">${this.subMessage}</div>
                <div class="av-notif-body">${this.message}</div>
            </div>
        `;

        // Click sull'intera card per espandere/ridurre
        el.addEventListener('click', () => {
            el.classList.toggle('is-expanded');
        });

        return el;
    }

    setType(type) {
        this.type = type;
        const iconEl = this.element.querySelector('.av-notif-icon');
        switch(type) {
            case 'error': this.currentColor = 'var(--danger)'; this.currentIcon = 'fa-solid fa-triangle-exclamation'; break;
            case 'building': this.currentColor = 'var(--primary)'; this.currentIcon = 'fa-solid fa-hammer'; break;
            case 'info':
            default: this.currentColor = 'var(--warning)'; this.currentIcon = 'fa-solid fa-circle-info'; break;
        }
        this.element.style.setProperty('--notif-color', this.currentColor);
        if (iconEl) iconEl.className = `av-notif-icon ${this.currentIcon}`;
    }

    update(payload = {}) {
        if (payload.title !== undefined) {
            this.title = payload.title;
            const titleEl = this.element.querySelector('.av-notif-title-text');
            if (titleEl) titleEl.textContent = this.title;
        }
        if (payload.subMessage !== undefined) {
            this.subMessage = payload.subMessage;
            const sub = this.element.querySelector('.av-notif-sub');
            if (sub) {
                sub.textContent = this.subMessage;
                sub.style.display = this.subMessage ? 'inline-block' : 'none';
            }
        }
        if (payload.message !== undefined) {
            this.message = payload.message;
            const body = this.element.querySelector('.av-notif-body');
            if (body) body.textContent = this.message;
        }
        if (payload.progress !== undefined) {
            this.progress = payload.progress;
            const bg = this.element.querySelector('.av-notif-bg-progress');
            const pct = this.element.querySelector('.av-notif-pct');
            if (bg) bg.style.setProperty('--notif-prog', `${this.progress}%`);
            if (pct) { pct.style.display = 'block'; pct.textContent = `${Math.floor(this.progress)}%`; }
        }
        if (payload.type !== undefined) this.setType(payload.type);
    }

    getNode() { return this.element; }
}