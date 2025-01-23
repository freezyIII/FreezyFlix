from flask import Flask
import requests

app = Flask(__name__)

@app.route("/background")
def background_task():
    url = "https://www.clictune.com/klF9"
    response = requests.get(url)
    
    if response.status_code == 200:
        return "Page chargée en arrière-plan."
    else:
        return f"Erreur de chargement: {response.status_code}"

if __name__ == "__main__":
    app.run(debug=True)
