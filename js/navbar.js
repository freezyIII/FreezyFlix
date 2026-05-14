// ================== IMPORTS ==================
import { auth, provider, signInWithPopup, signOut, db } from './database.js';
import { doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

// ================== ELEMENTS NAVBAR ==================
const loginBtn = document.getElementById('loginBtn');
const userPseudo = document.getElementById('userPseudo');
const profileMenuContainer = document.getElementById('profileMenuContainer');
const Avatar = document.getElementById('Avatar');
const dropdownMenu = document.getElementById('dropdownMenu');
const menuProfile = document.getElementById('menuProfile');
const menuLogout = document.getElementById('menuLogout');
const searchInput = document.getElementById('search-input');
const contentSection = document.querySelector('.content');
const randomMovieSection = document.querySelector('.random-movie-section');
const randomBox = document.getElementById("random-movie-box");

// ================== ONGLET ACTIF ==================
const navLinkSelector = 'header ul.federant-regular a:not(.animated-link), nav ul.federant-regular a:not(.animated-link)';

function setActiveNavLink() {
    const navLinks = document.querySelectorAll(navLinkSelector);
    if (!navLinks.length) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const currentType = new URLSearchParams(window.location.search).get('type');

    navLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        const linkUrl = new URL(href, window.location.origin);
        const linkPage = linkUrl.pathname.split('/').pop() || 'index.html';
        const linkType = linkUrl.searchParams.get('type');
        const isInternalPage = linkUrl.origin === window.location.origin && linkPage.endsWith('.html');
        let isActive = false;

        if (!isInternalPage) {
            isActive = false;
        } else if (currentPage === 'films.html') {
            isActive = linkPage === 'films.html' && !link.classList.contains('series-link');
        } else if (currentPage === 'serie.html') {
            isActive = linkPage === 'serie.html' || link.classList.contains('series-link');
        } else {
            isActive = linkPage === currentPage && !linkType;
        }

        link.classList.toggle('nav-active', isActive);
        link.toggleAttribute('aria-current', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
    });
}

setActiveNavLink();

// ================== NAVIGATION SANS RECHARGEMENT ==================
const spaPages = new Set(["index.html", "films.html", "serie.html", "aide.html", "support.html"]);
let isNavigating = false;

function addPageStyles(nextDocument) {
    const styleLoads = Array.from(nextDocument.querySelectorAll('link[rel="stylesheet"]')).map(link => {
        const href = link.getAttribute('href');
        if (!href) return Promise.resolve();

        const absoluteHref = new URL(href, window.location.href).href;
        const alreadyLoaded = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .some(currentLink => currentLink.href === absoluteHref);

        if (alreadyLoaded) return Promise.resolve();

        return new Promise(resolve => {
            const newLink = document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.href = absoluteHref;
            newLink.onload = resolve;
            newLink.onerror = resolve;
            document.head.appendChild(newLink);
        });
    });

    return Promise.all(styleLoads);
}

function replacePageBody(nextDocument) {
    const currentHeader = document.querySelector('header');

    Array.from(document.body.childNodes).forEach(node => {
        if (node === currentHeader || node.nodeName === 'SCRIPT') return;
        node.remove();
    });

    const firstScript = document.body.querySelector('script');
    Array.from(nextDocument.body.childNodes).forEach(node => {
        if (node.nodeName === 'HEADER' || node.nodeName === 'SCRIPT') return;
        document.body.insertBefore(document.importNode(node, true), firstScript);
    });
}

function loadClassicScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${src}${src.includes('?') ? '&' : '?'}spa=${Date.now()}`;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

async function loadPageScripts(nextDocument) {
    const scripts = Array.from(nextDocument.body.querySelectorAll('script[src]'));

    for (const script of scripts) {
        const rawSrc = script.getAttribute('src');
        if (!rawSrc || rawSrc.includes('js/navbar.js')) continue;

        const src = new URL(rawSrc, window.location.href).href;
        if (script.type === 'module') {
            await import(`${src}${src.includes('?') ? '&' : '?'}spa=${Date.now()}`);
        } else {
            await loadClassicScript(src);
        }
    }
}

async function navigateWithoutReload(url, shouldPushState = true) {
    if (isNavigating) return;
    isNavigating = true;

    try {
        const response = await fetch(url.href, { headers: { Accept: 'text/html' } });
        if (!response.ok) throw new Error(`Navigation impossible: ${response.status}`);

        const html = await response.text();
        const nextDocument = new DOMParser().parseFromString(html, 'text/html');

        document.title = nextDocument.title;
        await addPageStyles(nextDocument);
        replacePageBody(nextDocument);

        if (shouldPushState) history.pushState({}, '', url.href);
        setActiveNavLink();
        window.scrollTo(0, 0);

        await loadPageScripts(nextDocument);
    } catch (error) {
        console.warn('Navigation client-side indisponible, chargement normal.', error);
        window.location.href = url.href;
    } finally {
        isNavigating = false;
    }
}

document.addEventListener('click', (event) => {
    const link = event.target.closest('header .logo, header ul.federant-regular a:not(.animated-link)');
    if (!link) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    const url = new URL(link.href, window.location.href);
    const targetPage = url.pathname.split('/').pop() || 'index.html';
    if (url.origin !== window.location.origin || !spaPages.has(targetPage)) return;

    event.preventDefault();

    const currentUrl = new URL(window.location.href);
    if (url.pathname === currentUrl.pathname && url.search === currentUrl.search) return;

    navigateWithoutReload(url);
});

window.addEventListener('popstate', () => {
    const url = new URL(window.location.href);
    const page = url.pathname.split('/').pop() || 'index.html';
    if (spaPages.has(page)) navigateWithoutReload(url, false);
});

// ⛔ Sécurité si navbar absente
if (!loginBtn || !Avatar) {
    console.warn("Navbar absente sur cette page");
}

// ================== UI ==================
function showUser({ displayName, photoURL }) {
  if (!userPseudo || !Avatar || !profileMenuContainer || !loginBtn) return;

  userPseudo.textContent = displayName || "Utilisateur";
  userPseudo.style.display = "inline-block";
  Avatar.src = photoURL || "default-avatar.png";
  profileMenuContainer.style.display = "flex";
  loginBtn.style.display = "none";
}

function hideUser() {
    if (userPseudo) userPseudo.style.display = "none";
    if (profileMenuContainer) profileMenuContainer.style.display = "none";
    if (Avatar) Avatar.removeAttribute("src");
    if (loginBtn) loginBtn.style.display = "inline-block";
}

// ================== AUTH ==================
let unsubscribeUser = null;

onAuthStateChanged(auth, (user) => {
  if (unsubscribeUser) {
    unsubscribeUser();
    unsubscribeUser = null;
  }

  if (!user) {
    hideUser();
    return;
  }

  const userRef = doc(db, "users", user.uid);
  unsubscribeUser = onSnapshot(userRef, (snap) => {
    if (!snap.exists()) return;

    const data = snap.data();
    showUser({
      displayName: data.nomUtilisateur,
      photoURL: data.photoURL
    });
  });
});



// ================== LOGIN ==================
if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);

            // Formatage de la date en français
            const now = new Date();
            const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
            const formattedDate = now.toLocaleString('fr-FR', options).replace('à', 'à');

            if (snap.exists()) {
    const userData = snap.data();

    if (userData.banned) {
        // Affiche un panel central avec la raison
        showBanPanel(userData.banReason || "Raison non spécifiée");
        // Déconnexion pour empêcher l’accès
        await signOut(auth);
        return;
    }
}
if (!snap.exists()) {
  await setDoc(userRef, {
    nomUtilisateur: user.displayName || "",
    nomUtilisateur_lower: (user.displayName || "").toLowerCase(), // ✅ Ajout
    email: user.email || "",
    photoURL: user.photoURL || "",
    dateInscription: formattedDate
  });
} else {
  await setDoc(userRef, {
    nomUtilisateur: user.displayName || "",
    nomUtilisateur_lower: (user.displayName || "").toLowerCase(), // ✅ Ajout
    email: user.email || "",
    photoURL: snap.data().photoURL || user.photoURL
  }, { merge: true });
}


        } catch (err) {
            console.error("Erreur connexion :", err);
        }
    });
}

function showBanPanel(reason) {
    let banOverlay = document.createElement("div");
    banOverlay.id = "banOverlay";
    banOverlay.style.position = "fixed";
    banOverlay.style.top = "0";
    banOverlay.style.left = "0";
    banOverlay.style.width = "100%";
    banOverlay.style.height = "100%";
    banOverlay.style.backgroundColor = "rgba(0,0,0,0.8)";
    banOverlay.style.display = "flex";
    banOverlay.style.alignItems = "center";
    banOverlay.style.justifyContent = "center";
    banOverlay.style.zIndex = "9999";

    banOverlay.innerHTML = `
        <div style="background:#222; color:#fff; padding:30px; border-radius:10px; text-align:center; max-width:400px;">
            <h2>Compte banni</h2>
            <p>Raison : ${reason}</p>
            <button id="banOverlayClose" style="margin-top:20px;padding:10px 20px;">Fermer</button>
        </div>
    `;

    document.body.appendChild(banOverlay);

    document.getElementById("banOverlayClose").addEventListener("click", () => {
        banOverlay.remove();
    });
}

// ================== MENU ==================
if (Avatar) {
    Avatar.setAttribute("role", "button");
    Avatar.setAttribute("aria-haspopup", "menu");
    Avatar.setAttribute("aria-expanded", "false");

    Avatar.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = dropdownMenu?.classList.toggle("is-open");
        Avatar.setAttribute("aria-expanded", String(Boolean(isOpen)));
    });
}

document.addEventListener("click", (e) => {
    if (profileMenuContainer && !profileMenuContainer.contains(e.target)) {
        dropdownMenu?.classList.remove("is-open");
        Avatar?.setAttribute("aria-expanded", "false");
    }
});

// ================== PROFIL ==================
if (menuProfile) {
    menuProfile.addEventListener("click", () => {
        const user = auth.currentUser;
        if (user) window.location.href = `profile.html?uid=${user.uid}`;
    });
}

// ================== LOGOUT ==================
if (menuLogout) {
  menuLogout.addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut(auth);
    // Pas besoin de timeout, le onAuthStateChanged s'occupe de tout
    window.location.href = "index.html";
  });
}




const menuSettings = document.getElementById('menuSettings');

if (menuSettings) {
menuSettings.addEventListener("click", () => {
    const user = auth.currentUser;
    if (user) {
        // L'utilisateur connecté peut aller à la page sans UID dans l'URL
        window.location.href = "request-movie.html";
    } else {
        alert("Veuillez vous connecter pour faire une demande de film.");
        window.location.href = "index.html";
    }
});

}


// ================== SEARCH ==================
if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") { // Quand l'utilisateur appuie sur Entrée
            const query = searchInput.value.trim();
            if (query) {
                // Redirection vers search.html avec le paramètre q
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        }
    });
}


