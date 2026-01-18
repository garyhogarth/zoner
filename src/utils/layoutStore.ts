import type { ViewMode } from '../components/SourceToolbar'

// Types for saved layouts
export interface SavedSourceState {
    sourceId: string
    sourceName: string
    x: number
    y: number
    width: number
    height: number
    scale: number
    pan: { x: number; y: number }
    viewMode: ViewMode
    layerOrder: number
}

export interface SavedLayout {
    id: string
    name: string
    createdAt: number
    windowSize: { width: number; height: number }
    sources: SavedSourceState[]
}

const STORAGE_KEY = 'compositor-layouts'

// Get all saved layouts
export function loadLayouts(): SavedLayout[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        if (!data) return []
        return JSON.parse(data) as SavedLayout[]
    } catch (e) {
        console.error('Failed to load layouts:', e)
        return []
    }
}

// Save a new layout
export function saveLayout(
    name: string,
    windowSize: { width: number; height: number },
    sources: SavedSourceState[]
): SavedLayout {
    const layouts = loadLayouts()

    const newLayout: SavedLayout = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        name,
        createdAt: Date.now(),
        windowSize,
        sources,
    }

    layouts.push(newLayout)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts))

    return newLayout
}

// Get a specific layout by ID
export function getLayout(id: string): SavedLayout | null {
    const layouts = loadLayouts()
    return layouts.find(l => l.id === id) || null
}

// Delete a layout by ID
export function deleteLayout(id: string): void {
    const layouts = loadLayouts()
    const filtered = layouts.filter(l => l.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

// Update an existing layout
export function updateLayout(id: string, updates: Partial<Omit<SavedLayout, 'id' | 'createdAt'>>): SavedLayout | null {
    const layouts = loadLayouts()
    const index = layouts.findIndex(l => l.id === id)

    if (index === -1) return null

    layouts[index] = { ...layouts[index], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts))

    return layouts[index]
}
