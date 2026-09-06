// frontend/components/AVHoveringWidget/AVHoveringWidget.js

export class AVHoveringWidget {
    constructor() {
        // Pattern Singleton: una sola istanza globale
        if (AVHoveringWidget.instance) return AVHoveringWidget.instance;
        AVHoveringWidget.instance = this;

        this.element = this._createDOM();
        document.body.appendChild(this.element);

        this.progressCircle = this.element.querySelector('.av-hw-progress');
        this.textSpan = this.element.querySelector('.av-hw-text');
        this.iconSpan = this.element.querySelector('.av-hw-icon');

        this.animationFrame = null;
        this.timeout = null;
        this.startTime = 0;
        this.duration = 0;
        this.onComplete = null;
    }

    _createDOM() {
        const el = document.createElement('div');
        el.className = 'av-hover-widget';
        el.innerHTML = `
            <div class="av-hw-ring">
                <svg viewBox="0 0 24 24">
                    <circle class="av-hw-bg" cx="12" cy="12" r="10" pathLength="100"></circle>
                    <circle class="av-hw-progress" cx="12" cy="12" r="10" pathLength="100"></circle>
                </svg>
                <i class="av-hw-icon fa-solid fa-bolt"></i>
            </div>
            <span class="av-hw-text">Azione...</span>
        `;
        return el;
    }

    start(e, config, onCompleteCallback) {
        this.cancel(); // Pulisce esecuzioni precedenti

        this.duration = config.duration || 1500;
        this.onComplete = onCompleteCallback;

        this.textSpan.textContent = config.text || 'Apertura in corso...';
        this.iconSpan.className = `av-hw-icon ${config.icon || 'fa-solid fa-bolt'}`;
        this.element.style.setProperty('--hw-color', config.color || 'var(--primary)');

        this.updatePosition(e);
        this.element.classList.add('is-active');

        this.startTime = performance.now();
        this.animationFrame = requestAnimationFrame(this._animate.bind(this));
    }

    _animate(currentTime) {
        const elapsed = currentTime - this.startTime;
        let progress = Math.min(elapsed / this.duration, 1);

        // Calcola il dashoffset (da 100 a 0)
        const offset = 100 - (progress * 100);
        this.progressCircle.style.strokeDashoffset = offset;

        if (progress < 1) {
            this.animationFrame = requestAnimationFrame(this._animate.bind(this));
        } else {
            // Animazione conclusa
            this.element.classList.remove('is-active');
            if (typeof this.onComplete === 'function') {
                this.onComplete();
            }
        }
    }

    updatePosition(e) {
        // Si posiziona in basso a destra rispetto al cursore (per non coprirlo)
        this.element.style.left = `${e.clientX + 18}px`;
        this.element.style.top = `${e.clientY + 18}px`;
    }

    cancel() {
        cancelAnimationFrame(this.animationFrame);
        clearTimeout(this.timeout);
        this.element.classList.remove('is-active');
        this.progressCircle.style.strokeDashoffset = 100;
    }
}

// Istanziamo e rendiamo disponibile globalmente il Widget
export const globalHoverWidget = new AVHoveringWidget();