// Index.html //

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const searchBox = document.getElementById('searchInput');
    
    const handleSearch = () => {
        const query = searchBox.value.trim();
        if (query) window.location.href = `results.html?q=${encodeURIComponent(query)}`;
    };

    searchForm.addEventListener('submit', (e) => { e.preventDefault(); handleSearch(); });
    searchBox.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } });
});




// results.html //

const allMovies = [
    { title: "There's Something in the Barn", image: "https://i.imgur.com/i3Tr6jB.jpeg", resolution: "4K", youtubeUrl: "https://www.youtube.com/watch?v=5AhEm7pyc74" },
    { title: "Violent Night", image: "https://i.imgur.com/PpkJr2u.jpeg", resolution: "1080p" },
    { title: "Anna et l'Apocalypse", image: "https://i.imgur.com/1wanblj.jpeg", resolution: "1080p" },
    { title: "Avengers Endgame", image: "https://i.imgur.com/yKxf3NM.jpeg", resolution: "1080p" },
    { title: "Bienvenue chez les Loud Espionner peut attendre", image: "https://i.imgur.com/1dRieL3.jpeg", resolution: "1080p" },
    { title: "Garfield Héros malgré lui", image: "https://i.imgur.com/FxQKHhv.png", resolution: "1080p" },
    { title: "Astérix Le Domaine des dieux", image: "https://i.imgur.com/fePZs1s.png", resolution: "1080p" },
    { title: "Descendants L'Ascension de Red", image: "https://i.imgur.com/FrJY4mf.jpeg", resolution: "1080p" },
    { title: "L'Étrange Noël du petit Batman", image: "https://i.imgur.com/49k2NVQ.png", resolution: "1080p" },
    { title: "Ninja Turtles Teenage Years", image: "https://i.imgur.com/L7gLeDh.png", resolution: "1080p" },
    { title: "South Park la fin de l'obésité", image: "https://i.imgur.com/WItI643.png", resolution: "1080p" },
    { title: "Tempête de boulettes géantes", image: "https://i.imgur.com/HZKkI4T.png", resolution: "1080p" },
    { title: "Astérix Le Secret de la potion magique", image: "https://i.imgur.com/pHwKexK.png", resolution: "1080p" },
    { title: "Wonka", image: "https://i.imgur.com/E8u1cWC.png", resolution: "4K" },
    { title: "", image: "", resolution: "1080p" },
    { title: "", image: "", resolution: "1080p" },
    { title: "", image: "", resolution: "1080p" },
    { title: "", image: "", resolution: "1080p" },
    { title: "", image: "", resolution: "1080p" },
    { title: "", image: "", resolution: "1080p" },
    { title: "", image: "", resolution: "1080p" },
    { title: "", image: "", resolution: "1080p" },
    { title: "", image: "", resolution: "1080p" },
    { title: "", image: "", resolution: "1080p" },
];

function displayResults(movies) {
    const movieGrid = document.getElementById('movieGrid');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const resultsCountMessage = document.getElementById('resultsCountMessage');
    movieGrid.innerHTML = movies.map(movie => `
        <div class="movie-grid-item">
            <img src="${movie.image}" alt="${movie.title}">
            <div class="resolution">${movie.resolution}</div>
        </div>`).join('');

    if (movies.length === 0) {
        noResultsMessage.style.display = 'block';
        resultsCountMessage.style.display = 'none';
    } else {
        noResultsMessage.style.display = 'none';
        resultsCountMessage.style.display = 'block';
        resultsCountMessage.textContent = `${movies.length} film${movies.length > 1 ? 's' : ''} trouvé${movies.length > 1 ? 's' : ''}`;
    }
}

function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function searchMovies() {
    const query = removeAccents(document.getElementById('searchInput').value.trim().toLowerCase());
    const filteredMovies = query ? allMovies.filter(m => 
        removeAccents(m.title.toLowerCase()).includes(query)
    ) : allMovies;
    
    displayResults(filteredMovies);

    const url = new URL(window.location.href);
    url.searchParams.set('q', query);
    window.history.pushState({}, '', url);
}



document.getElementById('searchInput').addEventListener('keypress', (e) => {
    const query = document.getElementById('searchInput').value.trim();
    if (e.key === 'Enter' && query) {
        e.preventDefault();
        searchMovies();
    }
});

document.querySelector('.search-icon').addEventListener('click', () => {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        searchMovies();
    }
});


const query = new URLSearchParams(window.location.search).get('q') || '';
document.getElementById('searchInput').value = query;
if (query) searchMovies(); else displayResults(allMovies);
