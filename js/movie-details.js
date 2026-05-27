import { auth, db } from './database.js';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// ---------------------- VARIABLES ----------------------
const urlParams = new URLSearchParams(window.location.search);
const movieTitle = urlParams.get('title');

const elements = {
  commentBoxContainer: document.getElementById('commentBoxContainer'),
  loginToCommentMessage: document.getElementById('loginToCommentMessage'),
  commentUsernameEl: document.getElementById('comment-username'),
  commentAvatarEl: document.getElementById('commentAvatar'),
  commentsList: document.getElementById('commentsList'),
  favoriteBtn: document.getElementById("favoriteBtn"),
  downloadsBody: document.getElementById("downloadsTableBody"),
  textarea: document.querySelector('.comment-content textarea'),
  commentButtons: document.getElementById('commentButtons'),
  cancelBtn: document.getElementById('cancelBtn'),
  submitBtn: document.getElementById('submitBtn')
};

let selectedMovie = null;
let isFounder = false;

// ---------------------- INITIALISATION ----------------------
async function init() {
  // Wait for movies to load from Supabase
  if (window.waitForMovies) {
    await window.waitForMovies();
    selectedMovie = window.movies.find(movie => movie.title.toLowerCase() === movieTitle?.toLowerCase());
  } else if (typeof movies !== "undefined") {
    selectedMovie = movies.find(movie => movie.title.toLowerCase() === movieTitle?.toLowerCase());
  }

  if (!selectedMovie) {
    console.warn("Film non trouvé :", movieTitle);
    return;
  }

  populateMovieDetails();
  setupVideoAndBackground();
  await setupDownloadsTable();
  setupFavoriteButton();
  setupCommentsSection();
}

init();

// ---------------------- FONCTIONS UTILITAIRES ----------------------
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showToast(message, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), duration);
}

function timeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return `il y a ${seconds} seconde${seconds > 1 ? 's' : ''}`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(months / 12);
  return `il y a ${years} an${years > 1 ? 's' : ''}`;
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function validateCommentText(text) {
  const forbiddenWords = [
    "putain","connard","salope","enculé","pute","pd","pédé","fdp","bite",
    "couille","salaud","bouffon","ptn","seins","anus","salop","enfoiré"
  ];
  if (new RegExp(`\\b(${forbiddenWords.join('|')})\\b`, 'i').test(text)) {
    showToast("Votre commentaire contient des mots interdits !", 4000);
    return false;
  }

  const linkRegex = /\b(?:https?:\/\/|www\.)[^\s]+|\b\S+\.(com|net|org|fr|info|io|xyz|gov|edu|co|us|eu)\b/i;
  if (linkRegex.test(text)) {
    showToast("Les liens ne sont pas autorisés dans les commentaires !", 4000);
    return false;
  }

  return true;
}

async function getUserPublicData(userId) {
  let username = "Utilisateur";
  let photoURL = "default-avatar.png";

  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      username = userData.nomUtilisateur || username;
      photoURL = userData.photoURL || photoURL;
    }
  } catch (err) {
    console.error(err);
  }

  return { username, photoURL };
}

async function showConfirm(message) {
  return new Promise(resolve => {
    const modal = document.getElementById("confirmModal");
    const msg = document.getElementById("confirmMessage");
    const yesBtn = document.getElementById("confirmYes");
    const noBtn = document.getElementById("confirmNo");

    msg.textContent = message;
    modal.style.display = "flex";

    function cleanUp() {
      modal.style.display = "none";
      yesBtn.removeEventListener("click", onYes);
      noBtn.removeEventListener("click", onNo);
    }

    function onYes() { cleanUp(); resolve(true); }
    function onNo() { cleanUp(); resolve(false); }

    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
  });
}

// ---------------------- POPULER LES DÉTAILS DU FILM ----------------------
function populateMovieDetails() {
  setText('movieTitle', selectedMovie.title);
  setText('movieCategoryText', selectedMovie.category);
  setText('movieDescription', selectedMovie.description);
  setText('releaseDateValue', selectedMovie.release_date);
  setText('durationValue', selectedMovie.duration);
}

// ---------------------- VIDÉO ET FOND ----------------------
function setupVideoAndBackground() {
  if (selectedMovie.youtube_url) {
    const iframeContainer = document.getElementById('movieIframeContainer');
    if (iframeContainer) {
      const iframe = document.createElement('iframe');
      iframe.src = selectedMovie.youtube_url;
      iframe.width = "100%";
      iframe.height = "480";
      iframe.frameBorder = "0";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      iframeContainer.appendChild(iframe);
    }
  }

  if (selectedMovie.backgroundUrl) {
    document.body.style.background = `url('${selectedMovie.backgroundUrl}') no-repeat center center fixed`;
    document.body.style.backgroundSize = "cover";
  }
}

