import { auth, db } from './database.js';
import {doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, deleteDoc}
from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import {updateProfile,onAuthStateChanged,reauthenticateWithPopup,GoogleAuthProvider,deleteUser,signOut} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

const profileAvatar = document.getElementById('profileAvatar');
const profilePseudo = document.getElementById('profilePseudo');
const profileFirstname = document.getElementById('profileFirstname');
const profileDescription = document.getElementById('profileDescription');
const panelAvatar = document.getElementById('panelAvatar');

const usernameInput = document.getElementById('username');
const usernameCounter = document.getElementById('usernameCounter');
const firstnameInput = document.getElementById('firstname');
const firstnameCounter = document.getElementById('firstnameCounter');
const descriptionInput = document.getElementById('description');
const descriptionCounter = document.getElementById('descriptionCounter');

const editProfileBtn = document.querySelector('.edit-profile-btn');
const editProfilePanel = document.getElementById('editProfilePanel');
const closePanelBtn = document.querySelector('.close-panel');
const cancelBtn = document.querySelector('.cancel-btn');

const panelAvatarWrapper = document.querySelector('.panel-avatar-wrapper');
const changeAvatarPanel = document.getElementById('changeAvatarPanel');
const closeChangeAvatar = changeAvatarPanel.querySelector('.close-panel');
const cancelChangeAvatar = changeAvatarPanel.querySelector('.cancel-btn');
const changeAvatarForm = document.getElementById('changeAvatarForm');
const avatarUrlInput = document.getElementById('avatarUrl');

const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const deleteConfirmPopup = document.getElementById('deleteConfirmPopup');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDelete');

const favoritesContent = document.getElementById('favoritesContent');
const evaluationContent = document.getElementById('evaluationContent');
const links = document.querySelectorAll('.profile-link');

const toast = document.getElementById('toast');

const MAX_USERNAME_CHARS = 16;
const MAX_FIRSTNAME_CHARS = 16;
const MAX_DESCRIPTION_CHARS = 200;

let allFriends = [];

let tempAvatarUrl = '';
const urlParams = new URLSearchParams(window.location.search);

const profileUid = urlParams.get("uid");

const showToast = (message, duration = 3000) => {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
};

const formatDateInscription = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split(" ");
  if (parts.length < 4) return "";

  const day = parts[0].padStart(2, "0");
  const monthName = parts[1].toLowerCase();
  const year = parts[2].slice(-2);

  const months = {
    janvier: "01", février: "02", fevrier: "02", mars: "03", avril: "04",
    mai: "05", juin: "06", juillet: "07", août: "08", aout: "08",
    septembre: "09", octobre: "10", novembre: "11", décembre: "12", decembre: "12"
  };
  const month = months[monthName] || "00";
  return `inscrit le ${day}.${month}.${year}`;
};

const truncateInput = (input, maxLength) => input.value.slice(0, maxLength);

const resetCounter = (input, counterEl, max) => {
  const length = input.value.length;
  counterEl.textContent = `${length}/${max}`;
  counterEl.style.color = length >= max ? '#ff3d00' : '#aaa';
};

const isUsernameAvailable = async (username, currentUid) => {
  const q = query(
    collection(db, "users"),
    where("nomUtilisateur_lower", "==", username.toLowerCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return true;
  return snap.docs.every(doc => doc.id === currentUid);
};

const showTab = (tabName, currentUser = auth.currentUser) => {
  favoritesContent.style.display = tabName === "Favoris" ? "block" : "none";
  evaluationContent.style.display = tabName === "Évaluation" ? "block" : "none";
  if (tabName === "Favoris") loadFavorites(currentUser);
  if (tabName === "Évaluation") loadEvaluations();
};

let initialTabName = 'Favoris';

links.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    links.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    initialTabName = link.textContent.trim();
    showTab(initialTabName);
  });
});

