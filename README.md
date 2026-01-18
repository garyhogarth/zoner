# Zoner

**Zoner** is a multi-window compositing tool for macOS, built with Electron, React, and Vite. It allows you to mirror specific windows or screens into a unified dashboard, enabling custom layouts, picture-in-picture monitoring, and advanced window management.

## Features

### 🪟 Advanced Window Management
- **Draggable & Resizable**: Freely arrange source windows.
- **Smart Opacity**:
  - Active/Hovered windows stay at **90% opacity**.
  - Background windows dim to **40% opacity** to reduce clutter.
  - When the app is unfocused, all windows dim to **70%**.
- **Always on Top**: Zoner stays floating above other apps for easy monitoring.

### 🎮 Interaction
- **Hover Controls**: UI controls (Close, Zoom, Source Switcher) only appear when you hover a window.
- **Double-Click**: Bring any window to the front instantly.
- **Cmd + Drag**: Hold `Cmd` to drag a window from anywhere, even over content.
- **Touch Gestures**:
  - **Pan**: Two-finger scroll to pan video content.
  - **Zoom**: Pinch-to-zoom (or Ctrl+Scroll) to scale content.
- **Hide Cursor**: Video stream hides the captured system cursor (where possible) or hides the local cursor on hover to prevent "double cursor" issues.

### 📐 Layout Presets
Quickly snap windows to common grids:
- **Halves** (Left, Right, Top, Bottom)
- **Corners** (Top-Left, Bottom-Right, etc.)
- **Thirds** & **Fourths** & **Sixths** (Column and grid layouts)
- **Center Focus**

## Development

### Prerequisites
- Node.js (v18+)
- npm

### Setup
```bash
git clone https://github.com/your-repo/zoner.git
cd zoner
npm install
```

### Run Locally
```bash
# Start Vite dev server + Electron
npm run dev
```

### Test
```bash
# Run unit tests with Vitest
npm test
```

### Build
```bash
# Compile and package for macOS (creates .dmg and .zip in release/ folder)
npm run build
```

## Release
Releases are automated via GitHub Actions.
1. Push a tag starting with `v` (e.g., `v1.0.0`).
2. The workflow will build, sign (if configured), and publish a GitHub Release with artifacts.

## Architecture
- **Tech Stack**: Electron, React, TypeScript, Vite.
- **State**: LocalStorage persistence for window layouts.
- **Capture**: Uses `desktopCapturer` and `getUserMedia` for low-latency mirroring.
