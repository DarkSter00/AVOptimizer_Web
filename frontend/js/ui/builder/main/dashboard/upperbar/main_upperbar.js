// frontend/js/ui/builder/main/dashboard/upperbar/main_upperbar.js
import { AVUpperBar } from "../../../../../../components/AVDashboardGlobalBar/AVUpperBar.js";
import { buildSideMenuButton } from "./avbutton/main_upperbar_side_menu.js";
import { buildImportFolderButton } from "./avbutton/main_upperbar_import_new_folder.js";
import { buildHardResetButton } from "./avbutton/main_upperbar_hard_reset.js";
import { buildScrollMenu } from "./scrollmenu/main_upperbar_scroll_menu.js";

export function buildMainUpperBar(containerId, hasCores) {
    const btnSideMenu = buildSideMenuButton();
    const btnAddFolder = buildImportFolderButton();
    const btnHardReset = buildHardResetButton();

    const upperBar = new AVUpperBar({
        containerId: containerId,
        height: '64px', padding: '0 12px', gap: '24px', innerGap: '12px',
        bg: 'var(--bg-panel, #1e293b)', border: '1px solid rgba(255,255,255,0.05)', radius: '32px',
        leftItems: [btnSideMenu, btnAddFolder],
        centerItems: [], // Zona popolata dal render dell'AVScrollMenu
        rightItems: [btnHardReset],
        expanded: hasCores
    });

    return {
        bar: upperBar,
        btnAddFolder: btnAddFolder,
        createScrollMenu: () => buildScrollMenu()
    };
}