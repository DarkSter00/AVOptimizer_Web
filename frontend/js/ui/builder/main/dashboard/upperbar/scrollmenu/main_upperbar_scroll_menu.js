// frontend/js/ui/builder/main/dashboard/upperbar/scrollmenu/main_upperbar_scroll_menu.js
import { AVScrollMenu } from "../../../../../../../components/AVScrollMenu/AVScrollMenu.js";
import { UpperBarBehaviors } from "../../../../../../behavior/upperbar_actions.js";

export function buildScrollMenu() {
    return new AVScrollMenu({
        containerId: 'global-bar-center-zone', // L'ID generato dall'AVUpperBar
        centerActive: true,
        cardGap: 8,
        shrunkMargin: -10,
        hideDisabledButtons: false,
        btnPrevConfig: {
            direction: 'left', height: 38,
            states: [{ icon: 'fa-solid fa-chevron-left', text: '', pillIcon: '', width: 38, colors: { buttonBg: 'rgba(255,255,255,0.05)', buttonBorder: 'var(--border)', icon: '#fff', pillBg: 'transparent', pillBorder: 'transparent', pillText: 'transparent' } }]
        },
        btnNextConfig: {
            direction: 'right', height: 38,
            states: [{ icon: 'fa-solid fa-chevron-right', text: '', pillIcon: '', width: 38, colors: { buttonBg: 'rgba(255,255,255,0.05)', buttonBorder: 'var(--border)', icon: '#fff', pillBg: 'transparent', pillBorder: 'transparent', pillText: 'transparent' } }]
        },
        onItemClick: (item, index) => UpperBarBehaviors.changeCore(index),
        onPrevClick: (index) => UpperBarBehaviors.changeCore(index - 1),
        onNextClick: (index) => UpperBarBehaviors.changeCore(index + 1)
    });
}