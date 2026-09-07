// frontend/js/behavior/scanner_manager.js
import { AVNotificationCenter } from "../../components/AVNotificationCenter/AVNotificationCenter.js";
import { AVNotification } from "../../components/AVNotification/AVNotification.js";

const SCANNER_NOTIF_ID = "sys_scanner_01";

export const ScannerManager = {
    processScanMetrics: (globalMetrics) => {
        const center = AVNotificationCenter.instance;
        if (!center) return;

        if (globalMetrics.is_scanning) {
            let stepName = "Inizializzazione...";
            let fileStr = globalMetrics.scan_file || "Attendere...";
            let subStr = ""; // Nuovo: per il contatore
            let progress = globalMetrics.scan_progress || 0;

            if (globalMetrics.scan_step === 1) {
                stepName = "Mappatura disco..."; progress = 5;
            } else if (globalMetrics.scan_step === 2) {
                stepName = "Interrogazione Database RAM..."; progress = 10;
            } else if (globalMetrics.scan_step === 3) {
                stepName = "Lettura Cache DB Metadati";
                fileStr = globalMetrics.scan_file || "Controllo file in cache...";
            } else if (globalMetrics.scan_step === 4) {
                stepName = "Estrazione Metadati (ffprobe)";
                // Splittiamo il testo: "10/100 | /path/al/file.mp4"
                if (globalMetrics.scan_file && globalMetrics.scan_file.includes('|')) {
                    const parts = globalMetrics.scan_file.split('|');
                    subStr = parts[0].trim(); // "10/100"
                    fileStr = parts.slice(1).join('|').trim(); // "/path/al/file.mp4"
                }
            }

            if (!center.notifications.has(SCANNER_NOTIF_ID)) {
                const scanNotif = new AVNotification({
                    id: SCANNER_NOTIF_ID, type: 'building', title: stepName,
                    message: fileStr, subMessage: subStr, progress: progress
                });
                center.addNotification(scanNotif);
            } else {
                center.updateNotification(SCANNER_NOTIF_ID, {
                    type: 'building', title: stepName,
                    message: fileStr, subMessage: subStr, progress: progress
                });
            }
        } else {
            if (center.notifications.has(SCANNER_NOTIF_ID)) {
                center.updateNotification(SCANNER_NOTIF_ID, {
                    type: 'info', title: 'Scansione Completata',
                    message: 'Tutti i file sono sincronizzati e pronti.', subMessage: '', progress: 100
                });
                setTimeout(() => { center.removeNotification(SCANNER_NOTIF_ID); }, 2500);
            }
        }
    }
};