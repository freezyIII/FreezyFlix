const { app, BrowserWindow, Menu } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Ajouter ceci pour autoriser le rechargement
    },
    menuBarVisible: false  // Désactive la barre de menus
  });

  // Charge l'URL hébergée sur GitHub Pages
  win.loadURL('https://freezyiii.github.io/FreezyFlix/');

  // Maximiser la fenêtre immédiatement après sa création
  win.maximize();

  // Supprime le menu par défaut (optionnel)
  Menu.setApplicationMenu(null);

  // Forcer le rechargement de la page pour ne pas utiliser le cache
  win.webContents.on('did-finish-load', () => {
    win.webContents.reloadIgnoringCache();
  });
}

// Crée la fenêtre quand l'application est prête
app.whenReady().then(createWindow);

// Quitte l'application quand toutes les fenêtres sont fermées
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
