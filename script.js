document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.querySelector('.search-box');
    const searchIcon = document.querySelector('.search-icon');
    
    const movies = [
        { title: "Avengers Endgame", image: "https://i.imgur.com/yKxf3NM.jpeg", resolution: "4K" },
        { title: "Anna et l'Apocalypse", image: "https://i.imgur.com/1wanblj.jpeg", resolution: "1080p" },
        { title: "Violent Night", image: "https://i.imgur.com/PpkJr2u.jpeg", resolution: "1080p" },
        { title: "There's Something in the Barn", image: "https://i.imgur.com/i3Tr6jB.jpeg", resolution: "4K" },
    ];
    
    // Fonction de recherche
    function searchMovies(query) {
        // Recherche floue : correspondance partielle du titre
        const results = movies.filter(movie => movie.title.toLowerCase().includes(query.toLowerCase()));
        return results;
    }

    // Ajouter l'événement au bouton de recherche
    searchIcon.addEventListener('click', () => {
        const query = searchBox.value.trim();
        if (query) {
            const results = searchMovies(query);

            // Sauvegarder les résultats dans le localStorage pour la page de résultats
            localStorage.setItem('searchResults', JSON.stringify(results));

            // Rediriger vers la page des résultats
            window.location.href = 'results.html'; // Assure-toi que cette page existe
        }
    });

    // Ajouter un événement pour rechercher en temps réel
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href="#top"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
});
