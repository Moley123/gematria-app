import requests
import json
import time

# CONFIGURATION
BOOKS = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"]
parsha_list = []

def parse_ref(ref_str):
    # Splits "Genesis 1:1-6:8" into book, start, end
    parts = ref_str.split(maxsplit=1)
    book = parts[0]
    ranges = parts[1]
    
    if '-' in ranges:
        start_str, end_str = ranges.split('-')
    else:
        start_str, end_str = ranges, ranges
        
    def get_cv(s):
        if ':' in s:
            return [int(x) for x in s.split(':')]
        else:
            return [int(s), 1] 

    return book, get_cv(start_str), get_cv(end_str)

def get_verse_count(ref):
    """
    Fetches the text from Sefaria to count the total verses in this range.
    """
    try:
        url = f"https://www.sefaria.org/api/texts/{ref}?context=0&pad=0"
        response = requests.get(url)
        data = response.json()
        
        # Sefaria returns text as a Jagged Array (Chapters -> Verses)
        # We flatten it to count the total verses.
        count = 0
        text_data = data.get('he', [])
        
        if isinstance(text_data, list):
            # Check if it's 1D (just verses) or 2D (chapters of verses)
            if len(text_data) > 0 and isinstance(text_data[0], list):
                # 2D Array: List of Chapters
                for chapter in text_data:
                    count += len(chapter)
            else:
                # 1D Array: List of Verses (single chapter parsha)
                count = len(text_data)
                
        return count
    except Exception as e:
        print(f"Error counting {ref}: {e}")
        return 0

print("Fetching Parsha definitions and counting verses (this may take 30 seconds)...")

for book in BOOKS:
    url = f"https://www.sefaria.org/api/index/{book}"
    data = requests.get(url).json()
    
    parasha_nodes = []
    if 'alts' in data and 'Parasha' in data['alts']:
        parasha_nodes = data['alts']['Parasha']['nodes']
        
    for node in parasha_nodes:
        if 'wholeRef' in node:
            ref = node['wholeRef']
            
            # Get Title
            primary_title = next((t['text'] for t in node['titles'] if t.get('primary')), node['titles'][0]['text'])
            
            # Parse Range
            book_name, start, end = parse_ref(ref)
            
            # Get Count
            print(f"  Counting {primary_title}...")
            v_count = get_verse_count(ref)
            
            parsha_list.append({
                "name": primary_title,
                "book": book_name,
                "start": start,
                "end": end,
                "verse_count": v_count  # <--- NEW FIELD
            })
            
            # Sleep briefly to be polite to the API
            time.sleep(0.2)

# Save to JS file
output_path = './src/utils/parshas.js'
js_content = f"export const PARSHAS = {json.dumps(parsha_list, indent=2)};"

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Saved parshas.js to {output_path}")