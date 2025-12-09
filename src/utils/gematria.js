export function getGematria(text) {
  if (!text) return 0;

  const values = {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90,
    'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400,
    'ך': 20, 'ם': 40, 'ן': 50, 'ף': 80, 'ץ': 90
  };

  // 1. Replace Maqaf (Hebrew Hyphen) with a space
  let formatted = text.replace(/\u05BE/g, " ");
  
  // 2. Remove anything that isn't a Hebrew letter
  const clean = formatted.replace(/[^\u05D0-\u05EA]/g, "");

  return clean.split('').reduce((sum, char) => sum + (values[char] || 0), 0);
}