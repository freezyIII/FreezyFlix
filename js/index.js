/**
 * « Films à la une » : bandeau large, défilement toutes les 7 s.
 * Titres = js/movies.js (Film / Série lu depuis le catalogue). Remplace `img` si besoin.
 */
window.FEATURED_HERO_MOVIES = [
  {
    title: "Zootopie 2",
    img: "https://i.postimg.cc/HLQvPYDh/Sans-titre-1.png",
  },
  {
    title: "Jurassic World : Renaissance",
    img: "https://i.postimg.cc/hGrbdfRM/Sans-titre-1.png",
  },
  {
    title: "The Fantastic Four : First Steps",
    img: "https://i.postimg.cc/43BV3qpj/Sans-titre-1.png",
  },
  {
    title: "Mercredi",
    img: "https://i.postimg.cc/L8h31H6r/Sans-titre-1.png",
  },
  {
    title: "Lilo et Stitch",
    img: "https://i.postimg.cc/sD5rRrr1/Sans-titre-1.png",
  },
];
window.FEATURED_HERO_INTERVAL_MS = 7000;

function onReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
}

function escAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** Libellé Film / Série selon movies.js (ou secours si titre absent du catalogue). */
function contentTypeLabelFromCatalog(title, fallbackType) {
  if (typeof movies !== "undefined") {
    const entry = movies.find((x) => x.title === title);
    if (entry) return entry.type === "serie" ? "Série" : "Film";
  }
  if (fallbackType === "serie") return "Série";
  return "Film";
}

async function setupGridFavoriteButtons(root = document) {
  const buttons = Array.from(root.querySelectorAll(".favorite-card-btn"));
  if (!buttons.length) return;

  const [{ auth, db }, { doc, getDoc, setDoc, deleteDoc, serverTimestamp }, { onAuthStateChanged }] = await Promise.all([
    import("./database.js"),
    import("https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js"),
    import("https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js")
  ]);

  function setFavoriteState(title, isFavorite) {
    buttons
      .filter(button => button.dataset.title === title)
      .forEach(button => {
        button.classList.toggle("is-favorite", isFavorite);
        button.setAttribute("aria-label", isFavorite ? "Retirer des favoris" : "Ajouter aux favoris");
        button.setAttribute("aria-pressed", String(isFavorite));
      });
  }

  function movieFromButton(button) {
    const title = button.dataset.title || "";
    return typeof movies !== "undefined" ? movies.find(movie => movie.title === title) : null;
  }

  buttons.forEach(button => {
    if (button.dataset.favoriteReady === "true") return;
    button.dataset.favoriteReady = "true";
    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const user = auth.currentUser;
      if (!user) {
        alert("Connecte-toi pour ajouter ce film aux favoris.");
        return;
      }

      const movie = movieFromButton(button);
      if (!movie) return;

      const favRef = doc(db, "users", user.uid, "favorites", movie.title);
      const snap = await getDoc(favRef);

      if (snap.exists()) {
        await deleteDoc(favRef);
        setFavoriteState(movie.title, false);
      } else {
        await setDoc(favRef, {
          title: movie.title,
          img: movie.img,
          description: movie.description || "",
          resolution: movie.downloads?.[0]?.resolution || "",
          type: movie.type || "",
          createdAt: serverTimestamp()
        });
        setFavoriteState(movie.title, true);
      }
    });
  });

  onAuthStateChanged(auth, async user => {
    if (!user) {
      buttons.forEach(button => button.classList.remove("is-favorite"));
      return;
    }

    await Promise.all(buttons.map(async button => {
      const movie = movieFromButton(button);
      if (!movie) return;

      const favRef = doc(db, "users", user.uid, "favorites", movie.title);
      const snap = await getDoc(favRef);
      setFavoriteState(movie.title, snap.exists());
    }));
  });
}

