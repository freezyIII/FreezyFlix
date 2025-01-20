const { ipcRenderer } = require('electron');

// Écouter l'événement envoyé depuis le processus principal
ipcRenderer.on('update-active-users', (event, activeUsersCount) => {
  // Mettre à jour l'affichage du nombre d'utilisateurs actifs
  document.getElementById('active-users').innerText = `Utilisateurs actifs : ${activeUsersCount}`;
});
