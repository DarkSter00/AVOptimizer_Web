// frontend/js/ui/builder/main/dashboard/sidemenu/avinfocontainer/main_sidemenu_nav.js
import { AVMenuButton } from "../../../../../../../components/AVMenuButton/AVMenuButton.js";
import { AVInfoContainer } from "../../../../../../../components/AVInfoContainer/AVInfoContainer.js";
import { SideMenuBehaviors } from "../../../../../../behavior/sidemenu_actions.js";

export function buildSideMenuNav() {
    const btnSettings = new AVMenuButton({ label: "Impostazioni", icon: "fa-solid fa-gear", onClick: SideMenuBehaviors.openSettings });
    const btnLog = new AVMenuButton({ label: "Log di Sistema", icon: "fa-solid fa-rectangle-list", onClick: SideMenuBehaviors.openLog });
    const btnDb = new AVMenuButton({ label: "Visualizza Database", icon: "fa-solid fa-database", onClick: SideMenuBehaviors.openDatabase });

    return new AVInfoContainer({
        itemGap: '5px', rowGap: '5px', padding: '5px', margin: '5px 0 0 0',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: '12px',
        rows: [ [btnSettings], [btnLog], [btnDb] ]
    });
}