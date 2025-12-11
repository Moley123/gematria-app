import requests
import json
import os
import time

# CONFIGURATION
BOOKS = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"]

timeline = []
global_verse_index = 0

print("Building Verse Timeline...")

for book in BOOKS:
    print(f"  Fetching {book} structure...")
    # We fetch the structure from Sefaria
    url = f"https://www.sefaria.org/api/texts/{book}?pad=0&context=0"

    try:
        response = requests.get(url)
        if response.status_code != 200:
            print(f"    Error: Failed to fetch {book} (Status {response.status_code})")
            continue

        data = response.json()
        text = data['text'] # This is the structure (Chapters -> Verses)

        for chap_i, chapter in enumerate(text):
            for verse_i, _ in enumerate(chapter):
                global_verse_index += 1

                # Create the standard ref: "Genesis 1:1"
                ref = f"{book} {chap_i+1}:{verse_i+1}"

                timeline.append({
                    "i": global_verse_index,
                    "r": ref,
                    "b": book 
                })
        time.sleep(0.5) # Pause to be polite to the API

    except Exception as e:
        print(f"    Critical Error on {book}: {e}")

# Save
script_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(script_dir, '..', 'src', 'data', 'verse_timeline.json')

print(f"Saving {len(timeline)} verses to {output_path}...")

# Ensure directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(timeline, f, separators=(',', ':'))

print("Done! Restart your React app now.")