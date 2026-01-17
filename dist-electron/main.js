import { app, ipcMain, desktopCapturer, BrowserWindow, nativeImage, Tray, Menu } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname$1, "../dist");
const VITE_PUBLIC = app.isPackaged ? DIST : path.join(__dirname$1, "../public");
process.env.DIST = DIST;
process.env.VITE_PUBLIC = VITE_PUBLIC;
let mainWindow = null;
let tray;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
ipcMain.handle("get-sources", async () => {
  const sources = await desktopCapturer.getSources({ types: ["screen", "window"], thumbnailSize: { width: 300, height: 200 } });
  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL()
  }));
});
ipcMain.on("log", (event, ...args) => {
  console.log("[Renderer]", ...args);
});
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
function createTray() {
  let iconPath = path.join(VITE_PUBLIC, "tray.png");
  console.log("Tray icon path:", iconPath);
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    console.error("Tray icon is empty! Path was:", iconPath);
    icon = nativeImage.createEmpty();
  }
  const trayIcon = icon.resize({ width: 16, height: 16 });
  trayIcon.setTemplateImage(true);
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    { label: "Open", click: () => createMainWindow() },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() }
  ]);
  tray.setToolTip("Sub-Screen");
  tray.setContextMenu(contextMenu);
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") ;
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) ;
});
app.whenReady().then(() => {
  createTray();
});
