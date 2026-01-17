import { app, ipcMain, BrowserWindow, desktopCapturer, nativeImage, Tray, Menu } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname$1, "../dist");
const VITE_PUBLIC = app.isPackaged ? DIST : path.join(__dirname$1, "../public");
process.env.DIST = DIST;
process.env.VITE_PUBLIC = VITE_PUBLIC;
let mainWindow = null;
let tray = null;
let currentSourceId = null;
let currentSourceName = null;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
let cachedSources = [];
async function fetchSources() {
  const sources = await desktopCapturer.getSources({
    types: ["screen", "window"],
    thumbnailSize: { width: 300, height: 200 },
    fetchWindowIcons: true
    // Get app icons!
  });
  cachedSources = sources.map((source) => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL(),
    appIcon: source.appIcon ? source.appIcon.toDataURL() : null
  }));
  return cachedSources;
}
ipcMain.handle("get-sources", async () => {
  return await fetchSources();
});
ipcMain.handle("get-current-source", () => {
  return { id: currentSourceId, name: currentSourceName };
});
ipcMain.on("set-current-source", (event, { id, name }) => {
  currentSourceId = id;
  currentSourceName = name;
  updateTrayMenu();
});
function navigateToSource(sourceId) {
  if (!mainWindow) {
    createMainWindow();
  }
  const url = VITE_DEV_SERVER_URL ? `${VITE_DEV_SERVER_URL}#/preview?sourceId=${encodeURIComponent(sourceId)}` : `file://${path.join(DIST, "index.html")}#/preview?sourceId=${encodeURIComponent(sourceId)}`;
  mainWindow?.loadURL(url);
  mainWindow?.focus();
}
function createMainWindow() {
  if (mainWindow) {
    mainWindow.focus();
    return;
  }
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: "Sub-Screen",
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  const url = VITE_DEV_SERVER_URL ? `${VITE_DEV_SERVER_URL}#/` : `file://${path.join(DIST, "index.html")}#/`;
  mainWindow.loadURL(url);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
async function updateTrayMenu() {
  if (!tray) return;
  await fetchSources();
  const screens = cachedSources.filter((s) => s.id.startsWith("screen:"));
  const windows = cachedSources.filter((s) => s.id.startsWith("window:"));
  const menuTemplate = [
    {
      label: currentSourceName ? `📺 ${currentSourceName}` : "No source selected",
      enabled: false
    },
    { type: "separator" },
    {
      label: "Select Source",
      submenu: [
        { label: "🖥️ Screens", enabled: false },
        ...screens.map((s) => ({
          label: s.name,
          type: "radio",
          checked: s.id === currentSourceId,
          click: () => navigateToSource(s.id)
        })),
        { type: "separator" },
        { label: "🪟 Windows", enabled: false },
        ...windows.map((s) => ({
          label: s.name.length > 50 ? s.name.substring(0, 50) + "..." : s.name,
          icon: s.appIcon ? nativeImage.createFromDataURL(s.appIcon).resize({ width: 16, height: 16 }) : void 0,
          type: "radio",
          checked: s.id === currentSourceId,
          click: () => navigateToSource(s.id)
        }))
      ]
    },
    { type: "separator" },
    {
      label: "Open Selector",
      click: () => {
        if (mainWindow) {
          const url = VITE_DEV_SERVER_URL ? `${VITE_DEV_SERVER_URL}#/` : `file://${path.join(DIST, "index.html")}#/`;
          mainWindow.loadURL(url);
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      }
    },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() }
  ];
  const contextMenu = Menu.buildFromTemplate(menuTemplate);
  tray.setContextMenu(contextMenu);
}
function createTray() {
  let iconPath = path.join(VITE_PUBLIC, "tray.png");
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    console.error("Tray icon is empty! Path was:", iconPath);
    icon = nativeImage.createEmpty();
  }
  const trayIcon = icon.resize({ width: 16, height: 16 });
  trayIcon.setTemplateImage(true);
  tray = new Tray(trayIcon);
  tray.setToolTip("Sub-Screen");
  updateTrayMenu();
}
app.on("window-all-closed", () => {
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
app.whenReady().then(() => {
  createTray();
});
