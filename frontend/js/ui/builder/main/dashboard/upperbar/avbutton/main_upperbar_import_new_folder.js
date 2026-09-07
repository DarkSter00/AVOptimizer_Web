// frontend/js/ui/builder/main/dashboard/upperbar/avbutton/main_upperbar_import_new_folder.js
import { AVButton } from "../../../../../../../components/AVButton/AVButton.js";
import { UpperBarBehaviors } from "../../../../../../behavior/upperbar_actions.js";

export function buildImportFolderButton() {
    const btnAdd = new AVButton({
        direction: 'right', height: 42,
        states: [
            {
                icon: 'fa-solid fa-folder-plus', text: 'Aggiungi cartella', pillIcon: '',
                width: 190, gap: 4, transitionDuration: 350, autoRevertDelay: 0, hoverEnterDelay: 250, hoverLeaveDelay: 1200,
                glow: { enabled: false },
                colors: { buttonBg: 'rgba(59, 130, 246, 0.1)', buttonBorder: 'var(--primary)', icon: 'var(--primary)', pillBg: 'rgba(255, 255, 255, 0.08)', pillBorder: 'rgba(255, 255, 255, 0.15)', pillText: 'var(--text-main)' }
            },
            {
                action: UpperBarBehaviors.importNewFolder,
                icon: 'fa-solid fa-check', text: 'Apertura in corso...', pillIcon: '',
                width: 200, gap: 5, transitionDuration: 300, autoRevertDelay: 1500,
                glow: { enabled: false },
                colors: { buttonBg: 'rgba(16, 185, 129, 0.2)', buttonBorder: 'var(--success)', icon: 'var(--success)', pillBg: 'var(--success)', pillBorder: 'var(--success)', pillText: '#000' }
            }
        ]
    });
    btnAdd.getNode().id = "btn-add-folder-smart";
    return btnAdd;
}