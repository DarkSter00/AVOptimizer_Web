// frontend/js/ui/builder/main/dashboard/upperbar/avbutton/main_upperbar_hard_reset.js
import { AVButton } from "../../../../../../../components/AVButton/AVButton.js";
import { UpperBarBehaviors } from "../../../../../../behavior/upperbar_actions.js";

export function buildHardResetButton() {
    return new AVButton({
        direction: 'left', height: 42,
        states: [
            {
                icon: 'fa-solid fa-power-off', text: 'Resetta tutto', pillIcon: '',
                width: 160, gap: 4, transitionDuration: 350, autoRevertDelay: 0, hoverEnterDelay: 250, hoverLeaveDelay: 1200,
                glow: { enabled: false },
                colors: { buttonBg: 'rgba(239, 68, 68, 0.1)', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'rgba(255, 255, 255, 0.08)', pillBorder: 'rgba(255, 255, 255, 0.15)', pillText: 'var(--text-main)' }
            },
            {
                icon: 'fa-solid fa-power-off', text: 'Svuotare RAM?', pillIcon: 'fa-solid fa-triangle-exclamation',
                width: 180, gap: 2, transitionDuration: 250, autoRevertDelay: 3000,
                glow: { enabled: true, target: ['border', 'icon'], color: 'var(--danger)', speed: 1.2 },
                colors: { buttonBg: 'rgba(239, 68, 68, 0.15)', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'rgba(239, 68, 68, 0.2)', pillBorder: 'var(--danger)', pillText: 'var(--danger)' }
            },
            {
                action: UpperBarBehaviors.confirmHardReset,
                icon: 'fa-solid fa-check', text: 'Reset...', pillIcon: '',
                width: 130, gap: 5, transitionDuration: 300, autoRevertDelay: 1500,
                glow: { enabled: false },
                colors: { buttonBg: 'rgba(239, 68, 68, 0.3)', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'var(--danger)', pillBorder: 'var(--danger)', pillText: '#fff' }
            }
        ]
    });
}