onReady(() => {
  // -------------------- Variables --------------------
  const randomBox = document.getElementById("random-movie-box");
  const movieGrid = document.getElementById("movieGrid");
  const totalMoviesDiv = document.getElementById("totalMovies");
  const filterBtn = document.getElementById("toggleFilters");
  const filterPanel = document.getElementById("filter-panel");
  const closeBtn = document.getElementById("closeFilters");
  const resetBtn = document.getElementById("reset-filters");
  const searchInput = document.getElementById("search-input");

  const rulesBtn = document.getElementById('rulesBtn');
  const rulesOverlay = document.getElementById('rulesOverlay');
  const closeRules = document.getElementById('closeRules');
  const rulesContent = document.querySelector('.rules-content');

  const header = document.querySelector('header');
  const headerOffset = header.offsetTop;

  // -------------------- Compteur de films --------------------
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const pageContentType = currentPage === "films.html" ? "film" : currentPage === "serie.html" ? "serie" : "";
  const pageContentHeading = pageContentType === "serie" ? "SERIES" : "FILMS";

  window.updateTotalMovies = function () {
    if (totalMoviesDiv) {
      totalMoviesDiv.textContent = pageContentHeading;
    }
  }
  updateTotalMovies();

  const filterWrapper = document.querySelector(".filter-wrapper");
  if (totalMoviesDiv && filterWrapper) {
    const gridToolbar = document.createElement("div");
    gridToolbar.className = "grid-toolbar";
    totalMoviesDiv.parentNode.insertBefore(gridToolbar, totalMoviesDiv);
    gridToolbar.appendChild(totalMoviesDiv);
    gridToolbar.appendChild(filterWrapper);
  }

  // -------------------- À la une (carrousel large) --------------------
  (function initFeaturedHero() {
    const viewport = document.getElementById("featuredHeroViewport");
    const track = document.getElementById("featuredHeroTrack");
    const dotsWrap = document.getElementById("featuredHeroDots");
    if (!viewport || !track || !FEATURED_HERO_MOVIES.length) return;

    let index = 0;
    let timer = null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.innerHTML = FEATURED_HERO_MOVIES.map((m) => {
      const href = `movie-details.html?title=${encodeURIComponent(m.title)}`;
      const kind = escAttr(contentTypeLabelFromCatalog(m.title, m.type));
      const badge = `<span class="content-type-badge">${kind}</span>`;
      return `
        <div class="featured-hero-slide" role="listitem" data-title="${escAttr(m.title)}">
          <a href="${href}">
            <img src="${m.img}" alt="${escAttr(m.title)}" width="1580" height="450" loading="lazy" decoding="async">
            ${badge}
            <div class="featured-hero-gradient"></div>
            <span class="featured-hero-title">${escAttr(m.title)}</span>
          </a>
        </div>`;
    }).join("");

    function dimensions() {
      const w = viewport.offsetWidth;
      track.querySelectorAll(".featured-hero-slide").forEach((sl) => {
        sl.style.width = `${w}px`;
        sl.style.flexBasis = `${w}px`;
      });
    }

    function setDotsActive() {
      if (!dotsWrap) return;
      dotsWrap.querySelectorAll(".featured-hero-dot").forEach((d, i) => {
        d.classList.toggle("is-active", i === index);
        d.setAttribute("aria-selected", String(i === index));
      });
    }

    function goTo(i, animate = true) {
      const n = FEATURED_HERO_MOVIES.length;
      index = ((i % n) + n) % n;
      const w = viewport.offsetWidth;
      track.style.transition = animate
        ? "transform 0.85s cubic-bezier(0.12, 0.72, 0.22, 1)"
        : "none";
      track.style.transform = `translateX(${-index * w}px)`;
      setDotsActive();
    }

    function restartTimer() {
      clearInterval(timer);
      if (reduceMotion || FEATURED_HERO_MOVIES.length <= 1) return;
      timer = setInterval(() => goTo(index + 1), FEATURED_HERO_INTERVAL_MS);
    }

    if (dotsWrap && FEATURED_HERO_MOVIES.length > 1) {
      dotsWrap.innerHTML = FEATURED_HERO_MOVIES.map(
        (_, i) =>
          `<button type="button" class="featured-hero-dot${i === 0 ? " is-active" : ""}" role="tab" aria-selected="${i === 0}" data-index="${i}" aria-label="Affiche ${i + 1} sur ${FEATURED_HERO_MOVIES.length}"></button>`
      ).join("");
      dotsWrap.addEventListener("click", (e) => {
        const btn = e.target.closest(".featured-hero-dot");
        if (!btn) return;
        const i = parseInt(btn.getAttribute("data-index"), 10);
        if (!Number.isNaN(i)) goTo(i);
        restartTimer();
      });
    } else if (dotsWrap) {
      dotsWrap.innerHTML = "";
    }

    let resizeT;
    function onResize() {
      dimensions();
      goTo(index, false);
    }

    dimensions();
    goTo(0, false);
    restartTimer();
    window.addEventListener("resize", () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(onResize, 120);
    });
  })();

  // -------------------- Film aléatoire --------------------
  if (randomBox) {
    randomBox.addEventListener("click", () => {
      const movies = Array.from(document.querySelectorAll(".featured-hero-slide a, .movie-grid-item a"))
        .map(link => new URL(link.href, location.origin).searchParams.get("title"))
        .filter(Boolean);

      if (movies.length === 0) {
        alert("Aucun film trouvé");
        return;
      }

      const randomMovie = movies[Math.floor(Math.random() * movies.length)];
      window.location.href = `movie-details.html?title=${encodeURIComponent(randomMovie)}`;
    });
  }

  // -------------------- Filtres --------------------
if (filterBtn && filterPanel) {
  const categoryFilter = document.getElementById("category-filter");
  const yearFilter = document.getElementById("year-filter");
  const qualityFilter = document.getElementById("quality-filter");
  const applyBtn = document.getElementById("apply-filters");

  let previousFilterValues = {};

  // Sauvegarder l'état actuel des filtres
  function saveFilterValues() {
    previousFilterValues = {
      category: categoryFilter.value,
      year: yearFilter.value,
      quality: qualityFilter.value,
    };
  }

  // Restaurer l'état précédent
  function restoreFilterValues() {
    categoryFilter.value = previousFilterValues.category || "";
    yearFilter.value = previousFilterValues.year || "all";
    qualityFilter.value = previousFilterValues.quality || "";
  }

  // Ouvrir le panneau → sauvegarder les valeurs actuelles
  filterBtn.addEventListener("click", e => {
    e.stopPropagation();
    const isOpen = filterPanel.classList.contains("active");
    if (!isOpen) saveFilterValues();
    filterPanel.classList.toggle("active");
    filterPanel.toggleAttribute("hidden", isOpen);
    filterBtn.setAttribute("aria-expanded", String(!isOpen));
  });

  // Fermer le panneau sans appliquer → restaurer
  closeBtn?.addEventListener("click", () => {
    restoreFilterValues();
    filterPanel.classList.remove("active");
    filterPanel.setAttribute("hidden", "");
    filterBtn.setAttribute("aria-expanded", "false");
  });

  // Cliquer en dehors → fermer et restaurer
  document.addEventListener("click", e => {
    if (!filterBtn.contains(e.target) && !filterPanel.contains(e.target)) {
      if (filterPanel.classList.contains("active")) restoreFilterValues();
      filterPanel.classList.remove("active");
      filterPanel.setAttribute("hidden", "");
      filterBtn.setAttribute("aria-expanded", "false");
    }
  });

  // Bouton réinitialiser → remettre les filtres par défaut
  resetBtn?.addEventListener("click", () => {
    categoryFilter.selectedIndex = 0;
    yearFilter.selectedIndex = 0;
    qualityFilter.selectedIndex = 0;
  });

  // Appliquer → filtrer les films et mettre à jour l'état sauvegardé
  applyBtn?.addEventListener("click", () => {
    const category = categoryFilter.value;
    const year = yearFilter.value;
    const quality = qualityFilter.value;

    document.querySelectorAll(".movie-grid-item").forEach(movie => {
      let visible = true;

      if (category) {
        const movieCategories = movie.dataset.category.toLowerCase().split(" / ");
        if (!movieCategories.includes(category.toLowerCase())) visible = false;
      }

      if (year !== "all" && movie.dataset.year !== year) visible = false;
      if (quality && movie.dataset.quality !== quality) visible = false;

      movie.hidden = !visible;
    });

    updateTotalMovies();

    // fermer le panneau
    filterPanel.classList.remove("active");
    filterPanel.setAttribute("hidden", "");
    filterBtn.setAttribute("aria-expanded", "false");

    // Mettre à jour l'état sauvegardé après application
    saveFilterValues();
  });
}


  // -------------------- Modal règles / charte --------------------
  function closeModal() {
    rulesOverlay.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }

  rulesBtn?.addEventListener('click', () => {
    rulesOverlay.classList.add('open');
    document.body.classList.add('no-scroll');
  });

  closeRules?.addEventListener('click', closeModal);

  rulesOverlay?.addEventListener('click', e => {
    if (e.target === rulesOverlay) closeModal();
  });

  // Scroll drag dans la modal
  let isDown = false, startY, scrollTop;
  rulesContent?.addEventListener('mousedown', e => {
    isDown = true;
    rulesContent.classList.add('active');
    startY = e.pageY - rulesContent.offsetTop;
    scrollTop = rulesContent.scrollTop;
    e.preventDefault();
  });

  rulesContent?.addEventListener('mouseleave', () => {
    isDown = false;
    rulesContent.classList.remove('active');
  });

  rulesContent?.addEventListener('mouseup', () => {
    isDown = false;
    rulesContent.classList.remove('active');
  });

  rulesContent?.addEventListener('mousemove', e => {
    if (!isDown) return;
    const y = e.pageY - rulesContent.offsetTop;
    const walk = (y - startY);
    rulesContent.scrollTop = scrollTop - walk;
  });

  rulesContent?.addEventListener('wheel', e => {
    const atTop = rulesContent.scrollTop === 0;
    const atBottom = rulesContent.scrollHeight - rulesContent.scrollTop === rulesContent.clientHeight;
    if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) e.preventDefault();
  }, { passive: false });

  // -------------------- Initialisation des films (movieGrid) --------------------

