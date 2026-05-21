/**
 * « Films à la une » : bandeau large, défilement toutes les 7 s.
 * Titres = js/movies.js (Film / Série lu depuis le catalogue). Remplace `img` si besoin.
 */
window.FEATURED_HERO_MOVIES = [
  {
    title: "Mercredi",
    img: "https://thumb.canalplus.pro/http/unsafe/1440x810/smart/creativemedia-image.canalplus.pro/content/0001/61/4eadd6bc1c7dcebb323ba6552203a2cb57349ba3.jpeg",
  },
  {
    title: "Zootopie 2",
    img: "https://www.boxofficepro.fr/app/uploads/2025/12/e69e82a4475e6fa6ac8928c94e82a51b.jpg",
  },
  {
    title: "Jurassic World : Renaissance",
    img: "https://proxymedia.woopic.com/api/v1/images/331%2FJURASSICWORW0231892_BAN1_2424_NEWTV_UHD.jpg",
  },
  {
    title: "The Fantastic Four : First Steps",
    img: "https://marvelll.fr/wp-content/uploads/2025/06/les-4-fantastiques-premiers-pas-film-mcu-banniere.webp",
  },
  {
    title: "Lilo et Stitch",
    img: "https://geekotheque.com/wp-content/uploads/2025/03/fillm-lilo-stitch-2025.webp",
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

function normalizeSearch(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Libellé Film / Série selon movies.js (ou secours si titre absent du catalogue). */
function contentTypeLabelFromCatalog(title, fallbackType) {
  if (typeof movies !== "undefined") {
    const entry = movies.find((x) => x.title === title);
    if (entry) return entry.type === "serie" ? "SÉRIE" : "FILM";
  }
  if (fallbackType === "serie") return "SÉRIE";
  return "FILM";
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
  const pageContentHeading = pageContentType === "serie" ? "SERIES" : pageContentType === "film" ? "FILMS" : currentPage === "search.html" ? "" : "ACCUEIL";
  const movieRowsPerPage = 8;
  let currentMoviePage = 1;
  let paginationDiv = null;

  const isHomePage = currentPage === "index.html" || currentPage === "";
  const HOME_CATEGORIES = [
    { label: "Aventure", filter: "aventure" },
    { label: "Horreur", filter: "horreur" },
    { label: "Animation", filter: "animation" },
    { label: "Fantastique", filter: "fantastique" },
    { label: "Romance", filter: "romance" },
    { label: "Policier", filter: "policier" }
  ];

  function shuffleArray(array) {
    const copy = Array.from(array);
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getMoviesForGenre(tag) {
    return movies.filter(movie => String(movie.category || "").toLowerCase().includes(tag));
  }

  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadDailySelection() {
    try {
      const raw = localStorage.getItem("homeCategorySelection");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.date !== getTodayKey()) return null;
      return parsed.categories || null;
    } catch {
      return null;
    }
  }

  function saveDailySelection(categories) {
    try {
      localStorage.setItem(
        "homeCategorySelection",
        JSON.stringify({ date: getTodayKey(), categories })
      );
    } catch {
      // If localStorage est désactivé, on ignore silencieusement.
    }
  }

  function getDailyMoviesForCategory(category) {
    const stored = loadDailySelection() || {};
    if (Array.isArray(stored[category.filter]) && stored[category.filter].length > 0) {
      return stored[category.filter]
        .map(title => movies.find(movie => movie.title === title))
        .filter(Boolean);
    }

    const selectedMovies = shuffleArray(getMoviesForGenre(category.filter)).slice(0, 8);
    stored[category.filter] = selectedMovies.map(movie => movie.title);
    saveDailySelection(stored);
    return selectedMovies;
  }

  function createMovieCard(movie) {
    const movieDiv = document.createElement("div");
    movieDiv.className = "movie-grid-item";
    movieDiv.dataset.title = movie.title.toLowerCase();
    movieDiv.dataset.category = movie.category.toLowerCase();
    movieDiv.dataset.type = movie.type || "film";
    movieDiv.dataset.filterVisible = "true";
    movieDiv.dataset.searchVisible = "true";
    const releaseYear = movie.releaseDate?.match(/\d{4}$/)?.[0] || "";
    movieDiv.dataset.year = releaseYear;
    movieDiv.dataset.quality = movie.downloads?.[0]?.resolution || "";

    const kind = movie.type === "serie" ? "SÉRIE" : "FILM";

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

    return movieDiv;
  }

  function setupScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries, observerInstance) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observerInstance.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.01
    });

    document.querySelectorAll('.category-header h2, .movie-grid-item').forEach(element => {
      observer.observe(element);
    });
  }

  function renderHomeCategorySections() {
    const categorySections = document.getElementById("categorySections");
    if (!categorySections) return;

    HOME_CATEGORIES.forEach(category => {
      const section = document.createElement("section");
      section.className = "home-category-section";
      section.innerHTML = `
        <div class="category-header">
          <h2 class="titan-one-regular">${category.label}</h2>
          <a class="category-see-all" href="films.html?cat=${encodeURIComponent(category.filter)}">Voir tout</a>
        </div>
        <div class="movie-grid category-movie-grid" aria-label="Films ${category.label}"></div>
      `;

      categorySections.appendChild(section);
      const sectionGrid = section.querySelector(".movie-grid");
      getDailyMoviesForCategory(category).forEach(movie => {
        sectionGrid.appendChild(createMovieCard(movie));
      });
    });
  }

  window.updateTotalMovies = function () {
    if (totalMoviesDiv && (currentPage === "films.html" || currentPage === "serie.html")) {
      totalMoviesDiv.textContent = "";
    } else if (totalMoviesDiv) {
      totalMoviesDiv.textContent = pageContentHeading;
    }
  }
  updateTotalMovies();

  const filterWrapper = document.querySelector(".filter-wrapper");
  if (isHomePage) {
    filterWrapper?.remove();
    totalMoviesDiv?.remove();
  }

  if (!isHomePage && totalMoviesDiv) {
    const gridToolbar = document.createElement("div");
    gridToolbar.className = "grid-toolbar";
    totalMoviesDiv.parentNode.insertBefore(gridToolbar, totalMoviesDiv);
    gridToolbar.appendChild(totalMoviesDiv);
    paginationDiv = document.createElement("div");
    paginationDiv.className = "movie-pagination";
    gridToolbar.appendChild(paginationDiv);
    if (filterWrapper) {
      gridToolbar.appendChild(filterWrapper);
    } else {
      const toolbarSpacer = document.createElement("div");
      toolbarSpacer.className = "grid-toolbar-spacer";
      toolbarSpacer.setAttribute("aria-hidden", "true");
      gridToolbar.appendChild(toolbarSpacer);
    }

    // Ajouter la pagination en bas de la grille
    const bottomPaginationDiv = document.createElement("div");
    bottomPaginationDiv.className = "movie-pagination-bottom";
    bottomPaginationDiv.setAttribute("aria-label", "Pagination en bas");
    movieGrid.parentNode.insertBefore(bottomPaginationDiv, movieGrid.nextSibling);
    window.bottomPaginationDiv = bottomPaginationDiv;
  }

  function getGridItems() {
    return movieGrid ? Array.from(movieGrid.querySelectorAll(".movie-grid-item")) : [];
  }

  function isMovieAllowed(movie) {
    return movie.dataset.filterVisible !== "false" && movie.dataset.searchVisible !== "false";
  }

  function getMoviesPerPage() {
    if (!movieGrid) return movieRowsPerPage;

    const gridWidth = movieGrid.clientWidth;
    const styles = window.getComputedStyle(movieGrid);
    const columnGap = parseFloat(styles.columnGap) || 12;
    const columnWidth = 200;
    const columns = Math.max(1, Math.min(8, Math.floor((gridWidth + columnGap) / (columnWidth + columnGap))));

    return columns * movieRowsPerPage;
  }

  function renderPagination(totalPages) {
    if (!paginationDiv) return;

    paginationDiv.innerHTML = "";
    paginationDiv.hidden = totalPages < 1;

    if (window.bottomPaginationDiv) {
      window.bottomPaginationDiv.innerHTML = "";
      window.bottomPaginationDiv.hidden = totalPages < 1;
    }

    for (let i = 1; i <= totalPages; i++) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `pagination-btn${i === currentMoviePage ? " active" : ""}`;
      button.textContent = i;
      button.setAttribute("aria-label", `Page ${i}`);
      button.setAttribute("aria-current", i === currentMoviePage ? "page" : "false");
      button.addEventListener("click", () => {
        window.applyMoviePagination(i);
      });
      paginationDiv.appendChild(button);

      // Dupliquer le bouton pour la pagination en bas
      if (window.bottomPaginationDiv) {
        const bottomButton = button.cloneNode(true);
        bottomButton.addEventListener("click", () => {
          window.applyMoviePagination(i);
        });
        window.bottomPaginationDiv.appendChild(bottomButton);
      }
    }
  }

  window.applyMoviePagination = function (page = currentMoviePage) {
    const items = getGridItems();
    const allowedItems = items.filter(isMovieAllowed);
    const moviesPerPage = getMoviesPerPage();
    const totalPages = Math.ceil(allowedItems.length / moviesPerPage);
    const hasNoResult = allowedItems.length === 0;

    currentMoviePage = hasNoResult ? 1 : Math.min(Math.max(page, 1), totalPages);

    items.forEach(movie => {
      movie.hidden = true;
    });

    if (!hasNoResult) {
      const start = (currentMoviePage - 1) * moviesPerPage;
      allowedItems.slice(start, start + moviesPerPage).forEach(movie => {
        movie.hidden = false;
      });
    }

    if (totalMoviesDiv) {
      if (currentPage === "films.html" || currentPage === "serie.html") {
        totalMoviesDiv.textContent = hasNoResult ? "Aucun résultat trouvé" : "";
      } else {
        totalMoviesDiv.textContent = hasNoResult ? "Aucun résultat trouvé" : pageContentHeading;
      }
      totalMoviesDiv.classList.toggle("no-results-message", hasNoResult);
      totalMoviesDiv.parentElement?.classList.toggle("has-no-results", hasNoResult);
    }

    const pageCountDiv = document.getElementById("page-count");
    if (pageCountDiv) {
      const count = allowedItems.length;
      const typeLabel = pageContentType === "serie" ? "séries" : "films";
      pageCountDiv.textContent = count > 0 ? `${count} ${typeLabel} trouvées` : "";
    }

    renderPagination(hasNoResult ? 0 : totalPages);
  };

  window.addEventListener("resize", () => {
    window.applyMoviePagination?.(currentMoviePage);
  });

  function applyCurrentFiltersToGrid() {
    const categoryFilter = document.getElementById("category-filter");
    const yearFilter = document.getElementById("year-filter");
    const qualityFilter = document.getElementById("quality-filter");
    const category = categoryFilter?.value || "";
    const year = yearFilter?.value || "all";
    const quality = qualityFilter?.value || "";

    getGridItems().forEach(movie => {
      let visible = true;

      if (category) {
        const movieCategories = movie.dataset.category.toLowerCase().split(" / ");
        if (!movieCategories.includes(category.toLowerCase())) visible = false;
      }

      if (year !== "all" && movie.dataset.year !== year) visible = false;
      if (quality && movie.dataset.quality !== quality) visible = false;

      movie.dataset.filterVisible = String(visible);
    });

    window.applyMoviePagination(1);
  }

  // -------------------- À la une (carrousel large) --------------------
  (function initFeaturedHero() {
    const viewport = document.getElementById("featuredHeroViewport");
    const track = document.getElementById("featuredHeroTrack");
    const dotsWrap = document.getElementById("featuredHeroDots");
    const dotsWrapper = document.getElementById("featuredHeroDotsWrapper");
    const progressBar = document.getElementById("featuredHeroProgressBar");
    const pauseBtn = document.getElementById("featuredHeroPauseBtn");
    if (!viewport || !track || !FEATURED_HERO_MOVIES.length) return;

    let index = 0;
    let timer = null;
    let isPaused = false;
    let progressStartTime = 0;
    let progressPausedTime = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.innerHTML = FEATURED_HERO_MOVIES.map((m, index) => {
      const href = `movie-details.html?title=${encodeURIComponent(m.title)}`;
      const kind = escAttr(contentTypeLabelFromCatalog(m.title, m.type));
      const badge = `<span class="content-type-badge">${kind}</span>`;
      const centeredClass = index >= 2 ? 'featured-hero-slide-centered' : '';
      const loweredClass = m.title === "Mercredi" ? 'featured-hero-slide-lowered' : '';
      return `
        <div class="featured-hero-slide ${centeredClass} ${loweredClass}" role="listitem" data-title="${escAttr(m.title)}">
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
      if (!dotsWrapper) return;
      dotsWrapper.querySelectorAll(".featured-hero-dot").forEach((d, i) => {
        d.classList.toggle("is-active", i === index);
        d.setAttribute("aria-selected", String(i === index));
      });
    }

    function resetProgressBar() {
      if (!progressBar) return;
      // Always reset to 0 when changing slides manually, even if paused
      progressStartTime = Date.now();
      progressPausedTime = 0;
      // Cancel any existing animation
      if (progressBar._animation) {
        progressBar._animation.cancel();
        progressBar._animation = null;
      }
      // Only start animation if not paused
      if (!isPaused) {
        startProgressBarAnimation();
      }
    }

    function startProgressBarAnimation() {
      if (!progressBar || isPaused) return;
      
      // Stop any existing animation
      if (progressBar._animation) {
        progressBar._animation.cancel();
        progressBar._animation = null;
      }
      
      const duration = FEATURED_HERO_INTERVAL_MS;
      const elapsed = progressPausedTime;
      const remaining = duration - elapsed;
      
      // Use Web Animations API for better control
      const pseudoElement = document.createElement('div');
      pseudoElement.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        background: linear-gradient(90deg, #ef2626, #ff4444);
        border-radius: 2px;
        transform: translateX(-100%);
      `;
      
      // Clear existing animation
      progressBar.innerHTML = '';
      progressBar.appendChild(pseudoElement);
      
      const animation = pseudoElement.animate(
        [
          { transform: 'translateX(-100%)' },
          { transform: 'translateX(0%)' }
        ],
        {
          duration: remaining,
          easing: 'linear'
        }
      );
      
      animation.onfinish = () => {
        if (!isPaused) {
          goTo(index + 1);
        }
      };
      
      // Store animation reference to pause it
      progressBar._animation = animation;
    }

    function pauseProgressBar() {
      if (!progressBar || !progressBar._animation) return;
      progressBar._animation.pause();
      progressPausedTime += Date.now() - progressStartTime;
    }

    function resumeProgressBar() {
      if (!progressBar) return;
      
      // If there's an existing paused animation, just resume it
      if (progressBar._animation) {
        progressBar._animation.play();
        progressStartTime = Date.now();
      } else {
        // Otherwise start a new animation from the paused position
        startProgressBarAnimation();
      }
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
      resetProgressBar();
    }

    function restartTimer() {
      clearInterval(timer);
      if (reduceMotion || FEATURED_HERO_MOVIES.length <= 1 || isPaused) return;
      timer = setInterval(() => goTo(index + 1), FEATURED_HERO_INTERVAL_MS);
    }

    if (dotsWrapper && FEATURED_HERO_MOVIES.length > 1) {
      dotsWrapper.innerHTML = FEATURED_HERO_MOVIES.map(
        (_, i) =>
          `<button type="button" class="featured-hero-dot${i === 0 ? " is-active" : ""}" role="tab" aria-selected="${i === 0}" data-index="${i}" aria-label="Affiche ${i + 1} sur ${FEATURED_HERO_MOVIES.length}"></button>`
      ).join("");
      dotsWrapper.addEventListener("click", (e) => {
        const btn = e.target.closest(".featured-hero-dot");
        if (!btn) return;
        const i = parseInt(btn.getAttribute("data-index"), 10);
        if (!Number.isNaN(i)) goTo(i);
        restartTimer();
      });
    } else if (dotsWrapper) {
      dotsWrapper.innerHTML = "";
    }

    // Pause button functionality
    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => {
        isPaused = !isPaused;
        pauseBtn.classList.toggle("is-paused", isPaused);
        pauseBtn.setAttribute("aria-label", isPaused ? "Play" : "Pause");
        if (isPaused) {
          clearInterval(timer);
          pauseProgressBar();
        } else {
          restartTimer();
          resumeProgressBar();
        }
      });
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
    applyCurrentFiltersToGrid();

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
  if (isHomePage) {
    renderHomeCategorySections();
    updateTotalMovies();
    setupGridFavoriteButtons();
  } else {
    movies
      .filter(movie => !pageContentType || (movie.type || "film") === pageContentType)
      .forEach(movie => {
        movieGrid.appendChild(createMovieCard(movie));
      });

    updateTotalMovies();
    window.applyMoviePagination(1);
    setupGridFavoriteButtons(movieGrid);
  }

  setupScrollAnimations();
}


const applyBtn = document.getElementById("apply-filters");

applyBtn?.addEventListener("click", () => {
  applyCurrentFiltersToGrid();

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
  const query = urlParams.get("q") || "";
  const normalizedQuery = normalizeSearch(query);

  const pageSearchInput = document.getElementById("page-search-input");
  const navSearchInput = document.getElementById("search-input");

  if (query) {
    if (pageSearchInput) {
      pageSearchInput.value = query;
    }
    if (navSearchInput) {
      navSearchInput.value = "";
    }
    filterMovies(normalizedQuery);
  }

  if (pageSearchInput) {
    pageSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const value = pageSearchInput.value.trim();
        if (value) {
          window.location.href = `search.html?q=${encodeURIComponent(value)}`;
        }
      }
    });
  }

  function filterMovies(searchText) {
    const movieGrid = document.getElementById("movieGrid");
    if (!movieGrid) return;

    const movies = movieGrid.querySelectorAll(".movie-grid-item");

    movies.forEach(movie => {
      const title = movie.getAttribute("data-title") || "";
      const normalizedTitle = normalizeSearch(title);
      movie.dataset.searchVisible = String(normalizedTitle.includes(searchText));
    });

    window.applyMoviePagination?.(1);
  }
});
