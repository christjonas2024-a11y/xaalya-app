import json
import time
from gradio_client import Client

client = Client("bivariant/griot-mt-translation-demo")

with open("textes_fr.json", "r", encoding="utf-8") as f:
    textes_fr = json.load(f)

# Noms des langues tels qu'ils apparaissent dans l'interface Griot-MT
langues = {
    "ln": "Lingala",
    "sn": "Shona",
    "sw": "Swahili",
    "am": "Amharique",
    "yo": "Yoruba",
    "ha": "Hausa",
    "wo": "Wolof",
}

resultat = {}

for code_langue, nom_langue in langues.items():
    print(f"\n--- Traduction en {code_langue} ({nom_langue}) ---")
    resultat[code_langue] = {}
    
    for cle, texte in textes_fr.items():
        try:
            traduction = client.predict(
                text=texte,
                source_language="Français",
                target_language=nom_langue,
                num_beams=4,
                max_length=257,
                repetition_penalty=1.3,
                no_repeat_ngram_size=3,
                api_name="/translate"
            )
            resultat[code_langue][cle] = traduction
            print(f"  ✅ {cle}")
        except Exception as e:
            print(f"  ❌ Erreur sur {cle} : {e}")
            resultat[code_langue][cle] = texte
        
        time.sleep(0.5)

with open("traductions_africaines.json", "w", encoding="utf-8") as f:
    json.dump(resultat, f, ensure_ascii=False, indent=2)

print("\n✅ Terminé !")