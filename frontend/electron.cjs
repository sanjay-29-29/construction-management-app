// electron.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Determine if we are in development mode (looking for Vite server)
// We check if the app is packaged, or if the environment variable says so
const isDev = !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Ease of use for migration; secure apps should set this to true later
    },
  });

  // VITE CONFIGURATION:
  // 1. Dev: Load localhost:5173 (Vite default)
  // 2. Prod: Load index.html from the 'dist' folder (Vite default build folder)
  const startURL = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, 'dist/index.html')}`;

  mainWindow.loadURL(startURL);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