const displayUserProfileByUid = async (uidToDisplay, currentUserUid) => {
  try {
    const userSnap = await getDoc(doc(db, "users", uidToDisplay));
    if (!userSnap.exists()) { alert("Profil introuvable"); return; }
    const userData = userSnap.data();

    profileAvatar.src = userData.photoURL || 'https://via.placeholder.com/150';
    profilePseudo.textContent = userData.nomUtilisateur || 'Utilisateur';
    profileFirstname.textContent = userData.firstname || '';
    profileDescription.textContent = userData.description || '';

    const profileDateEl = document.getElementById("profileDate");
    const formattedDate = formatDateInscription(userData.dateInscription || "");
    if (formattedDate) {
      profileDateEl.textContent = formattedDate;
      profileDateEl.style.display = "block";
    } else profileDateEl.style.display = "none";

    if (uidToDisplay !== currentUserUid) editProfileBtn.style.display = "none";

    loadEvaluations();

const avatarAnimationDiv = document.getElementById('avatarAnimation');

if (userData?.founder === true) {
  avatarAnimationDiv.style.display = 'block';

  if (!avatarAnimationDiv.dataset.loaded) {
    lottie.loadAnimation({
      container: avatarAnimationDiv,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'assets/animations/avatar.json'
    });
    avatarAnimationDiv.dataset.loaded = "true";
  }
} else {
  avatarAnimationDiv.style.display = 'none';
}

  } catch (err) {
    console.error("Erreur affichage profil :", err);
  }
};

async function loadFavorites(currentUser = auth.currentUser) {
  const container = favoritesContent;
  container.innerHTML = "";

  const uidToLoad = profileUid || currentUser?.uid;
  if (!uidToLoad) {
    container.innerHTML = `<div class="favorites-empty"><p>Connecte-toi pour voir tes favoris</p></div>`;
    return;
  }

  const isOwnProfile = !profileUid || profileUid === currentUser?.uid;

  try {
    // Wait for movies to load from Supabase
    if (window.waitForMovies) {
      await window.waitForMovies();
    }

    const q = query(collection(db, "users", uidToLoad, "favorites"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      container.innerHTML = `<div class="favorites-empty"><p>Aucun favori pour l'instant</p></div>`;
      return;
    }

    const grid = document.createElement("div");
    grid.className = "movie-grid";
snapshot.forEach(docSnap => {
  const movie = docSnap.data();
  let catalogMovie = null;
  if (window.waitForMovies) {
    catalogMovie = window.movies.find(item => item.title === movie.title);
  } else if (typeof movies !== "undefined") {
    catalogMovie = movies.find(item => item.title === movie.title);
  }
  const title = movie.title || catalogMovie?.title || "Titre inconnu";
  const image = movie.img || catalogMovie?.img || "";
  const description = movie.description || catalogMovie?.description || "";
  const type = movie.type || catalogMovie?.type || "film";
  const kind = type === "serie" ? "SÉRIE" : "FILM";

  const item = document.createElement("div");
  item.className = "movie-grid-item is-visible";
  item.setAttribute("data-title", title.toLowerCase());

  const favoriteButton = `
    <button type="button" class="favorite-card-btn is-favorite" data-title="${title.replace(/"/g, '&quot;')}" aria-label="Retirer des favoris" aria-pressed="true"${isOwnProfile ? '' : ' disabled aria-disabled="true"'}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3.4l2.58 5.23 5.77.84-4.17 4.07.98 5.75L12 16.57l-5.16 2.72.98-5.75-4.17-4.07 5.77-.84L12 3.4z"/>
      </svg>
    </button>
  `;

  item.innerHTML = `
    ${favoriteButton}
    <a href="movie-details.html?title=${encodeURIComponent(title)}">
      <img src="${image}" loading="lazy" alt="${title}">
      <span class="content-type-badge">${kind}</span>
      <div class="movie-overlay">
        <div class="movie-title">${title}</div>
        <div class="movie-description">${description}</div>
      </div>
    </a>
  `;

  grid.appendChild(item);

  if (isOwnProfile) {
    const favBtn = item.querySelector('.favorite-card-btn');
    favBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      try {
        await deleteDoc(doc(db, "users", uidToLoad, "favorites", title));
        item.remove();
        if (!grid.children.length) {
          container.innerHTML = `<div class="favorites-empty"><p>Aucun favori pour l'instant</p></div>`;
        }
        showToast("Favori retiré");
      } catch (err) {
        console.error("Erreur suppression favori :", err);
        showToast("Impossible de retirer ce favori");
      }
    });
  }
});
    container.appendChild(grid);
  } catch (err) {
    console.error("Erreur chargement favoris :", err);
  }
}

