function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const isNegative = bytes < 0;
    const absBytes = Math.abs(bytes);
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(absBytes) / Math.log(k));
    const val = parseFloat((absBytes / Math.pow(k, i)).toFixed(2));
    return (isNegative ? '-' : '') + val + ' ' + sizes[i];
}

function formatTime(seconds) {
    if (!seconds) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
}

function getSafeId(str) {
    if (!pathIdMap.has(str)) {
        pathIdCounter++;
        pathIdMap.set(str, "card_" + pathIdCounter);
    }
    return pathIdMap.get(str);
}

function getCategoryColor(category) {
    if (category === 'error') return 'danger';
    if (category === 'completed') return 'success';
    if (category === 'skipped') return 'cyan';
    if (category === 'analyzed_waiting') return 'purple';
    return 'dark';
}