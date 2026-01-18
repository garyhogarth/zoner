
export const THEMES = [
    { id: 'zinc', name: 'Zinc' },
    { id: 'blue', name: 'Blue' },
    { id: 'rose', name: 'Rose' },
    { id: 'green', name: 'Green' },
    { id: 'orange', name: 'Orange' },
] as const

export type ThemeId = typeof THEMES[number]['id']

const THEME_KEY = 'compositor-theme'

export function getStoredTheme(): ThemeId {
    return (localStorage.getItem(THEME_KEY) as ThemeId) || 'zinc'
}

export function setTheme(theme: ThemeId) {
    // Save to storage
    localStorage.setItem(THEME_KEY, theme)

    // Apply to DOM
    const root = document.documentElement
    root.setAttribute('data-theme', theme)

    // Also force dark mode for now as base
    root.classList.add('dark')
}

// Initialize on load
export function initTheme() {
    setTheme(getStoredTheme())
}
