// Transpose module: isolates chord transpose logic
export const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

export const CHORD_MAP = {
  'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11
};

export function transposeChord(chord, diff) {
  const m = chord.match(/^([A-G][b#]?)(.*)$/);
  if (!m) return chord;
  const [, root, suffix] = m;
  const idx = (CHORD_MAP[root] + diff + 12) % 12;
  return KEYS[idx] + (suffix || '');
}

export function transposeChordSheet(sheet, fromKey, toKey, capoShift = 0) {
  if (!fromKey || !toKey || !(fromKey in CHORD_MAP) || !(toKey in CHORD_MAP)) return sheet;
  const diff = (CHORD_MAP[toKey] - CHORD_MAP[fromKey] - capoShift + 12) % 12;
  const chordRegex = /\b([A-G][b#]?)(maj7|sus4|m|min|dim|aug|add\d*|\d*|)?\b/g;
  return sheet.replace(chordRegex, (m, root, suffix) => transposeChord(root + (suffix || ''), diff));
}
