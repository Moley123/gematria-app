import requests
import json
import re
import os
import time

# 1. SETUP: Categories to fetch from Sefaria
# These "slugs" represent lists of topics in Sefaria's database
TOPIC_CATEGORIES = [
    "biblical-figure",  # Abraham, Sarah, Moses...
    "holiday",          # Shabbat, Pesach, Chanukah...
    "torah-portion",    # Bereshit, Noach...
    "places",           # Jerusalem, Egypt, Zion...
    "prayer",           # Amidah, Kaddish...
    "talmudic-people",  # Rabbi Akiva, Hillel...
    "angel",            # Michael, Gabriel...
    "jewish-concepts"   # Tzedakah, Teshuva...
]

# Gematria Map
gematria_map = {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90,
    'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400,
    'ך': 20, 'ם': 40, 'ן': 50, 'ף': 80, 'ץ': 90
}

def get_gematria_value(text):
    clean = re.sub(r'[^\u05D0-\u05EA]', '', text)
    return sum(gematria_map.get(char, 0) for char in clean)

# 2. LOAD EXISTING DATA (To preserve your manual entries)
script_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(script_dir, '..', 'src', 'data', 'common_gematria.json')

common_db = {}
try:
    with open(output_path, 'r', encoding='utf-8') as f:
        common_db = json.load(f)
    print(f"Loaded existing DB with {len(common_db)} keys.")
except FileNotFoundError:
    print("No existing DB found. Starting fresh.")

# 3. FETCH FROM API
print("Fetching Topics from Sefaria (this may take 30s)...")

for category in TOPIC_CATEGORIES:
    print(f"  fetching '{category}'...")
    try:
        # Sefaria API Endpoint for Sub-topics
        url = f"https://www.sefaria.org/api/topics/subclass/{category}"
        response = requests.get(url)
        data = response.json()
        
        # Sefaria returns a list of topic objects
        # We handle cases where it might return a dict or list
        if isinstance(data, dict) and 'topics' in data:
            items = data['topics'] # Some endpoints wrap it
        elif isinstance(data, list):
            items = data
        else:
            items = []

        count = 0
        for item in items:
            # We need both Hebrew ('he') and English ('en') titles
            he = item.get('he', '')
            en = item.get('en', '')
            
            # primary title might be inside 'primaryTitle' sometimes
            if not he and 'primaryTitle' in item:
                he = item['primaryTitle'].get('he', '')
                en = item['primaryTitle'].get('en', '')

            if he and en:
                val = get_gematria_value(he)
                if val > 0:
                    str_val = str(val)
                    if str_val not in common_db:
                        common_db[str_val] = []
                    
                    # Create a nice label: "Moshe (Moses)"
                    entry = f"{he} ({en})"
                    
                    # Avoid Duplicates
                    if entry not in common_db[str_val]:
                         # Check if "he" is already in the list to avoid "Moshe (Moses)" vs "Moshe (Prophet)" clutter
                         # logic: if the Hebrew word is already represented, maybe skip?
                         # For now, let's just add it.
                         common_db[str_val].append(entry)
                         count += 1
        
        print(f"    + Added {count} entries.")
        time.sleep(0.5) # Be polite to API

    except Exception as e:
        print(f"    Error fetching {category}: {e}")

# 4. SAVE
print("Saving expanded dictionary...")
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(common_db, f, ensure_ascii=False) # Minified to save space
    # For pretty print use: json.dump(common_db, f, ensure_ascii=False, indent=2)

print(f"Done! Database updated at {output_path}")