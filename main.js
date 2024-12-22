const { app, BrowserWindow, Menu } = require('electron');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1500,
    height: 1400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    menuBarVisible: false  // Désactive la barre de menus
  });

  // Charge l'URL hébergée sur GitHub Pages
  win.loadURL('https://freezyiii.github.io/FreezyFlix/');
  win.webContents.reloadIgnoringCache();


  // Maximiser la fenêtre immédiatement après sa création
  win.maximize();

  // Supprime le menu par défaut (optionnel)
  Menu.setApplicationMenu(null);

  // Utilisez un seul rechargement lors de l'ouverture de l'application
  win.webContents.once('did-finish-load', () => {
    // Si nécessaire, ici on pourrait vérifier si des changements ont eu lieu
    // Exemple d'une méthode conditionnelle pour vérifier si une mise à jour a été faite
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
