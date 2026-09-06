window.toggleCard = function(subPath, safeId) {
    if (expandedCards.has(subPath)) {
        expandedCards.delete(subPath);
        userOpenedCards.delete(subPath);
    } else {
        expandedCards.add(subPath);
        userOpenedCards.add(subPath);
    }
    if (lastMetrics) window.processRenderLogic(lastMetrics);
}

window.isTransitioningCore = false;