if (typeof movies !== "undefined" && movieGrid) {
  movies
  .filter(movie => !pageContentType || (movie.type || "film") === pageContentType)
  .forEach(movie => {
    const movieDiv = document.createElement("div");
    movieDiv.className = "movie-grid-item";

    movieDiv.dataset.title = movie.title.toLowerCase();
    movieDiv.dataset.category = movie.category.toLowerCase();
    movieDiv.dataset.type = movie.type || "film";
    const releaseYear = movie.releaseDate?.match(/\d{4}$/)?.[0] || "";
    movieDiv.dataset.year = releaseYear;
    movieDiv.dataset.quality = movie.downloads?.[0]?.resolution || "";

    const kind = movie.type === "serie" ? "Série" : "Film";

    movieDiv.innerHTML = `
      <button type="button" class="favorite-card-btn" data-title="${escAttr(movie.title)}" aria-label="Ajouter aux favoris">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 3.4l2.58 5.23 5.77.84-4.17 4.07.98 5.75L12 16.57l-5.16 2.72.98-5.75-4.17-4.07 5.77-.84L12 3.4z"/>
        </svg>
      </button>
      <a href="movie-details.html?title=${encodeURIComponent(movie.title)}">
        <img src="${movie.img}" loading="lazy">
        <span class="content-type-badge">${kind}</span>
        <div class="movie-overlay">
          <div class="movie-title">${movie.title}</div>
          <div class="movie-description">${movie.description}</div>
        </div>
      </a>
    `;

    movieGrid.appendChild(movieDiv);
  });

  updateTotalMovies();
  setupGridFavoriteButtons(movieGrid);
}


