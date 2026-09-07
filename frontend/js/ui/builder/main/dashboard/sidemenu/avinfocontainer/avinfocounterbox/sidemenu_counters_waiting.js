// frontend/js/ui/builder/main/dashboard/sidemenu/avinfocounterbox/sidemenu_counters_waiting.js
import { AVInfoCounterBox } from "../../../../../../../../components/AVInfoCounterBox/AVInfoCounterBox.js";

const baseHoverWidget = { delay: 600, duration: 1500, text: 'Espansione dettagli...', icon: 'fa-solid fa-expand', color: 'var(--success)' };

export function buildWaitMeta() { return new AVInfoCounterBox({ label: "Attesa Meta", value: "0", icon: "fa-solid fa-magnifying-glass", color: "var(--f-attesa)", hoverWidget: baseHoverWidget }); }
export function buildWaitCombo() { return new AVInfoCounterBox({ label: "Attesa A/V", value: "0", icon: "fa-solid fa-photo-film", color: "var(--f-attesa)", hoverWidget: baseHoverWidget }); }
export function buildWaitVideo() { return new AVInfoCounterBox({ label: "Attesa Video", value: "0", icon: "fa-solid fa-film", color: "var(--f-attesa)", hoverWidget: baseHoverWidget }); }
export function buildWaitAudio() { return new AVInfoCounterBox({ label: "Attesa Audio", value: "0", icon: "fa-solid fa-headphones", color: "var(--f-attesa)", hoverWidget: baseHoverWidget }); }
export function buildWaitVol() { return new AVInfoCounterBox({ label: "Attesa Vol", value: "0", icon: "fa-solid fa-wave-square", color: "var(--f-attesa)", hoverWidget: baseHoverWidget }); }