// database.js

// 1️⃣ Importer Firebase
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";

// 2️⃣ Configuration Firebase (remplace par la tienne si besoin)
const firebaseConfig = {
  apiKey: "AIzaSyBpYJDqmenBsPzchE9P5w_2Ir_mAeAgwYo",
  authDomain: "freezyflix-31913.firebaseapp.com",
  databaseURL: "https://freezyflix-31913-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "freezyflix-31913",
  storageBucket: "freezyflix-31913.firebasestorage.app",
  messagingSenderId: "641222658736",
  appId: "1:641222658736:web:ba4461fbc244d33f070975"
};

// 3️⃣ Initialiser Firebase
const app = initializeApp(firebaseConfig);

// 4️⃣ Auth et Realtime Database
export const auth = getAuth(app);
export const database = getDatabase(app);

// 5️⃣ Fonction pour créer un compte
export const signUp = async (email, password, username) => {
  try {
    // Créer l'utilisateur avec email et mot de passe
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Stocker des infos supplémentaires dans la base
    await set(ref(database, 'users/' + user.uid), {
      username: username,
      email: email,
      createdAt: new Date().toISOString()
    });

    console.log('Compte créé avec succès !', user.uid);
  } catch (error) {
    console.error('Erreur création compte :', error.message);
  }
};

