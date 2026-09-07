// frontend/js/ui/builder/main/canvas/topbar/main_canvas_topbar.js
import { buildCanvasFullscreenBtn } from "./avbutton/canvas_topbar_fullscreen.js";
import { buildCanvasTitleBox } from "./avtitlebox/canvas_topbar_title.js";
import { buildCanvasGraphBtn } from "./avbutton/canvas_topbar_graph.js";
import { buildCanvasDeleteBtn } from "./avbutton/canvas_topbar_delete.js";

export function buildCanvasTopBarConfig() {
    const btnFullscreen = buildCanvasFullscreenBtn();
    const titleBox = buildCanvasTitleBox();
    const btnGraph = buildCanvasGraphBtn();
    const btnDelete = buildCanvasDeleteBtn();

    const topBarConfig = {
        height: '56px', padding: '0 20px', gap: '16px', innerGap: '12px',
        bg: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)', radius: '50px',
        leftItems: [btnFullscreen],
        centerItems: [titleBox],
        rightItems: [btnGraph, btnDelete],
        expanded: true
    };

    // Restituiamo anche il titleBox perché il dashboard orchestrator ha bisogno di inviargli i testi in realtime
    return { topBarConfig, titleBox };
}