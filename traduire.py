import json
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

with open("textes_fr.json", "r", encoding="utf-8") as f:
    textes_fr = json.load(f)

resultat = {}

print("Chargement de NLLB-200 600M...")
model_name = "facebook/nllb-200-distilled-600M"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

langues = {
    "zu": "zul_Latn", "ln": "lin_Latn", "sn": "sna_Latn", "sw": "swh_Latn",
    "am": "amh_Ethi", "yo": "yor_Latn", "ha": "hau_Latn", "wo": "wol_Latn",
    "de": "deu_Latn", "ar": "arb_Arab", "pt": "por_Latn", "es": "spa_Latn",
    "zh": "zho_Hans", "it": "ita_Latn",
}

for code_langue, code_nllb in langues.items():
    print(f"Traduction en {code_langue}...")
    resultat[code_langue] = {}
    for cle, texte in textes_fr.items():
        inputs = tokenizer(texte, return_tensors="pt", truncation=True, max_length=512)
        with torch.inference_mode():
            outputs = model.generate(
                **inputs,
                forced_bos_token_id=tokenizer.convert_tokens_to_ids(code_nllb),
                max_new_tokens=512,
                num_beams=4
            )
        resultat[code_langue][cle] = tokenizer.decode(outputs[0], skip_special_tokens=True)

with open("traductions_generees.json", "w", encoding="utf-8") as f:
    json.dump(resultat, f, ensure_ascii=False, indent=2)

print("Terminé !")