// frontend/js/ui/builder/main/dashboard/sidemenu/avinfocontainer/main_sidemenu_stats.js
import { AVInfoContainer } from "../../../../../../../components/AVInfoContainer/AVInfoContainer.js";
import { buildCounterCompleted, buildCounterSaved, buildCounterSkipped, buildCounterErrors } from "./avinfocounterbox/sidemenu_counters_primary.js";
import { buildCounterActiveProcesses } from "./avinfocounterbox/sidemenu_counter_active.js";
import { buildWaitMeta, buildWaitCombo, buildWaitVideo, buildWaitAudio, buildWaitVol } from "./avinfocounterbox/sidemenu_counters_waiting.js";

export function buildSideMenuStatsUp() {
    return new AVInfoContainer({
        itemGap: '5px', rowGap: '5px', padding: '5px', margin: '5px 0 0 0',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: '12px',
        rows: [
            [buildCounterCompleted(), buildCounterSaved()],
            [buildCounterSkipped(), buildCounterErrors()],
            [buildCounterActiveProcesses()]
        ]
    });
}

export function buildSideMenuStatsDown() {
    return new AVInfoContainer({
        itemGap: '5px', rowGap: '5px', padding: '5px', margin: '5px 0 0 0',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: '12px',
        rows: [
            [buildWaitMeta(), buildWaitCombo()],
            [buildWaitVideo(), buildWaitAudio()],
            [buildWaitVol()]
        ]
    });
}