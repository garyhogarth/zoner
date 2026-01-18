
export interface Source {
    id: string
    name: string
    thumbnail: string
    appIcon?: string | null
}

export async function fetchUnifiedSources(): Promise<Source[]> {
    const sources: Source[] = []

    // 1. Fetch Desktop Sources (Screens & Windows)
    try {
        // @ts-ignore
        const desktopSources = await window.ipcRenderer.invoke('get-sources')
        sources.push(...desktopSources)
    } catch (e) {
        console.error('Failed to fetch desktop sources', e)
    }

    // 2. Fetch Webcams - Removed as per user request
    // Removed camera permission logic and enumeration

    return sources
}
