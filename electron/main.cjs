const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

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
      sandbox: true
    },
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: true
  });

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

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
