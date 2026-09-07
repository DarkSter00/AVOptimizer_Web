// frontend/js/behavior/upperbar_actions.js

export const UpperBarBehaviors = {
    toggleSideMenu: () => {
        document.body.classList.toggle('menu-open');
    },

    importNewFolder: () => {
        if (window.addFolder) window.addFolder();
    },

    confirmHardReset: () => {
        if (window.resetAllConfirm) window.resetAllConfirm();
    },

    changeCore: (index) => {
        if (window.changeCoreWithAnimation) window.changeCoreWithAnimation(index);
    }
};