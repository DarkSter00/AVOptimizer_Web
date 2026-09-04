// frontend/components/AVBootManager/AVBootManager.js

export class AVBootManager {
    constructor() {
        this.widget = null;
        this.isBooting = true;
        this._initDOM();
    }

    _initDOM() {
        this.widget = document.createElement('div');
        this.widget.className = 'av-boot-widget';

        this.widget.innerHTML = `
            <div class="av-boot-spinner">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
            </div>
            <div class="av-boot-content">
                <div class="av-boot-title" id="av-boot-title">Sistema in Avvio</div>
                <div class="av-boot-subtitle" id="av-boot-subtitle">In attesa del server Python...</div>
            </div>
        `;

        document.body.appendChild(this.widget);
    }

    // Mostra il widget con un messaggio personalizzato
    show(title = "Sistema in Avvio", subtitle = "In attesa dei dati...") {
        this.isBooting = true;
        document.getElementById('av-boot-title').textContent = title;
        document.getElementById('av-boot-subtitle').textContent = subtitle;

        // Ritardo minimo per permettere al DOM di registrare il componente prima dell'animazione
        requestAnimationFrame(() => {
            this.widget.classList.add('is-visible');
            this.widget.classList.remove('is-hidden');
        });
    }

    // Nasconde il widget e restituisce "false" (boot completato)
    finish() {
        this.isBooting = false;
        this.widget.classList.remove('is-visible');
        this.widget.classList.add('is-hidden');

        // Opzionale: rimuovi dal DOM dopo l'animazione se non serve più
        // setTimeout(() => this.widget.remove(), 400);
    }

    // Permette agli altri file di sapere se siamo ancora in fase di caricamento
    isSystemBooting() {
        return this.isBooting;
    }
}