// frontend/js/ui/builder/main/canvas/topbar/avbutton/canvas_topbar_fullscreen.js
import { AVButton } from "../../../../../../../../components/AVButton/AVButton.js";
import { CanvasBehaviors } from "../../../../../../../behavior/canvas_actions.js";

export function buildCanvasFullscreenBtn() {
    return new AVButton({
        direction: 'right', height: 40,
        states: [
            {
                action: () => CanvasBehaviors.toggleFullscreen(false),
                icon: 'fa-solid fa-expand', text: 'Espandi', width: 105, gap: 4, transitionDuration: 300,
                colors: { buttonBg: 'transparent', buttonBorder: 'var(--border)', icon: 'var(--text-main)', pillBg: 'rgba(255,255,255,0.08)', pillBorder: 'rgba(255,255,255,0.15)', pillText: 'var(--text-main)' }
            },
            {
                action: () => CanvasBehaviors.toggleFullscreen(true),
                icon: 'fa-solid fa-compress', text: 'Riduci', width: 105, gap: 4, transitionDuration: 300,
                loopOnClick: true,
                colors: { buttonBg: 'rgba(59, 130, 246, 0.15)', buttonBorder: 'var(--primary)', icon: 'var(--primary)', pillBg: 'rgba(255, 255, 255, 0.1)', pillBorder: 'rgba(255, 255, 255, 0.2)', pillText: 'var(--primary)' }
            }
        ]
    });
}