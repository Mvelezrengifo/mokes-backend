const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess;

function isDev() {
  return !app.isPackaged;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });

  const indexPath = isDev()
    ? path.join(__dirname, '../frontend/dist/index.html')
    : path.join(process.resourcesPath, 'dist/index.html');

  win.loadFile(indexPath);
}

function startBackend() {
  const serverPath = isDev()
    ? path.join(__dirname, '../src/backend/server.js')
    : path.join(process.resourcesPath, 'backend/server.js');

  backendProcess = spawn(process.execPath, [serverPath], { stdio: 'inherit' });
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (backendProcess) backendProcess.kill();
});
