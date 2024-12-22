document.addEventListener('DOMContentLoaded', () => {

    const featuredMovies = [
        { thumbnail: "https://i.ibb.co/4Ww5fXm/terrifier-4bd553c496-1.jpg", resolution: "4K", video: "movie1.mp4" }
    ];
    const otherMovies = [
        { thumbnail: "https://i.ibb.co/XYRNH37/output-1.jpg", resolution: "4K", video: "Garfield Héros malgré lui" },
        { thumbnail: "https://i.ibb.co/4Ww5fXm/terrifier-4bd553c496-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/7yBKXsr/3044641-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/jy6MpM8/19bc78f00ec32afa499f22eaaaf87c6257984e6863b92301803c470a9378ec56-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/8NJPWQj/0472053-1.jpg", resolution: "4K", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/XYRNH37/output-1.jpg", resolution: "4K", video: "Garfield Héros malgré lui" },
        { thumbnail: "https://i.ibb.co/4Ww5fXm/terrifier-4bd553c496-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/7yBKXsr/3044641-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/jy6MpM8/19bc78f00ec32afa499f22eaaaf87c6257984e6863b92301803c470a9378ec56-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/8NJPWQj/0472053-1.jpg", resolution: "4K", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/XYRNH37/output-1.jpg", resolution: "4K", video: "Garfield Héros malgré lui" },
        { thumbnail: "https://i.ibb.co/4Ww5fXm/terrifier-4bd553c496-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/7yBKXsr/3044641-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/jy6MpM8/19bc78f00ec32afa499f22eaaaf87c6257984e6863b92301803c470a9378ec56-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/8NJPWQj/0472053-1.jpg", resolution: "4K", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/XYRNH37/output-1.jpg", resolution: "4K", video: "Garfield Héros malgré lui" },
        { thumbnail: "https://i.ibb.co/4Ww5fXm/terrifier-4bd553c496-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/7yBKXsr/3044641-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/jy6MpM8/19bc78f00ec32afa499f22eaaaf87c6257984e6863b92301803c470a9378ec56-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/8NJPWQj/0472053-1.jpg", resolution: "4K", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/XYRNH37/output-1.jpg", resolution: "4K", video: "Garfield Héros malgré lui" },
        { thumbnail: "https://i.ibb.co/4Ww5fXm/terrifier-4bd553c496-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/7yBKXsr/3044641-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/jy6MpM8/19bc78f00ec32afa499f22eaaaf87c6257984e6863b92301803c470a9378ec56-1.jpg", resolution: "1080p", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "https://i.ibb.co/8NJPWQj/0472053-1.jpg", resolution: "4K", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "", resolution: "4K", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "", resolution: "4K", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "", resolution: "4K", video: "" }
    ];

    const movieGrid = document.getElementById("movieGrid");
    const movieContainer = document.getElementById("movieContainer");

    // Ajouter un film à la section "À la une"
    function addFeaturedMovie(movie) {
        const movieItem = document.createElement("div");
        movieItem.classList.add("movie-item");

        const img = document.createElement("img");
        img.src = movie.thumbnail;
        img.alt = "Film";
        movieItem.appendChild(img);

        const resolution = document.createElement("div");
        resolution.classList.add("resolution");
        resolution.textContent = movie.resolution;
        movieItem.appendChild(resolution);

        // Ajouter un événement de clic pour ouvrir le lecteur vidéo avec la description
        movieItem.addEventListener('click', () => openMovieDetail(movie));

        movieContainer.appendChild(movieItem);
    }

    // Fonction pour ajouter les films à la grille "Découvrir d'autres films"
    function addMovieToGrid(movie) {
        const gridItem = document.createElement("div");
        gridItem.classList.add("movie-grid-item");
        gridItem.classList.add("hidden"); // Initialement masqué

        const img = document.createElement("img");
        img.src = movie.thumbnail;
        img.alt = "Film";
        gridItem.appendChild(img);

        const resolution = document.createElement("div");
        resolution.classList.add("resolution");
        resolution.textContent = movie.resolution || '1080p';
        gridItem.appendChild(resolution);

        gridItem.addEventListener('click', () => openMovieDetail(movie));

        movieGrid.appendChild(gridItem);

        // Observer pour déclencher l'affichage au scroll
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Ajouter la classe 'visible' pour l'animation d'apparition
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // Arrêter d'observer après l'animation
                }
            });
        }, { threshold: 0.1 }); // Déclenche à 10% de visibilité

        observer.observe(gridItem);
    }

    // Ajouter le film à la une
    featuredMovies.forEach(movie => addFeaturedMovie(movie));

    // Ajouter les autres films à la grille
    otherMovies.forEach(movie => addMovieToGrid(movie));

});
