document.addEventListener('DOMContentLoaded', () => {
    const goHome = document.getElementById('goHome');
    const goHomeLink = document.getElementById('goHomeLink');

    // Fonction pour faire défiler la page jusqu'en haut
    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Ajouter un événement au clic du logo
    goHome.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToTop();
    });

    // Ajouter un événement au clic du lien "Accueil"
    goHomeLink.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToTop();
    });
});
