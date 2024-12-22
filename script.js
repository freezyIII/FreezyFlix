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
        { thumbnail: "", resolution: "4K", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "", resolution: "4K", video: "Garfield Héros malgré lui.mp4" },
        { thumbnail: "", resolution: "4K", video: "" },
    ];

    const movieGrid = document.getElementById("movieGrid");
    const movieContainer = document.getElementById("movieContainer");

    // Ajouter un film à la section "Découvrir d'autres films"
    function addMovieToGrid(movie) {
        const gridItem = document.createElement("div");
        gridItem.classList.add("movie-grid-item", "lazy-load");

        const img = document.createElement("img");
        img.src = movie.thumbnail;
        img.alt = "Film";
        gridItem.appendChild(img);

        const resolution = document.createElement("div");
        resolution.classList.add("resolution");
        resolution.textContent = movie.resolution || '1080p';
        gridItem.appendChild(resolution);

        movieGrid.appendChild(gridItem);
    }

    // Ajouter les films
    otherMovies.forEach(movie => addMovieToGrid(movie));

    // Intersection Observer pour l'affichage des films au scroll
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target); // Arrêter d'observer l'élément après l'affichage
            }
        });
    }, {
        threshold: 0.1 // Le film est visible à 10% pour déclencher l'animation
    });

    // Observer tous les films "lazy-load"
    document.querySelectorAll('.lazy-load').forEach(item => {
        observer.observe(item);
    });

});
