// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // Import pour Realtime Database
// (Analytics est optionnel, inutile ici sauf si nécessaire)

// Votre configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDkP4QHxTdz6e3LCZfrWQxg-8gLNSb1zaA",
  authDomain: "freezyflix-1e31a.firebaseapp.com",
  databaseURL: "https://freezyflix-1e31a-default-rtdb.firebaseio.com",
  projectId: "freezyflix-1e31a",
  storageBucket: "freezyflix-1e31a.firebasestorage.app",
  messagingSenderId: "381135175943",
  appId: "1:381135175943:web:8823af295af3841e18c5a2",
  measurementId: "G-VG4DNT8B5P",
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Initialisation de Realtime Database
const database = getDatabase(app);

// Exportation pour utilisation dans d'autres fichiers
export { database };
