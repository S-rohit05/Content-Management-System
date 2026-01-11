export const formatDuration = (ms: number | undefined | null): string => {
    if (!ms) return '-';

    const minutes = Math.floor(ms / 60000);
    const seconds = Math.round((ms % 60000) / 1000);

    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    }

    if (minutes === 0) {
        return `${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;
};
