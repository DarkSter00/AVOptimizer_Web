// frontend/js/ui/builder/main/dashboard/sidemenu/avapplogo/main_sidemenu_logo.js
import { AVAppLogo } from "../../../../../../../components/AVAppLogo/AVAppLogo.js";

export function buildSideMenuLogo() {
    return new AVAppLogo({
        title: "A/V Optimizer",
        version: "v8.5 Core",
        icon: "fa-solid fa-layer-group",
        styles: {
            iconColor: 'var(--primary)',
            bg: 'transparent',
            border: 'transparent'
        }
    });
}