const applyBtn = document.getElementById("apply-filters");

applyBtn?.addEventListener("click", () => {
  const category = document.getElementById("category-filter").value;
  const year = document.getElementById("year-filter").value;
  const quality = document.getElementById("quality-filter").value;

document.querySelectorAll(".movie-grid-item").forEach(movie => {
  let visible = true;

if (category) {
  const movieCategories = movie.dataset.category.toLowerCase().split(" / "); // découpe toutes les catégories
  if (!movieCategories.includes(category.toLowerCase())) visible = false;
}

  if (year !== "all" && movie.dataset.year !== year) visible = false;
  if (quality && movie.dataset.quality !== quality) visible = false;

  movie.hidden = !visible;
});

  updateTotalMovies();

  // fermer le panneau filtre
  filterPanel.classList.remove("active");
  filterPanel.setAttribute("hidden", "");
  filterBtn.setAttribute("aria-expanded", "false");
});

  // -------------------- Synchronisation data-title pour carousel --------------------
document.querySelectorAll('.featured-hero-slide, .movie-grid-item').forEach(item => {
  const link = item.querySelector('a');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href || !href.includes('?')) return;

  const urlParams = new URLSearchParams(href.split('?')[1]);
  const title = urlParams.get('title');

  if (title) {
    item.setAttribute('data-title', decodeURIComponent(title));
  }
});

});


onReady(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q")?.toLowerCase() || "";

    if (query) {
        filterMovies(query);
    }

    function filterMovies(searchText) {
        const movieGrid = document.getElementById("movieGrid");
        if (!movieGrid) return;

        const movies = movieGrid.querySelectorAll(".movie-grid-item");
        let visibleMovies = 0;

        movies.forEach(movie => {
            const title = movie.getAttribute("data-title")?.toLowerCase() || "";
            if (title.includes(searchText)) {
                movie.hidden = false;
                visibleMovies++;
            } else {
                movie.hidden = true;
            }
        });

        // Mettre à jour le titre de section ou le message vide
        const totalMoviesDiv = document.getElementById("totalMovies");
        if (totalMoviesDiv) {
            const currentPage = window.location.pathname.split("/").pop() || "index.html";
            const hasNoResult = visibleMovies === 0;

            totalMoviesDiv.textContent = hasNoResult
                ? "Aucun résultat trouvé"
                : currentPage === "serie.html" ? "SERIES" : "FILMS";
            totalMoviesDiv.classList.toggle("no-results-message", hasNoResult);
        }
    }
});
