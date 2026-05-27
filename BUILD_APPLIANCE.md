# Building the AI Radio Station Desktop Appliance

This guide explains how to build native desktop applications for Windows, macOS, and Linux.

## Architecture

- **Frontend**: React + Vite (bundled into the Tauri app)
- **Backend**: Python FastAPI server, bundled with PyInstaller into a standalone executable
- **Desktop Shell**: Tauri (Rust + system webview)

## Prerequisites

- Node.js 18+
- Rust (latest stable)
- Python 3.11+
- For Windows: Visual Studio Build Tools (for Rust)
- For macOS: Xcode Command Line Tools

## Step 1: Build the Python Backend

### On macOS / Linux

```bash
cd server
chmod +x build-backend.sh
./build-backend.sh
```

The executable will be at `server/dist/ai-radio-backend`.

### On Windows

```powershell
cd server
.\build-backend.ps1
```

Executable: `server\dist\ai-radio-backend.exe`

**Important**: Copy the resulting executable into `client/src-tauri/target/release/` or configure it as a Tauri sidecar/resource for production builds.

## Step 2: Build the Tauri Desktop App

```bash
cd client

# Development
npm run tauri:dev

# Production build
npm run tauri:build
```

The final installers will be in:
- `client/src-tauri/target/release/bundle/`

## Recommended Production Setup

For a polished appliance:

1. Use Tauri's sidecar feature to bundle the Python executable.
2. Add the backend binary to `tauri.conf.json` under `bundle.externalBin`.
3. Update Rust code to use `tauri::api::process::Command` for sidecar spawning instead of raw `std::process`.

Example sidecar configuration (advanced):

```json
"bundle": {
  "externalBin": ["../server/dist/ai-radio-backend"]
}
```

## Current Status (as of latest build)

- Basic Tauri shell: Ready
- System tray support: Implemented
- Backend auto-start: Implemented (spawns on launch)
- Python bundling scripts: Provided
- Full sidecar integration: Recommended next polish step

## Troubleshooting

- **Backend won't start**: Make sure the executable is in PATH or next to the app binary.
- **Port conflicts**: The desktop app uses port 8765 by default.
- **Antivirus false positives**: PyInstaller executables sometimes trigger this on Windows.

For a more robust solution, consider using Tauri's official sidecar pattern + `tauri-plugin-shell`.
