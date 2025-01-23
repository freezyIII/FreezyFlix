from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time

# Liste des liens à ouvrir
links = [
    "https://exemple1.com",
    "https://exemple2.com",
    "https://exemple3.com"
    # Ajouter d'autres liens
]

# Configuration du WebDriver (ici, on utilise Chrome)
options = webdriver.ChromeOptions()
options.add_argument('--headless')  # Optionnel : pour lancer le navigateur sans interface graphique
driver = webdriver.Chrome(executable_path="/chemin/vers/chromedriver", options=options)

# Fonction pour vérifier le bouton et cliquer dessus
def handle_button():
    try:
        # Attendre que le bouton "Accéder au lien" soit visible
        button = driver.find_element(By.XPATH, "//button[contains(text(), 'Accéder au lien')]")
        if button.is_displayed():
            print("Bouton 'Accéder au lien' trouvé, on clique !")
            button.click()
            time.sleep(2)  # Attendre un peu pour simuler une interaction
    except Exception as e:
        print(f"Erreur lors de la recherche du bouton : {e}")

# Fonction principale qui parcourt les liens
def process_links():
    for link in links:
        driver.get(link)
        print(f"Ouverture du lien : {link}")
        time.sleep(3)  # Attendre que la page se charge

        handle_button()  # Vérifier et cliquer sur le bouton si présent

        # Fermer l'onglet après l'action
        driver.close()
        time.sleep(60)  # Attendre 1 minute avant d'ouvrir le prochain lien

# Lancer l'automatisation
process_links()

# Fermer le navigateur
driver.quit()