function loadEvaluations() {
  const container = evaluationContent;
  const evaluations = JSON.parse(localStorage.getItem("evaluations")) || [];
  container.innerHTML = evaluations.length ? "" : `<div class="evaluation-empty"><p>Aucune évaluation pour l'instant</p></div>`;
}

const resetProfileForm = (userData) => {
  usernameInput.value = userData.nomUtilisateur || '';
  resetCounter(usernameInput, usernameCounter, MAX_USERNAME_CHARS);

  firstnameInput.value = userData.firstname || '';
  resetCounter(firstnameInput, firstnameCounter, MAX_FIRSTNAME_CHARS);

  descriptionInput.value = userData.description || '';
  resetCounter(descriptionInput, descriptionCounter, MAX_DESCRIPTION_CHARS);

  panelAvatar.src = userData.photoURL || 'https://via.placeholder.com/150';

  const isDefaultAvatar = !userData.customAvatarURL || userData.customAvatarURL.includes('via.placeholder.com');
  avatarUrlInput.value = isDefaultAvatar ? '' : userData.customAvatarURL;

  tempAvatarUrl = null;

  editProfilePanel.dataset.initialAvatar = panelAvatar.src;
  editProfilePanel.dataset.initialCustomAvatar = avatarUrlInput.value;
};

[usernameInput, firstnameInput, descriptionInput].forEach(input => {
  const max = (input === usernameInput) ? MAX_USERNAME_CHARS :
              (input === firstnameInput) ? MAX_FIRSTNAME_CHARS : MAX_DESCRIPTION_CHARS;
  const counterEl = (input === usernameInput) ? usernameCounter :
                    (input === firstnameInput) ? firstnameCounter : descriptionCounter;

  input.addEventListener('input', () => {
    input.value = truncateInput(input, max);
    resetCounter(input, counterEl, max);
  });
});

editProfileBtn.addEventListener('click', async e => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user || profileUid && profileUid !== user.uid) return;

  const userSnap = await getDoc(doc(db, "users", user.uid));
  resetProfileForm(userSnap.exists() ? userSnap.data() : {});
  editProfilePanel.style.display = 'flex';
});

[closePanelBtn, cancelBtn].forEach(btn =>
  btn.addEventListener('click', e => {
    e.preventDefault();

    panelAvatar.src = editProfilePanel.dataset.initialAvatar;
    avatarUrlInput.value = editProfilePanel.dataset.initialCustomAvatar;

    tempAvatarUrl = null;

    editProfilePanel.style.display = 'none';
  })
);

panelAvatarWrapper.addEventListener('click', () => {
  changeAvatarPanel.style.display = 'flex';
});

[closeChangeAvatar, cancelChangeAvatar].forEach(btn =>
  btn.addEventListener('click', e => {
    e.preventDefault();
    changeAvatarPanel.style.display = 'none';
  })
);

changeAvatarForm.addEventListener('submit', e => {
  e.preventDefault();
  const inputUrl = avatarUrlInput.value.trim();

  if (inputUrl) {
    tempAvatarUrl = inputUrl;
    panelAvatar.src = tempAvatarUrl;
  } else {
    tempAvatarUrl = editProfilePanel.dataset.initialAvatar.includes('via.placeholder.com') || auth.currentUser.photoURL 
      ? auth.currentUser.photoURL || 'https://via.placeholder.com/150' 
      : 'https://via.placeholder.com/150';
    panelAvatar.src = tempAvatarUrl;
  }

  changeAvatarPanel.style.display = 'none';
});

