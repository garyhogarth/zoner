
export const THEMES = [
    { id: 'zinc', name: 'Zinc' },
    { id: 'blue', name: 'Blue' },
    { id: 'rose', name: 'Rose' },
    { id: 'green', name: 'Green' },
    { id: 'orange', name: 'Orange' },
    { id: 'light', name: 'Light' },
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

    // Handle dark/light mode class
    if (theme === 'light') {
        root.classList.remove('dark')
    } else {
        root.classList.add('dark')
    }
}

// Initialize on load
export function initTheme() {
    setTheme(getStoredTheme())
}
