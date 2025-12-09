import requests
import json
import re
import os

# CONFIGURATION
BOOKS_TO_INDEX = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"]
MAX_PHRASE_LENGTH = 3

gematria_map = {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90,
    'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400,
    'ך': 20, 'ם': 40, 'ן': 50, 'ף': 80, 'ץ': 90
}

def get_gematria_value(text):
    clean = re.sub(r'[^\u05D0-\u05EA]', '', text)
    return sum(gematria_map.get(char, 0) for char in clean)

def clean_html(raw_html):
    cleanr = re.compile('<.*?>')
    return re.sub(cleanr, '', raw_html)

gematria_db = {}

print("Starting Indexing Process...")

for book in BOOKS_TO_INDEX:
    url = f"https://www.sefaria.org/api/texts/{book}?pad=0&context=0"
    print(f"Fetching {book}...")
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        hebrew_text = data['he']
        english_text = data['text']

        for chap_i, (he_chap, en_chap) in enumerate(zip(hebrew_text, english_text)):
            for verse_i, (he_verse, en_verse) in enumerate(zip(he_chap, en_chap)):
                
                clean_english = clean_html(en_verse)
                clean_verse = he_verse.replace('\u05BE', ' ') # Replace Maqaf
                
                # --- 1. INDEX THE WHOLE VERSE (PASUK) ---
                verse_val = get_gematria_value(clean_verse)
                if verse_val > 0:
                    str_val = str(verse_val)
                    if str_val not in gematria_db:
                        gematria_db[str_val] = []
                    
                    gematria_db[str_val].append({
                        "phrase": "(Whole Verse)", # Marker text
                        "original_he": he_verse,   # Store full Hebrew
                        "ref": f"{book} {chap_i+1}:{verse_i+1}",
                        "context_en": clean_english,
                        "isVerse": True # Flag for the UI
                    })

                # --- 2. INDEX PHRASES (SLIDING WINDOW) ---
                raw_words = clean_verse.split()
                n = len(raw_words)
                
                for i in range(n):
                    current_phrase_words = []
                    for j in range(i, min(i + MAX_PHRASE_LENGTH, n)):
                        word = raw_words[j]
                        clean_word = re.sub(r'[^\u05D0-\u05EA]', '', word)
                        
                        if not clean_word: continue
                        
                        current_phrase_words.append(clean_word)
                        has_stop = ':' in word or '.' in word 
                        
                        phrase_str = " ".join(current_phrase_words)
                        val = get_gematria_value(phrase_str)
                        
                        if val > 0:
                            str_val = str(val)
                            if str_val not in gematria_db:
                                gematria_db[str_val] = []
                            
                            # Deduplicate
                            entry = {
                                "phrase": phrase_str,
                                "ref": f"{book} {chap_i+1}:{verse_i+1}",
                                "context_en": clean_english,
                                "isVerse": False
                            }
                            
                            exists = any(x['phrase'] == phrase_str and x['ref'] == entry['ref'] for x in gematria_db[str_val])
                            if not exists:
                                gematria_db[str_val].append(entry)
                        
                        if has_stop: break

    except Exception as e:
        print(f"Error processing {book}: {e}")

# Save to PUBLIC folder (outside src) to avoid Webpack memory crash
script_dir = os.path.dirname(os.path.abspath(__file__))
# Pointing to public/torah_index.json
output_path = os.path.join(script_dir, '..', 'public', 'torah_index.json')
print(f"Saving to {output_path}...")
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(gematria_db, f, ensure_ascii=False)
print("Done!")