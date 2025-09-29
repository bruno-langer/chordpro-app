import { app, shell, BrowserWindow } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';

import { SongLibrary, SongCache } from '../core/library';
import { registerIpcHandlers } from './ipcHandlers';

// ============================================================================
// GLOBAL INSTANCES
// ============================================================================

const library = new SongLibrary();
const cache = new SongCache(library);

// ============================================================================
// WINDOW MANAGEMENT
// ============================================================================

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: is.dev
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// ============================================================================
// APP LIFECYCLE
// ============================================================================

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.chordview');

  // Watch window shortcuts (F12 for DevTools)
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Register IPC handlers
  registerIpcHandlers(library, cache);

  // Create main window
  createWindow();

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    library.close();
    app.quit();
  }
});

// Cleanup on quit
app.on('before-quit', () => {
  library.close();
});