// ---------------------- TABLEAU DES TÉLÉCHARGEMENTS ----------------------
async function fetchDownloadsFromSupabase(movieId) {
  const SUPABASE_URL = 'https://ybuzmohtxmfchjlzisfz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlidXptb2h0eG1mY2hqbHppc2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDgxNzYsImV4cCI6MjA5NTM4NDE3Nn0.c_ul0aFQJaPhSa1QfebDhHmH9m8AYWoCCTKAHpslt7o';

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/downloads?movie_id=eq.${movieId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Error fetching downloads:', response.status);
      return [];
    }

    const downloads = await response.json();
    console.log('Downloads for movie:', movieId, downloads);
    return downloads;
  } catch (error) {
    console.error('Error fetching downloads:', error);
    return [];
  }
}

async function setupDownloadsTable() {
  if (!elements.downloadsBody || !selectedMovie) return;

  elements.downloadsBody.innerHTML = '';

  // Fetch downloads from Supabase using movie_id
  const downloads = await fetchDownloadsFromSupabase(selectedMovie.id);

  if (!Array.isArray(downloads) || downloads.length === 0) {
    elements.downloadsBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Aucun téléchargement disponible</td></tr>';
    return;
  }

  downloads.forEach(dl => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${dl.size || "--"}</td>
      <td>${dl.quality || "--"}</td>
      <td>${dl.resolution || "--"}</td>
      <td>
        <div class="table-button-container">
          <a href="${dl.url}" target="_blank" class="download-btn">Télécharger</a>
        </div>
      </td>
    `;
    elements.downloadsBody.appendChild(tr);
  });
}

// ---------------------- FAVORIS ----------------------
function setupFavoriteButton() {
  if (!elements.favoriteBtn || !selectedMovie) return;

  onAuthStateChanged(auth, async user => {
    if (!user) {
      elements.favoriteBtn.style.display = "none";
      return;
    }

    const favRef = doc(db, "users", user.uid, "favorites", selectedMovie.title);

    async function updateButton() {
      const exists = await getDoc(favRef);
      if (exists.exists()) {
        elements.favoriteBtn.textContent = "⭐ Retirer des favoris";
        elements.favoriteBtn.classList.add("active");
      } else {
        elements.favoriteBtn.textContent = "⭐ Ajouter aux favoris";
        elements.favoriteBtn.classList.remove("active");
      }
    }

    elements.favoriteBtn.addEventListener('click', async () => {
      const snap = await getDoc(favRef);
      if (snap.exists()) {
        await deleteDoc(favRef);
        showToast("Retiré des favoris");
      } else {
        await setDoc(favRef, {
          title: selectedMovie.title,
          img: selectedMovie.img,
          description: selectedMovie.description || "",
          resolution: selectedMovie.downloads?.[0]?.resolution || "",
          type: selectedMovie.type || "",
          createdAt: serverTimestamp()
        });
        showToast("Ajouté aux favoris ❤️");
      }
      updateButton();
    });

    updateButton();
  });
}

// ---------------------- ESPACE COMMENTAIRES ----------------------
function setupCommentsSection() {
  const ADMIN_UID = "XlNybs8vBsUQdA86cP8BDNAzTMN2";

  onAuthStateChanged(auth, async user => {
    if (user) {
      elements.loginToCommentMessage.style.display = "none";
      elements.commentBoxContainer.style.visibility = "visible";
      elements.commentsList.style.display = "block";

      elements.commentButtons.style.display = "none";
      elements.textarea.value = "";

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const data = snap.exists() ? snap.data() : {};

      const displayName =
        data.nomUtilisateur || user.displayName || "Utilisateur";

      const photoURL =
        data.photoURL || user.photoURL || "default-avatar.png";

      elements.commentUsernameEl.textContent = displayName;
      elements.commentAvatarEl.src = photoURL;

      isFounder = user.uid === ADMIN_UID;

      loadComments();
    } else {
      elements.loginToCommentMessage.style.display = "block";
      elements.commentBoxContainer.style.visibility = "hidden";
      elements.commentsList.style.display = "none";
      elements.commentsList.innerHTML = "";

      elements.commentButtons.style.display = "none";
      elements.textarea.value = "";
    }
  });

  elements.textarea.addEventListener("focus", () => {
    elements.commentButtons.style.display = "flex";
  });

  elements.textarea.addEventListener("blur", () => {
    if (elements.textarea.value.trim() === "") {
      elements.commentButtons.style.display = "none";
    }
  });

  elements.cancelBtn.addEventListener("click", () => {
    elements.textarea.value = "";
    elements.commentButtons.style.display = "none";
  });

  elements.submitBtn.addEventListener("click", handleCommentSubmit);
}

async function handleCommentSubmit() {
  const text = elements.textarea.value.trim();
  if (!text) return;

  if (!validateCommentText(text)) return;

  const user = auth.currentUser;
  if (!user) return alert("Vous devez être connecté pour commenter.");

  try {
await addDoc(collection(db, "comments", movieTitle, "comments"), {
  userId: user.uid,
  text,
  timestamp: new Date()
});

loadComments();

    elements.textarea.value = '';
    elements.commentButtons.style.display = 'none';
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire:", error);
  }
}

// ---------------------- AFFICHAGE EN TEMPS RÉEL ----------------------
async function loadComments() {
  const commentsQuery = query(
    collection(db, "comments", movieTitle, "comments"),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(commentsQuery);

  elements.commentsList.innerHTML = '';
  const currentUser = auth.currentUser;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);

    const { username, photoURL } = await getUserPublicData(data.userId);

    const isOwner = currentUser && currentUser.uid === data.userId;

    const div = createCommentElement(docSnap.id, data, username, photoURL, timestamp, isOwner);
    elements.commentsList.appendChild(div);
    await loadReplies(docSnap.id, div.querySelector(".replies-list"));
  }
}

  // Fermer les menus si clic ailleurs
  document.addEventListener("click", () => {
    document.querySelectorAll(".more-menu").forEach(menu => menu.style.display = "none");
  });

function createCommentElement(commentId, data, username, photoURL, timestamp, isOwner) {
  const div = document.createElement("div");
  div.className = "comment-item";

  // Créer l'image avatar cliquable
  const avatarLink = document.createElement("a");
  avatarLink.href = `profile.html?uid=${data.userId}`; // redirige vers le profil
  // On n'ajoute pas target="_blank", donc ça reste sur la même page
  const avatarImg = document.createElement("img");
  avatarImg.className = "comment-avatar";
  avatarImg.src = photoURL;
  avatarImg.alt = username;
  avatarLink.appendChild(avatarImg);

  const commentTextDiv = document.createElement("div");
  commentTextDiv.className = "comment-text";
  commentTextDiv.innerHTML = `
    <div class="username-time">
      <span class="username">${username}</span>
      <span class="comment-time">${timeAgo(timestamp)}</span>
    </div>
    <p>${escapeHTML(data.text)}</p>
    <div class="comment-actions">
      <button class="reply-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="16" width="16">
          <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"></path>
        </svg>
        Répondre
      </button>
      <div class="more-wrapper">
        <button class="more-btn" aria-label="Plus d’options">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="1em" width="1em" fill="white">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
          </svg>
          <span class="more-text">Plus</span>
        </button>
<div class="more-menu" style="display:none;">
  ${isOwner || isFounder
    ? `<button class="delete-comment">Supprimer</button>`
    : `<button class="report-comment">Signaler</button>`}
</div>
      </div>
    </div>
    <div class="reply-form-container"></div>
    <div class="replies-list"></div>
  `;

  div.appendChild(avatarLink); // Ajouter le lien de l’avatar
  div.appendChild(commentTextDiv); // Ajouter le texte du commentaire

  setupCommentActions(div, commentId, data, isOwner);
  return div;
}

function setupCommentActions(div, commentId, data, isOwner) {
  const moreBtn = div.querySelector(".more-btn");
  const menu = div.querySelector(".more-menu");
  const replyBtn = div.querySelector(".reply-btn");
  const replyFormContainer = div.querySelector(".reply-form-container");

  moreBtn.addEventListener("click", e => {
    e.stopPropagation();
    document.querySelectorAll(".more-menu").forEach(m => { if (m !== menu) m.style.display = "none"; });
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  });

  const deleteBtn = div.querySelector(".delete-comment");
  const reportBtn = div.querySelector(".report-comment");

  replyBtn?.addEventListener("click", () => {
    const user = auth.currentUser;
    if (!user) return alert("Vous devez être connecté pour répondre.");

    if (replyFormContainer.innerHTML.trim()) {
      replyFormContainer.innerHTML = "";
      return;
    }

    replyFormContainer.innerHTML = `
      <div class="reply-form">
        <textarea placeholder="Écrire une réponse"></textarea>
        <div class="reply-form-actions">
          <button type="button" class="cancel-reply-btn">Annuler</button>
          <button type="button" class="submit-reply-btn">Répondre</button>
        </div>
      </div>
    `;

    const textarea = replyFormContainer.querySelector("textarea");
    textarea.focus();

    replyFormContainer.querySelector(".cancel-reply-btn").addEventListener("click", () => {
      replyFormContainer.innerHTML = "";
    });

    replyFormContainer.querySelector(".submit-reply-btn").addEventListener("click", async () => {
      await handleReplySubmit(commentId, textarea.value);
      replyFormContainer.innerHTML = "";
    });
  });

  if (isOwner || isFounder) { // <-- ici on ajoute isFounder
    deleteBtn?.addEventListener("click", async () => {
      const confirmed = await showConfirm("Supprimer ce commentaire ?");
      if (!confirmed) return;
      try {
        await deleteDoc(doc(db, "comments", movieTitle, "comments", commentId));
        showToast("Commentaire supprimé !");
        loadComments();
      } catch (err) {
        console.error(err);
        showToast("Erreur lors de la suppression", 4000);
      }
    });
  } else if (reportBtn) {
    reportBtn.addEventListener("click", async () => {
      const confirmed = await showConfirm("Signaler ce commentaire ?");
      if (!confirmed) return;

      const user = auth.currentUser;
      if (!user) return alert("Vous devez être connecté pour signaler un commentaire.");

      try {
        const reportRef = doc(db, "reported-comments", commentId);
        const reportSnap = await getDoc(reportRef);

        if (reportSnap.exists()) {
          const dataReport = reportSnap.data();
          if (dataReport.reportedBy.includes(user.uid)) {
            showToast("Vous avez déjà signalé ce commentaire.", 4000);
            return;
          } else {
            await setDoc(reportRef, {
              ...dataReport,
              reportedBy: [...dataReport.reportedBy, user.uid],
              timestamp: serverTimestamp()
            });
          }
        } else {
          await setDoc(reportRef, {
            movieTitle,
            commentAuthorId: data.userId,
            commentText: data.text,
            reportedBy: [user.uid],
            timestamp: serverTimestamp()
          });
        }

        showToast("Commentaire signalé !");
      } catch (err) {
        console.error(err);
        showToast("Erreur lors du signalement", 4000);
      }
    });
  }
}

async function handleReplySubmit(commentId, rawText) {
  const text = rawText.trim();
  if (!text) return;
  if (!validateCommentText(text)) return;

  const user = auth.currentUser;
  if (!user) return alert("Vous devez être connecté pour répondre.");

  try {
    await addDoc(collection(db, "comments", movieTitle, "comments", commentId, "replies"), {
      userId: user.uid,
      text,
      timestamp: new Date()
    });

    showToast("Réponse ajoutée !");
    loadComments();
  } catch (error) {
    console.error("Erreur lors de l'ajout de la réponse:", error);
    showToast("Erreur lors de l'ajout de la réponse", 4000);
  }
}

async function loadReplies(commentId, repliesList) {
  if (!repliesList) return;

  const repliesQuery = query(
    collection(db, "comments", movieTitle, "comments", commentId, "replies"),
    orderBy("timestamp", "asc")
  );
  const snapshot = await getDocs(repliesQuery);
  const currentUser = auth.currentUser;

  repliesList.innerHTML = "";

  for (const replySnap of snapshot.docs) {
    const reply = replySnap.data();
    const timestamp = reply.timestamp?.toDate ? reply.timestamp.toDate() : new Date(reply.timestamp);
    const { username, photoURL } = await getUserPublicData(reply.userId);
    const canDelete = isFounder || (currentUser && currentUser.uid === reply.userId);

    const replyEl = document.createElement("div");
    replyEl.className = "reply-item";
    replyEl.innerHTML = `
      <a href="profile.html?uid=${reply.userId}">
        <img class="reply-avatar" src="${photoURL}" alt="${escapeHTML(username)}">
      </a>
      <div class="reply-text">
        <div class="username-time">
          <span class="username">${escapeHTML(username)}</span>
          <span class="comment-time">${timeAgo(timestamp)}</span>
        </div>
        <p>${escapeHTML(reply.text)}</p>
        ${canDelete ? `
          <div class="reply-actions">
            <div class="more-wrapper">
              <button class="more-btn" aria-label="Plus d’options">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="1em" width="1em" fill="white">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
                </svg>
                <span class="more-text">Plus</span>
              </button>
              <div class="more-menu" style="display:none;">
                <button class="delete-reply">Supprimer</button>
              </div>
            </div>
          </div>
        ` : ""}
      </div>
    `;

    const replyMoreBtn = replyEl.querySelector(".more-btn");
    const replyMenu = replyEl.querySelector(".more-menu");
    replyMoreBtn?.addEventListener("click", e => {
      e.stopPropagation();
      document.querySelectorAll(".more-menu").forEach(menu => {
        if (menu !== replyMenu) menu.style.display = "none";
      });
      replyMenu.style.display = replyMenu.style.display === "block" ? "none" : "block";
    });

    replyEl.querySelector(".delete-reply")?.addEventListener("click", async () => {
      const confirmed = await showConfirm("Supprimer cette réponse ?");
      if (!confirmed) return;

      await deleteDoc(doc(db, "comments", movieTitle, "comments", commentId, "replies", replySnap.id));
      showToast("Réponse supprimée !");
      loadComments();
    });

    repliesList.appendChild(replyEl);
  }
}
