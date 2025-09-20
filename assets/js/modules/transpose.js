// Transpose module: isolates chord transpose logic
export const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

// 擴展的和弦映射，包含等音處理
export const CHORD_MAP = {
  'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11
};

// 等音簡化映射 - 避免出現#b或其他複雜形式
const ENHARMONIC_MAP = {
  'C#b': 'C', 'C##': 'D', 'Cbb': 'Bb',
  'D#b': 'D', 'D##': 'E', 'Dbb': 'C',
  'E#b': 'E', 'E##': 'F#', 'Ebb': 'D',
  'F#b': 'F', 'F##': 'G', 'Fbb': 'Eb',
  'G#b': 'G', 'G##': 'A', 'Gbb': 'F',
  'A#b': 'A', 'A##': 'B', 'Abb': 'G',
  'B#b': 'B', 'B##': 'C#', 'Bbb': 'A'
};

export function transposeChord(chord, diff) {
  // 輸入驗證
  if (!chord || typeof chord !== 'string') {
    throw new Error('Invalid chord provided');
  }
  
  if (typeof diff !== 'number' || isNaN(diff)) {
    throw new Error('Invalid semitone difference provided');
  }
  
  // 更完整的和弦解析 - 支援複雜和弦如Bm7, Cmaj7, Dsus4等
  const m = chord.match(/^([A-G][b#]?)(.*)$/);
  if (!m) {
    throw new Error(`Cannot parse chord: ${chord}`);
  }
  
  const [, root, suffix] = m;
  
  // 檢查根音是否在映射表中
  if (!isValidChord(root)) {
    throw new Error(`Invalid chord root: ${root}`);
  }
  
  const idx = (CHORD_MAP[root] + diff + 12) % 12;
  let newRoot = KEYS[idx];
  
  // 檢查是否需要等音簡化
  const fullChord = newRoot + (suffix || '');
  
  // 如果產生了不合理的等音（如C#b），進行簡化
  for (const [complex, simple] of Object.entries(ENHARMONIC_MAP)) {
    if (newRoot === complex) {
      newRoot = simple;
      break;
    }
  }
  
  return newRoot + (suffix || '');
}

export function transposeChordSheet(sheet, fromKey, toKey, capoShift = 0) {
  // 輸入驗證
  if (!sheet || typeof sheet !== 'string') {
    console.warn('Invalid chord sheet provided');
    return sheet || '';
  }
  
  if (!isValidKey(fromKey) || !isValidKey(toKey)) {
    console.warn(`Invalid keys: fromKey=${fromKey}, toKey=${toKey}`);
    return sheet;
  }
  
  // 如果調性相同且沒有capo變化，直接返回
  if (fromKey === toKey && capoShift === 0) {
    return sheet;
  }
  
  try {
    const diff = calculateSemitonesDiff(fromKey, toKey, capoShift);
    
    // 改進的和弦正則表達式 - 支援更多複雜和弦格式，包括斜線和弦
    const chordRegex = /\b([A-G][b#]?)((?:maj|min|m|dim|aug|sus|add|dom|alt)?(?:\d+)?(?:[b#]\d+)?(?:\/([A-G][b#]?))?)\b/g;
    
    return sheet.replace(chordRegex, (match, root, suffix, bassNote) => {
      // 確保只轉換有效的和弦
      if (isValidChord(root)) {
        try {
          let transposedRoot = transposeChord(root, diff);
          
          // 如果有斜線和弦的bass note，也需要轉調
          if (bassNote && isValidChord(bassNote)) {
            const transposedBass = transposeChord(bassNote, diff);
            // 重建suffix，替換原本的bass note
            const newSuffix = suffix.replace('/' + bassNote, '/' + transposedBass);
            return transposedRoot + newSuffix;
          } else {
            return transposedRoot + (suffix || '');
          }
        } catch (error) {
          console.warn(`Failed to transpose chord ${match}:`, error);
          return match; // 轉換失敗時保持原樣
        }
      }
      return match; // 如果不是有效和弦，保持原樣
    });
  } catch (error) {
    console.error('Error in transposeChordSheet:', error);
    return sheet; // 發生錯誤時返回原始內容
  }
}

// 驗證和弦是否有效
export function isValidChord(chord) {
  if (!chord || typeof chord !== 'string') return false;
  const match = chord.match(/^([A-G][b#]?)(.*)$/);
  return match && match[1] in CHORD_MAP;
}

// 驗證調性是否有效
export function isValidKey(key) {
  return key && typeof key === 'string' && key in CHORD_MAP;
}

// 獲取調性在十二平均律中的位置
export function getKeyPosition(key) {
  return CHORD_MAP[key] || -1;
}

// 計算兩個調性之間的半音差
export function calculateSemitonesDiff(fromKey, toKey, capoShift = 0) {
  if (!isValidKey(fromKey) || !isValidKey(toKey)) {
    throw new Error(`Invalid key: ${fromKey} or ${toKey}`);
  }
  return (CHORD_MAP[toKey] - CHORD_MAP[fromKey] - capoShift + 12) % 12;
}
