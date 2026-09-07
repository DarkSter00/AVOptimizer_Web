// frontend/js/ui/builder/main/canvas/topbar/avbutton/canvas_topbar_delete.js
import { AVButton } from "../../../../../../../../components/AVButton/AVButton.js";
import { CanvasBehaviors } from "../../../../../../../behavior/canvas_actions.js";

export function buildCanvasDeleteBtn() {
    return new AVButton({
        direction: 'left', height: 40,
        states: [
            { icon: 'fa-solid fa-trash-can', text: 'Elimina Core', width: 145, gap: 4, transitionDuration: 300, colors: { buttonBg: 'transparent', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'rgba(239, 68, 68, 0.1)', pillBorder: 'rgba(239, 68, 68, 0.2)', pillText: 'var(--danger)' } },
            { icon: 'fa-solid fa-triangle-exclamation', text: 'Sicuro?', width: 120, gap: 4, transitionDuration: 250, autoRevertDelay: 3000, glow: { enabled: true, target: ['border', 'icon'], color: 'var(--danger)', speed: 1.2 }, colors: { buttonBg: 'rgba(239, 68, 68, 0.2)', buttonBorder: 'var(--danger)', icon: 'var(--danger)', pillBg: 'rgba(239, 68, 68, 0.3)', pillBorder: 'var(--danger)', pillText: 'var(--danger)' } },
            { action: CanvasBehaviors.deleteActiveCore, icon: 'fa-solid fa-check', text: 'Eliminato', width: 120, gap: 4, transitionDuration: 300, autoRevertDelay: 1500, colors: { buttonBg: 'rgba(239, 68, 68, 0.4)', buttonBorder: 'var(--danger)', icon: '#fff', pillBg: 'var(--danger)', pillBorder: 'var(--danger)', pillText: '#fff' } }
        ]
    });
}