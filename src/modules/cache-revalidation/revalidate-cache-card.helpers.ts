export function formatRevalidatedAt(isoDate: string): string {
    return new Date(isoDate).toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}
