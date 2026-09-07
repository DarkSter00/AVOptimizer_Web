// frontend/js/ui/builder/main/canvas/topbar/avtitlebox/canvas_topbar_title.js
import { AVTitleBox } from "../../../../../../../../components/AVTitleBox/AVTitleBox.js";

export function buildCanvasTitleBox() {
    const titleBox = new AVTitleBox({
        title: "Nessun Core",
        styles: {
            bg: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            padding: '6px 8px 6px 16px',
            maxWidth: '450px',
            minWidth: '200px'
        }
    });
    titleBox.getNode().classList.add('is-squishable');
    return titleBox;
}