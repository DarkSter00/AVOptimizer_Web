// frontend/js/ui/builder/main/dashboard/sidemenu/avinfocontainer/avinfocounterbox/sidemenu_counters_primary.js
import { AVInfoCounterBox} from "../../../../../../../../components/AVInfoCounterBox/AVInfoCounterBox.js";
import { SideMenuBehaviors} from "../../../../../../../behavior/sidemenu_actions.js";

const baseHoverWidget = { delay: 600, duration: 1500, text: 'Espansione dettagli...', icon: 'fa-solid fa-expand', color: 'var(--success)' };

const getStandardStates = (actionCallback) => [
    { id: 'default' },
    { id: 'confirm', icon: 'fa-solid fa-arrow-up-right-from-square', text: 'Apri', overlayBg: 'rgba(59, 130, 246, 0.15)', overlayColor: '#fff', overlayBorder: 'var(--primary)', autoRevertDelay: 3000 },
    { id: 'execute', icon: 'fa-solid fa-spinner fa-spin', text: 'Apro', overlayBg: 'rgba(16, 185, 129, 0.15)', overlayColor: '#fff', overlayBorder: 'var(--success)', autoRevertDelay: 1500, action: actionCallback }
];

export function buildCounterCompleted() {
    return new AVInfoCounterBox({ label: "Completati", value: "0", icon: "fa-solid fa-check", color: "var(--success)", hoverWidget: baseHoverWidget, states: getStandardStates(SideMenuBehaviors.openCompleted) });
}

export function buildCounterSaved() {
    return new AVInfoCounterBox({ label: "Spazio", value: "0 B", extraInfo: "Risparmiato", icon: "fa-solid fa-hard-drive", color: "var(--primary)", hoverWidget: baseHoverWidget, states: getStandardStates(SideMenuBehaviors.openStorage) });
}

export function buildCounterSkipped() {
    return new AVInfoCounterBox({ label: "Saltati", value: "0", icon: "fa-solid fa-forward-step", color: "var(--cyan)", hoverWidget: baseHoverWidget });
}

export function buildCounterErrors() {
    return new AVInfoCounterBox({ label: "Errori", value: "0", icon: "fa-solid fa-xmark", color: "var(--danger)", hoverWidget: baseHoverWidget });
}