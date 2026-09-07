// frontend/js/ui/builder/main/dashboard/sidemenu/avinfocounterbox/sidemenu_counter_active.js
import { AVInfoCounterBox } from "../../../../../../../../components/AVInfoCounterBox/AVInfoCounterBox.js";
import { SideMenuBehaviors } from "../../../../../../../behavior/sidemenu_actions.js";

export function buildCounterActiveProcesses() {
    return new AVInfoCounterBox({
        label: "In Elaborazione",
        value: "<span style='color: var(--text-muted)'>Nessuna operazione in corso...</span>",
        icon: "fa-solid fa-microchip",
        color: "var(--warning)",
        fullWidth: true,
        states: [
            { id: 'default' },
            { id: 'execute', icon: 'fa-solid fa-satellite-dish', text: 'Dettaglio Esecuzioni...', overlayBg: 'rgba(245, 158, 11, 0.15)', overlayColor: '#000', overlayBorder: 'var(--warning)', autoRevertDelay: 2000, action: SideMenuBehaviors.openProcessesModal }
        ]
    });
}