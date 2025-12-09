function parseRef(refString) {
  // Matches "Genesis 7:5" or "Exodus 12:1"
  const match = refString.match(/^([A-Za-z\s]+) (\d+):(\d+)$/);
  if (!match) return null;
  return {
    book: match[1],
    chapter: parseInt(match[2]),
    verse: parseInt(match[3])
  };
}

export function isRefInParsha(resultRef, parsha) {
  const ref = parseRef(resultRef);
  if (!ref || ref.book !== parsha.book) return false;

  // Check Start Boundary
  if (ref.chapter < parsha.start[0]) return false;
  if (ref.chapter === parsha.start[0] && ref.verse < parsha.start[1]) return false;

  // Check End Boundary
  if (ref.chapter > parsha.end[0]) return false;
  if (ref.chapter === parsha.end[0] && ref.verse > parsha.end[1]) return false;

  return true;
}