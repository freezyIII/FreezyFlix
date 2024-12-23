document.addEventListener('DOMContentLoaded', () => {
    // Fonction qui gère le lazy loading pour les films
    const movieGrid = document.getElementById("movieGrid");

    // Ajouter un événement de défilement pour afficher les films quand ils sont visibles
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Arrêter d'observer après l'animation
            }
        });
    }, { threshold: 0.1 });

    // Observer pour chaque élément de film dans la grille
    const movieItems = document.querySelectorAll('.movie-grid-item');
    movieItems.forEach(item => observer.observe(item));
});