editProfileForm.addEventListener('submit', async e => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const newUsername = usernameInput.value.trim().replace(/\s+/g, ' ');
  if (!newUsername) return showToast("Le nom d'utilisateur est obligatoire");

  if (!(await isUsernameAvailable(newUsername, user.uid))) {
    return showToast("Ce nom d'utilisateur est déjà utilisé ❌", 4000);
  }

  try {
    const userDocRef = doc(db, "users", user.uid);

const finalAvatarUrl = tempAvatarUrl || editProfilePanel.dataset.initialAvatar;

const customAvatarValue = avatarUrlInput.value.trim();
const isDefault = finalAvatarUrl.includes('via.placeholder.com') || finalAvatarUrl === auth.currentUser.photoURL;
const finalCustomAvatar = (!customAvatarValue || isDefault) ? null : customAvatarValue;

await setDoc(userDocRef, {
  nomUtilisateur: newUsername,
  nomUtilisateur_lower: newUsername.toLowerCase(),
  firstname: firstnameInput.value.trim(),
  description: descriptionInput.value.trim(),
  photoURL: finalAvatarUrl,
  customAvatarURL: finalCustomAvatar
}, { merge: true });

    await updateProfile(user, { displayName: newUsername });

    profilePseudo.textContent = newUsername;
    profileFirstname.textContent = firstnameInput.value.trim();
    profileDescription.textContent = descriptionInput.value.trim();
    profileAvatar.src = finalAvatarUrl;
    panelAvatar.src = finalAvatarUrl;

    tempAvatarUrl = null;

    showToast("Profil mis à jour !");
    editProfilePanel.style.display = 'none';
  } catch (err) {
    console.error("Erreur mise à jour profil :", err);
    showToast("Erreur lors de la mise à jour");
  }
});

const deleteUserData = async (uid) => {
  const followersSnap = await getDocs(collection(db, "users", uid, "followers"));
  for (const d of followersSnap.docs) {
    const followerUid = d.id;
    await deleteDoc(doc(db, "users", followerUid, "following", uid));
    await deleteDoc(d.ref);
  }

  const followingSnap = await getDocs(collection(db, "users", uid, "following"));
  for (const d of followingSnap.docs) {
    const followedUid = d.id;
    await deleteDoc(doc(db, "users", followedUid, "followers", uid));
    await deleteDoc(d.ref);
  }

  const favSnap = await getDocs(collection(db, "users", uid, "favorites"));
  for (const d of favSnap.docs) await deleteDoc(d.ref);

  await deleteDoc(doc(db, "users", uid));
};

deleteAccountBtn.addEventListener('click', e => {
  e.preventDefault();
  deleteConfirmPopup.style.display = 'flex';
});

cancelDeleteBtn.addEventListener('click', () => deleteConfirmPopup.style.display = 'none');

confirmDeleteBtn.addEventListener('click', async () => {
  deleteConfirmPopup.style.display = 'none';

  const user = auth.currentUser;
  if (!user) return window.location.href = "index.html";

  try {
    // 1. Supprime Firestore
    await deleteUserData(user.uid);

    // 2. Supprime Auth
    await deleteUser(user);

    window.location.href = "index.html";

  } catch (error) {

    // CAS: login pas assez récent
    if (error.code === "auth/requires-recent-login") {
      try {
        const provider = new GoogleAuthProvider();

        // 🔥 IMPORTANT : reauth obligatoire
        await reauthenticateWithPopup(user, provider);

        // retry suppression après reauth
        await deleteUserData(user.uid);
        await deleteUser(user);

        window.location.href = "index.html";

      } catch (e) {
        console.error("Reauth échouée :", e);
        window.location.href = "index.html";
      }

    } else {
      console.error("Erreur suppression :", error);
      window.location.href = "index.html";
    }
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "index.html";

  const uidToDisplay = profileUid || user.uid;
  const isOwnProfile = uidToDisplay === user.uid;

  editProfileBtn.style.display = isOwnProfile ? 'flex' : 'none';

  await displayUserProfileByUid(uidToDisplay, user.uid);
  showTab(document.querySelector('.profile-link.active')?.textContent.trim() || 'Favoris', user);
});



