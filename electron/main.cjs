const { app, BrowserWindow, Menu, shell, ipcMain, Notification, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#05070f',
    icon: path.join(__dirname, '../build/icon.ico'),
    title: 'GURU — SPOT THE SMART MONEY.',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: true
  });

  mainWindow = win;

  // Load the Vite build (relative paths required — vite base './')
  const indexPath = path.join(__dirname, '../dist/index.html');

  if (!fs.existsSync(indexPath)) {
    console.error('[GURU] dist/index.html missing at:', indexPath);
  }

  win.loadFile(indexPath).catch((err) => {
    console.error('[GURU] loadFile failed:', err);
  });

  // Surface load failures instead of staying blank
  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error(`[GURU] did-fail-load ${code} ${desc} url=${url}`);
  });
  win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    if (level >= 2) console.error(`[GURU][renderer:${sourceId}:${line}] ${message}`);
  });
  win.webContents.on('render-process-gone', (_e, details) => {
    console.error('[GURU] render-process-gone:', details);
  });

  // Show when ready, with fallback so we never sit blank forever
  let shown = false;
  const doShow = () => { if (!shown) { shown = true; win.show(); } };
  win.once('ready-to-show', doShow);
  setTimeout(doShow, 4000);

  // Open external links in browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Minimal menu
  const menu = Menu.buildFromTemplate([
    { label: 'GURU', submenu: [
      { role: 'reload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'quit' }
    ]},
    { label: 'View', submenu: [
      { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' }, { type:'separator' }, { role:'togglefullscreen' }
    ]}
  ]);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  // IPC handlers for desktop notifications with sound
  ipcMain.handle('guru:notify', async (_e, { title, body, sound, tag }) => {
    try {
      if (sound) playSound(sound);
      const notif = new Notification({
        title,
        body,
        icon: nativeImage.createFromPath(path.join(__dirname, '../build/icon.png')),
        silent: !sound,
        tag,
      });
      notif.show();
      return { success: true };
    } catch (err) {
      console.error('[GURU] Notification failed:', err);
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('guru:play-sound', async (_e, soundType) => {
    try {
      playSound(soundType);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('guru:check-notification-permission', async () => {
    return Notification.isSupported();
  });
});

function playSound(type: 'alert' | 'match' | 'custom') {
  // Use system beep as fallback, or play audio file if available
  try {
    if (type === 'alert') {
      // System alert sound
      if (process.platform === 'win32') {
        const { exec } = require('child_process');
        exec('powershell -c "[console]::beep(880,300); [console]::beep(440,300)"');
      } else {
        // macOS/Linux
        const { exec } = require('child_process');
        exec('afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null || beep');
      }
    } else if (type === 'match') {
      if (process.platform === 'win32') {
        const { exec } = require('child_process');
        exec('powershell -c "[console]::beep(660,100); [console]::beep(880,100); [console]::beep(1320,200)"');
      } else {
        const { exec } = require('child_process');
        exec('afplay /System/Library/Sounds/Ping.aiff 2>/dev/null || paplay /usr/share/sounds/freedesktop/stereo/message-new-instant.oga 2>/dev/null || beep');
      }
    }
  } catch (err) {
    console.error('[GURU] Sound playback failed:', err);
  }
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });