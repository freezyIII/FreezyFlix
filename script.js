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
    let movieIndex = 0;

    // Fonction pour ajouter des films à la grille
    function addMoviesToGrid() {
        // Charger les films jusqu'à 10 à la fois pour améliorer les performances
        for (let i = movieIndex; i < movieIndex + 10 && i < otherMovies.length; i++) {
            const movie = otherMovies[i];
            const gridItem = document.createElement("div");
            gridItem.classList.add("movie-grid-item");

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
        }

        movieIndex += 10; // Augmenter l'index pour ajouter 10 films à chaque fois
    }

    // Ajout des films "À la une" dès le début
    featuredMovies.forEach(movie => addFeaturedMovie(movie));

    // Détecter le défilement et charger des films quand l'utilisateur atteint le bas
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
            addMoviesToGrid(); // Charger les films au fur et à mesure du défilement
        }
    });

    // Ajouter les films au début
    addMoviesToGrid();

    // Fonction pour ajouter un film à la section "À la une"
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

        movieItem.addEventListener('click', () => openMovieDetail(movie));

        movieContainer.appendChild(movieItem);
    }

    // Fonction pour ouvrir la vidéo
    function openMovieDetail(movie) {
        const movieDetail = document.getElementById('movieDetail');
        const videoPlayer = document.createElement('video');
        videoPlayer.src = movie.video;
        videoPlayer.controls = true;
        videoPlayer.style.width = "80%";
        videoPlayer.style.height = "80%";
        videoPlayer.disablePictureInPicture = true;

        const videoContainer = document.getElementById('videoContainer');
        videoContainer.innerHTML = '';  // Vider le conteneur
        videoContainer.appendChild(videoPlayer);  // Ajouter la vidéo

        const movieDescription = document.getElementById('movieDescription');
        movieDescription.innerHTML = `<p>${movie.description}</p>`;  // Ajouter la description

        movieDetail.style.display = 'flex';  // Afficher le détail du film
    }

    // Fonction pour fermer la vidéo
    document.getElementById('backButton').addEventListener('click', function () {
        document.getElementById('movieDetail').style.display = 'none';  // Masquer le détail du film
    });

});
