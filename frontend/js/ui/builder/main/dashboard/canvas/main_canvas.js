// frontend/js/ui/builder/main/canvas/main_canvas.js
import { AVCanvas } from "../../../../../../components/AVCanvas/AVCanvas.js";
import { buildCanvasTopBarConfig } from "./topbar/main_canvas_topbar.js";

export function buildMainCanvas(containerId) {
    const topBarSetup = buildCanvasTopBarConfig();

    const mainCanvas = new AVCanvas({
        containerId: containerId,
        columns: 2,
        styles: {
            bg: 'var(--bg-card)', border: '1px solid var(--border)',
            colGap: '30px', itemGap: '30px', workPadding: '10px 30px 80px 30px',
            topbarPadding: '20px 30px 10px 30px'
        },
        topBarConfig: topBarSetup.topBarConfig
    });

    // Passiamo l'istanza del canvas e il riferimento al titleBox
    return {
        canvas: mainCanvas,
        titleBox: topBarSetup.titleBox
    };
}