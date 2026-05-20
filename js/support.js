import { auth, db } from './database.js';
import { setDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

// ---- Sélecteurs ----
const form = document.getElementById('supportForm');
const toast = document.getElementById('toast');
const typeSelect = document.getElementById('type');
const messageInput = document.getElementById('message');
const urlInput = document.getElementById('url') || null;
const submitBtn = form.querySelector('button[type="submit"]');
const charCount = document.querySelector('.char-count');

// ---- Reset messages d'erreur au typing ----
[typeSelect, messageInput, urlInput].filter(Boolean).forEach(el => el.addEventListener('input', () => {
  const span = el.nextElementSibling;
  span.textContent = '';
  span.classList.remove('active');
}));

messageInput.addEventListener('input', () => {
  if (charCount) charCount.textContent = `${messageInput.value.length} / 2000`;
});

// ---- Fonction Toast ----
function showToast(msg, duration = 3000) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ---- Fonction pour sauvegarder le support ----
async function saveSupport(user, formData) {
  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};
    const userName = userData.nomUtilisateur || user.displayName || "Utilisateur";

    // Génération d'un ID unique pour Firestore
    const docId = `${user.uid}_${Date.now()}`;
    await setDoc(doc(db, "support", docId), {
      ...formData,
      userId: user.uid,
      userName,
      userEmail: userData.email || user.email || "",
      userPhotoURL: userData.photoURL || user.photoURL || "",
      status: "nouveau",
      createdAt: serverTimestamp(),
      date: new Date().toISOString()
    });
    showToast("Message envoyé !");
    return true;
  } catch (err) {
    console.error("Erreur Firebase :", err);
    showToast("Erreur lors de l'envoi. Réessayez !");
    return false;
  }
}

// ---- Submit du formulaire ----
form.addEventListener('submit', async e => {
  e.preventDefault();
  submitBtn.disabled = true;

  const user = auth.currentUser;
  if (!user) {
    showToast("Vous devez être connecté pour envoyer un message !");
    submitBtn.disabled = false;
    return;
  }

  // ---- Validation du formulaire ----
  let isValid = true;

  if (!typeSelect.value) {
    typeSelect.nextElementSibling.textContent = "Veuillez sélectionner un type de demande.";
    typeSelect.nextElementSibling.classList.add("active");
    isValid = false;
  }

  if (!messageInput.value.trim()) {
    messageInput.nextElementSibling.textContent = "Veuillez saisir un message.";
    messageInput.nextElementSibling.classList.add("active");
    isValid = false;
  }

  if (urlInput && urlInput.value.trim()) {
    try {
      new URL(urlInput.value);
    } catch {
      urlInput.nextElementSibling.textContent = "Veuillez saisir une URL valide.";
      urlInput.nextElementSibling.classList.add("active");
      isValid = false;
    }
  }

  if (!isValid) {
    submitBtn.disabled = false;
    return;
  }

  // ---- Préparer les données et sauvegarder ----
  const formData = {
    type: typeSelect.value,
    message: messageInput.value.trim()
  };

  if (urlInput && urlInput.value.trim()) {
    formData.url = urlInput.value.trim();
  }

  const saved = await saveSupport(user, formData);

  if (saved) {
    form.reset();
    if (charCount) charCount.textContent = "0 / 2000";
  }
  submitBtn.disabled = false;
});
