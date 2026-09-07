// frontend/js/ui/builder/main/canvas/topbar/avbutton/canvas_topbar_graph.js
import { AVButton } from "../../../../../../../../components/AVButton/AVButton.js";
import { CanvasBehaviors } from "../../../../../../../behavior/canvas_actions.js";

export function buildCanvasGraphBtn() {
    return new AVButton({
        direction: 'left', height: 40,
        states: [
            { icon: 'fa-solid fa-diagram-project', text: 'Grafo', width: 110, gap: 4, transitionDuration: 300, colors: { buttonBg: 'transparent', buttonBorder: 'var(--p-norm)', icon: 'var(--p-norm)', pillBg: 'rgba(139, 92, 246, 0.1)', pillBorder: 'var(--p-norm)', pillText: 'var(--p-norm)' } },
            { action: CanvasBehaviors.openGraph, icon: 'fa-solid fa-check', text: 'Aperto', width: 110, gap: 4, transitionDuration: 300, autoRevertDelay: 1500, colors: { buttonBg: 'rgba(139, 92, 246, 0.2)', buttonBorder: 'var(--p-norm)', icon: '#fff', pillBg: 'var(--p-norm)', pillBorder: 'var(--p-norm)', pillText: '#fff' } }
        ]
    });
}