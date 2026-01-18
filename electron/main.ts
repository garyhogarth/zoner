import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, desktopCapturer } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DIST = path.join(__dirname, '../dist')
const VITE_PUBLIC = app.isPackaged ? DIST : path.join(__dirname, '../public')

process.env.DIST = DIST
process.env.VITE_PUBLIC = VITE_PUBLIC

// Disable hardware acceleration to fix screen capture "frosted glass" issues
app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null
let compositorWindow: BrowserWindow | null = null
let tray: Tray | null = null

// Track current source
let currentSourceId: string | null = null
let currentSourceName: string | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// Cached sources for tray menu
interface Source {
    id: string
    name: string
    thumbnail: string
    appIcon: string | null
}
let cachedSources: Source[] = []

// Fetch and cache sources
async function fetchSources(): Promise<Source[]> {
    const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 300, height: 200 },
        fetchWindowIcons: true // Get app icons!
    })
    cachedSources = sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL(),
        appIcon: source.appIcon ? source.appIcon.toDataURL() : null
    }))
    return cachedSources
}

// IPC Handlers
ipcMain.handle('get-sources', async () => {
    return await fetchSources()
})

ipcMain.handle('get-current-source', () => {
    return { id: currentSourceId, name: currentSourceName }
})

ipcMain.on('set-current-source', (event, { id, name }) => {
    currentSourceId = id
    currentSourceName = name
    updateTrayMenu()
})

// Resize compositor window (used when loading layouts)
ipcMain.on('resize-window', (event, { width, height }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
        win.setSize(Math.round(width), Math.round(height))
    }
})

// Navigate to specific source
function navigateToSource(sourceId: string) {
    if (!mainWindow) {
        createMainWindow()
    }

    const url = VITE_DEV_SERVER_URL
        ? `${VITE_DEV_SERVER_URL}#/preview?sourceId=${encodeURIComponent(sourceId)}`
        : `file://${path.join(DIST, 'index.html')}#/preview?sourceId=${encodeURIComponent(sourceId)}`

    mainWindow?.loadURL(url)
    mainWindow?.focus()
}

function createMainWindow() {
    if (mainWindow) {
        mainWindow.focus()
        return
    }

    width: 800,
        height: 600,
            title: 'Zoner',
                backgroundColor: '#000000',
                    hasShadow: false,
                        webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
            backgroundThrottling: false,
        },
})

const url = VITE_DEV_SERVER_URL
    ? `${VITE_DEV_SERVER_URL}#/`
    : `file://${path.join(DIST, 'index.html')}#/`

mainWindow.loadURL(url)

mainWindow.on('closed', () => {
    mainWindow = null
})
}

function createCompositorWindow() {
    if (compositorWindow) {
        compositorWindow.focus()
        return
    }

    compositorWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        title: 'Zoner Compositor',
        backgroundColor: '#000000',
        hasShadow: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            backgroundThrottling: false,
        },
    })

    const url = VITE_DEV_SERVER_URL
        ? `${VITE_DEV_SERVER_URL}#/compositor`
        : `file://${path.join(DIST, 'index.html')}#/compositor`

    compositorWindow.loadURL(url)

    compositorWindow.on('closed', () => {
        compositorWindow = null
    })
}

async function updateTrayMenu() {
    if (!tray) return

    // Refresh sources
    await fetchSources()

    const screens = cachedSources.filter(s => s.id.startsWith('screen:'))
    const windows = cachedSources.filter(s => s.id.startsWith('window:'))

    const menuTemplate: Electron.MenuItemConstructorOptions[] = [
        {
            label: currentSourceName ? `📺 ${currentSourceName}` : 'No source selected',
            enabled: false
        },
        { type: 'separator' },
        {
            label: 'Select Source', submenu: [
                { label: '🖥️ Screens', enabled: false },
                ...screens.map(s => ({
                    label: s.name,
                    type: 'radio' as const,
                    checked: s.id === currentSourceId,
                    click: () => navigateToSource(s.id)
                })),
                { type: 'separator' as const },
                { label: '🪟 Windows', enabled: false },
                ...windows.map(s => ({
                    label: s.name.length > 50 ? s.name.substring(0, 50) + '...' : s.name,
                    icon: s.appIcon ? nativeImage.createFromDataURL(s.appIcon).resize({ width: 16, height: 16 }) : undefined,
                    type: 'radio' as const,
                    checked: s.id === currentSourceId,
                    click: () => navigateToSource(s.id)
                }))
            ]
        },
        { type: 'separator' },
        {
            label: 'Open Selector', click: () => {
                if (mainWindow) {
                    const url = VITE_DEV_SERVER_URL
                        ? `${VITE_DEV_SERVER_URL}#/`
                        : `file://${path.join(DIST, 'index.html')}#/`
                    mainWindow.loadURL(url)
                    mainWindow.focus()
                } else {
                    createMainWindow()
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Open Zoner Compositor', click: () => {
                createCompositorWindow()
            }
        },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() },
    ]

    const contextMenu = Menu.buildFromTemplate(menuTemplate)
    tray.setContextMenu(contextMenu)
}

function createTray() {
    let iconPath = path.join(VITE_PUBLIC, 'tray.png')
    let icon = nativeImage.createFromPath(iconPath)

    if (icon.isEmpty()) {
        console.error("Tray icon is empty! Path was:", iconPath)
        icon = nativeImage.createEmpty()
    }

    const trayIcon = icon.resize({ width: 16, height: 16 })
    trayIcon.setTemplateImage(true)

    tray = new Tray(trayIcon)
    tray.setToolTip('Zoner')

    updateTrayMenu()
}

app.on('window-all-closed', () => {
    // Keep running in tray on macOS
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
    }
})

app.whenReady().then(() => {
    createTray()
})

