import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen, desktopCapturer } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// fileURLToPath is needed because in ESM __dirname is not defined
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─ dist
// │ ├─ index.html
// │ ├─ assets
// │ └─ ...
// ├─┬─ dist-electron
// │ ├─ main.js
// │ └─ preload.js
//
const DIST = path.join(__dirname, '../dist')
const VITE_PUBLIC = app.isPackaged ? DIST : path.join(__dirname, '../public')

process.env.DIST = DIST
process.env.VITE_PUBLIC = VITE_PUBLIC

// let selectorWindow: BrowserWindow | null = null
let mainWindow: BrowserWindow | null = null
let tray: Tray | null

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// IPC Handlers
ipcMain.handle('get-sources', async () => {
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 300, height: 200 } })
    return sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL()
    }))
})


function createMainWindow() {
    if (mainWindow) {
        mainWindow.focus()
        return
    }

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Sub-Screen',
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
        },
    })

    // Load the selector route
    const url = VITE_DEV_SERVER_URL
        ? `${VITE_DEV_SERVER_URL}#/`
        : `file://${path.join(DIST, 'index.html')}#/`

    mainWindow.loadURL(url)

    // Clean up
    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

function createTray() {
    // Ensure we have an icon. In dev, it might be in public folder directly.
    let iconPath = path.join(VITE_PUBLIC, 'vite.svg')

    // Checking if file exists (optional, but good for debug)
    // console.log('Tray icon path:', iconPath)

    const icon = nativeImage.createFromPath(iconPath)
    // Resize strictly for tray
    const trayIcon = icon.resize({ width: 16, height: 16 })

    tray = new Tray(trayIcon)
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open', click: () => createMainWindow() },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() },
    ])

    tray.setToolTip('Sub-Screen')
    tray.setContextMenu(contextMenu)
}


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // app.quit() 
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        // createMainWindow()
    }
})

app.whenReady().then(() => {
    createTray()
})
