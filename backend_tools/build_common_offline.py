import json
import re
import os

# --- 1. THE DICTIONARY ---
# A curated list of 100+ Jewish concepts, Names, and Holidays
HEBREW_CONCEPTS = [
    # -- PEOPLE --
    ("אדם", "Adam"), ("חוה", "Eve"), ("קין", "Cain"), ("הבל", "Abel"),
    ("נח", "Noah"), ("אברהם", "Avraham"), ("שרה", "Sarah"), ("יצחק", "Yitzchak"),
    ("רבקה", "Rivka"), ("יעקב", "Yaakov"), ("רחל", "Rachel"), ("לאה", "Leah"),
    ("יוסף", "Yosef"), ("משה", "Moshe"), ("אהרן", "Aharon"), ("מרים", "Miriam"),
    ("דוד", "David"), ("שלמה", "Solomon"), ("שאול", "Saul"), ("שמואל", "Samuel"),
    ("אסתר", "Esther"), ("מרדכי", "Mordechai"), ("אליהו", "Eliyahu"),
    ("ראובן", "Reuven"), ("שמעון", "Shimon"), ("לוי", "Levi"), ("יהודה", "Yehuda"),
    ("יששכר", "Issachar"), ("זבולון", "Zevulun"), ("דן", "Dan"), ("נפתלי", "Naftali"),
    ("גד", "Gad"), ("אשר", "Asher"), ("בנימין", "Benjamin"), ("אפרים", "Ephraim"), ("מנשה", "Menashe"),

    # -- HOLIDAYS --
    ("שבת", "Shabbat"), ("ראש השנה", "Rosh Hashanah"), ("יום כיפור", "Yom Kippur"),
    ("סוכות", "Sukkot"), ("שמחת תורה", "Simchat Torah"), ("חנוכה", "Chanukah"),
    ("פורים", "Purim"), ("פסח", "Pesach"), ("שבועות", "Shavuot"), ("ראש חודש", "Rosh Chodesh"),
    ("תשעה באב", "Tisha B'Av"), ("ל\"ג בעומר", "Lag BaOmer"),

    # -- CONCEPTS --
    ("תורה", "Torah"), ("מצוה", "Mitzvah"), ("צדקה", "Tzedakah"), ("תשובה", "Teshuva"),
    ("תפילה", "Tefillah"), ("חסד", "Chesed"), ("גבורה", "Gevurah"), ("תפארת", "Tiferet"),
    ("נצח", "Netzach"), ("הוד", "Hod"), ("יסוד", "Yesod"), ("מלכות", "Malchut"),
    ("כתר", "Keter"), ("חכמה", "Chochmah"), ("בינה", "Binah"), ("דעת", "Daat"),
    ("ישראל", "Yisrael"), ("ירושלים", "Jerusalem"), ("ציון", "Zion"),
    ("בית המקדש", "The Temple"), ("משיח", "Mashiach"), ("גן עדן", "Gan Eden"),
    ("גיהנום", "Gehinnom"), ("עולם הבא", "World to Come"), ("נשמה", "Soul"),
    ("רוח", "Spirit"), ("נפש", "Soul (Nefesh)"), ("שכינה", "Shechinah"),
    ("אמן", "Amen"), ("הללויה", "Hallelujah"), ("שמע", "Shema"), ("שלום", "Shalom"),
    ("מזל טוב", "Mazel Tov"), ("חיים", "Chaim (Life)"), ("אמת", "Emet (Truth)"),

    # -- MONTHS --
    ("תשרי", "Tishrei"), ("חשון", "Cheshvan"), ("כסלו", "Kislev"), ("טבת", "Tevet"),
    ("שבט", "Shevat"), ("אדר", "Adar"), ("ניסן", "Nisan"), ("אייר", "Iyar"),
    ("סיון", "Sivan"), ("תמוז", "Tammuz"), ("אב", "Av"), ("אלול", "Elul"),

    # -- NUMBERS/LETTERS --
    ("אחד", "Echad (One)"), ("אהבה", "Ahava (Love)"), ("י-ה-ו-ה", "Hashem"), ("אלוהים", "Elohim")
]

# --- 2. CALCULATOR LOGIC ---
gematria_map = {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90,
    'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400,
    'ך': 20, 'ם': 40, 'ן': 50, 'ף': 80, 'ץ': 90
}

def get_gematria_value(text):
    # Remove hyphens or non-hebrew chars
    clean = re.sub(r'[^\u05D0-\u05EA]', '', text)
    return sum(gematria_map.get(char, 0) for char in clean)

# --- 3. BUILD DATABASE ---
common_db = {}
print(f"Processing {len(HEBREW_CONCEPTS)} entries...")

for he, en in HEBREW_CONCEPTS:
    val = get_gematria_value(he)
    if val > 0:
        str_val = str(val)
        if str_val not in common_db:
            common_db[str_val] = []
        
        entry = f"{he} ({en})"
        # Avoid duplicates
        if entry not in common_db[str_val]:
            common_db[str_val].append(entry)

# --- 4. SAVE ---
script_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(script_dir, '..', 'src', 'data', 'common_gematria.json')

print(f"Saving to {output_path}...")
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(common_db, f, ensure_ascii=False, indent=2)

print("Done! You now have a massive Gematria file.")