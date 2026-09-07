// frontend/js/ui/builder/main/dashboard/sidemenu/main_sidemenu.js
import { AVSideMenu } from "../../../../../../components/AVDashboardGlobalSideMenu/AVSideMenu.js";
import { buildSideMenuLogo } from "./avapplogo/main_sidemenu_logo.js";
import { buildSideMenuNav } from "./avinfocontainer/main_sidemenu_nav.js";
import { buildSideMenuStatsUp, buildSideMenuStatsDown } from "./avinfocontainer/main_sidemenu_stats.js";

export function buildMainSideMenu(containerId) {
    const appLogo = buildSideMenuLogo();
    const navContainer = buildSideMenuNav();
    const statsContainerUp = buildSideMenuStatsUp();
    const statsContainerDown = buildSideMenuStatsDown();

    return new AVSideMenu({
        containerId: containerId,
        backgroundColor: 'var(--bg-panel, #1e293b)',
        zoneStyles: {
            top: { padding: '10px 10px', border: 'none' },
            center: { padding: '10px 10px', gap: '5px' },
            bottom: { padding: '10px 10px 10px 10px', border: 'none', gap: '10px' }
        },
        items: {
            top: [appLogo],
            center: [navContainer],
            bottom: [statsContainerUp, statsContainerDown]
        }
    });
}