const { app, BrowserWindow, Menu } = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    width: 1500,
    height: 900,
    webPreferences: {
      nodeIntegration: true
    },
    menuBarVisible: false  // Désactive la barre de menus
  })

  // Charge votre fichier HTML
  win.loadFile('index.html')

  // Maximiser la fenêtre immédiatement après sa création
  win.maximize()

  // Optionnel : Pour Windows et Linux, vous pouvez également supprimer le menu en utilisant :
  Menu.setApplicationMenu(null) // Supprime le menu par défaut
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
