// frontend/js/ui/builder/main/dashboard/upperbar/avbutton/main_upperbar_side_menu.js
import { AVButton } from "../../../../../../../components/AVButton/AVButton.js";
import { UpperBarBehaviors } from "../../../../../../behavior/upperbar_actions.js";

export function buildSideMenuButton() {
    const btnMenu = new AVButton({
        direction: 'right', height: 42,
        states: [{
            action: UpperBarBehaviors.toggleSideMenu,
            icon: 'fa-solid fa-bars', text: 'Menu', pillIcon: '',
            width: 110, gap: 4, transitionDuration: 250, loopOnClick: true,
            colors: { buttonBg: 'transparent', buttonBorder: 'var(--border)', icon: 'var(--text-main)', pillBg: 'rgba(255,255,255,0.08)', pillBorder: 'rgba(255,255,255,0.15)', pillText: 'var(--text-main)' }
        }]
    });

    const node = btnMenu.getNode();
    node.classList.add('av-btn-hamburger');

    // === RIPRISTINO LOGICA PEEKING (SBIRCIATINA) ===
    let peekTimer = null;

    node.addEventListener('mouseenter', () => {
        if (!document.body.classList.contains('menu-open')) {
            peekTimer = setTimeout(() => {
                document.body.classList.add('menu-peek');
            }, 1500); // 1.5 secondi di hover per farlo uscire
        }
    });

    node.addEventListener('mouseleave', () => {
        clearTimeout(peekTimer);
        document.body.classList.remove('menu-peek');
    });

    node.addEventListener('click', () => {
        clearTimeout(peekTimer);
        document.body.classList.remove('menu-peek');
    });

    return btnMenu;
}