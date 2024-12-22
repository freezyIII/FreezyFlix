const { app, BrowserWindow, Menu } = require('electron');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1500,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    menuBarVisible: false  // Désactive la barre de menus
  });

  // Vider le cache avant de charger l'URL
  win.webContents.session.clearCache(() => {
    console.log('Cache vidé');
  });

  // Charge l'URL hébergée sur GitHub Pages
  win.loadURL('https://freezyiii.github.io/FreezyFlix/');

  // Maximiser la fenêtre immédiatement après sa création
  win.maximize();

  // Supprime le menu par défaut (optionnel)
  Menu.setApplicationMenu(null);

  // Optionnel : Utiliser un seul rechargement lors de l'ouverture de l'application
  win.webContents.once('did-finish-load', () => {
    const shouldReload = false; // Remplacez cette logique selon vos besoins
    if (shouldReload) {
      win.webContents.reloadIgnoringCache();
    }
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
