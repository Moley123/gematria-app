import requests
import json
import os
import re
import time
import sys

# Standard Chapter Counts
BOOKS_STRUCTURE = [
    ("Genesis", 50),
    ("Exodus", 40),
    ("Leviticus", 27),
    ("Numbers", 36),
    ("Deuteronomy", 34)
]

output_data = []
missing_chapters = []

def clean_hebrew(text):
    # STEP 1: Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)

    # STEP 2: Replace Maqqef (Hebrew Hyphen) & standard hyphen with SPACE
    # CRITICAL: We do this FIRST so "Et-Moshe" becomes "Et Moshe" (Two words)
    text = text.replace('־', ' ').replace('-', ' ')

    # STEP 3: Remove Vowels & Cantillation (Range 0591-05C7)
    # We delete these so letters connect (e.g. "L'Moshe" stays one word)
    text = re.sub(r'[\u0591-\u05C7]', '', text)

    # STEP 4: Replace any remaining non-Hebrew characters with SPACE
    # This fixes the Numbers 32:33 "glitch" by turning hidden punctuation into a separator.
    text = re.sub(r'[^\u05D0-\u05EA\s]', ' ', text)
    
    return text

print("Fetching Torah text (Chapter by Chapter)...")

global_index = 0

for book, total_chapters in BOOKS_STRUCTURE:
    print(f"\nProcessing {book} ({total_chapters} chapters)...")
    
    for chapter_num in range(1, total_chapters + 1):
        url = f"https://www.sefaria.org/api/texts/{book}.{chapter_num}?context=0"
        
        success = False
        for attempt in range(5):
            try:
                response = requests.get(url, timeout=30)
                if response.status_code == 200:
                    success = True
                    break
            except:
                time.sleep(2)
        
        if not success:
            print(f"  [FAILED] Could not fetch {book} Ch {chapter_num}")
            missing_chapters.append(f"{book} {chapter_num}")
            continue

        try:
            data = response.json()
            he_text = data['he'] 
            
            sys.stdout.write(".")
            sys.stdout.flush()

            for v_i, verse in enumerate(he_text):
                # Clean the text using the new CORRECT ORDER
                clean = clean_hebrew(verse)
                
                # Collapse multiple spaces into one
                clean = " ".join(clean.split())
                
                output_data.append({
                    "b": book,
                    "r": f"{book} {chapter_num}:{v_i+1}",
                    "t": clean,
                    "o": verse,
                    "i": global_index
                })
                global_index += 1
        except Exception as e:
            print(f"\n  [ERROR] parsing {book} {chapter_num}: {e}")
            missing_chapters.append(f"{book} {chapter_num}")
            
    time.sleep(0.5) 

# Save to PUBLIC folder
script_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(script_dir, '..', 'public', 'torah_text.json')

print(f"\n\nSaving {len(output_data)} verses to {output_path}...")

if len(missing_chapters) > 0:
    print("\n[!] WARNING: The following chapters failed to download:")
    for ch in missing_chapters:
        print(f"   - {ch}")
    print("[X] Please run the script again to fix the gaps.")
elif len(output_data) < 5840:
    print(f"[!] WARNING: Total verse count ({len(output_data)}) is lower than expected (5845).")
else:
    print("[SUCCESS] Full Torah downloaded (5845 verses).")

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, separators=(',', ':'), ensure_ascii=False)