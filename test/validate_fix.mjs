// 快速驗證修正的Node.js測試腳本
import fs from 'fs';
import path from 'path';

// 簡化版本的轉調模組（Node.js環境）
const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

const CHORD_MAP = {
  'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11
};

const ENHARMONIC_MAP = {
  'C#b': 'C', 'C##': 'D', 'Cbb': 'Bb',
  'D#b': 'D', 'D##': 'E', 'Dbb': 'C',
  'E#b': 'E', 'E##': 'F#', 'Ebb': 'D',
  'F#b': 'F', 'F##': 'G', 'Fbb': 'Eb',
  'G#b': 'G', 'G##': 'A', 'Gbb': 'F',
  'A#b': 'A', 'A##': 'B', 'Abb': 'G',
  'B#b': 'B', 'B##': 'C#', 'Bbb': 'A'
};

function transposeChord(chord, diff) {
  const m = chord.match(/^([A-G][b#]?)(.*)$/);
  if (!m) return chord;
  
  const [, root, suffix] = m;
  if (!(root in CHORD_MAP)) return chord;
  
  const idx = (CHORD_MAP[root] + diff + 12) % 12;
  let newRoot = KEYS[idx];
  
  // 等音簡化
  for (const [complex, simple] of Object.entries(ENHARMONIC_MAP)) {
    if (newRoot === complex) {
      newRoot = simple;
      break;
    }
  }
  
  return newRoot + (suffix || '');
}

function transposeChordSheet(sheet, fromKey, toKey, capoShift = 0) {
  if (!fromKey || !toKey || !(fromKey in CHORD_MAP) || !(toKey in CHORD_MAP)) return sheet;
  
  const diff = (CHORD_MAP[toKey] - CHORD_MAP[fromKey] - capoShift + 12) % 12;
  
  // 改進的和弦正則表達式 - 支援斜線和弦和複雜後綴
  const chordRegex = /\b([A-G][b#]?)((?:maj|min|m|dim|aug|sus|add|dom|alt)?(?:\d+)?(?:[b#]\d+)?(?:\/([A-G][b#]?))?)\b/g;
  
  return sheet.replace(chordRegex, (match, root, suffix, bassNote) => {
    if (root in CHORD_MAP) {
      let transposedRoot = transposeChord(root, diff);
      
      // 如果有斜線和弦的bass note，也需要轉調
      if (bassNote && bassNote in CHORD_MAP) {
        const transposedBass = transposeChord(bassNote, diff);
        // 重建suffix，替換原本的bass note
        const newSuffix = suffix.replace('/' + bassNote, '/' + transposedBass);
        return transposedRoot + newSuffix;
      } else {
        return transposedRoot + (suffix || '');
      }
    }
    return match;
  });
}

// 測試案例
const testCases = [
  {
    name: "Bug修正測試 - #b問題",
    input: "C D E F G A B",
    fromKey: "C",
    toKey: "Db",
    capo: 0,
    shouldNotContain: ["#b", "b#"]
  },
  {
    name: "Bug修正測試 - 複雜和弦 Bm7",
    input: "Bm7 Cmaj7 Dsus4 Em7",
    fromKey: "C",
    toKey: "D",
    capo: 0,
    expected: "C#m7 Dmaj7 Esus4 F#m7"
  },
  {
    name: "斜線和弦測試",
    input: "C/E Am/C D/F#",
    fromKey: "C",
    toKey: "G",
    capo: 0,
    expected: "G/B Em/G A/C#"
  },
  {
    name: "全面複雜和弦測試",
    input: "Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7b5",
    fromKey: "C",
    toKey: "G",
    capo: 0,
    expected: "Gmaj7 Am7 Bm7 Cmaj7 D7 Em7 F#m7b5"
  }
];

console.log("🧪 開始驗證修正...\n");

let passCount = 0;
testCases.forEach((testCase, index) => {
  const result = transposeChordSheet(testCase.input, testCase.fromKey, testCase.toKey, testCase.capo);
  
  let passed = true;
  let reason = "";
  
  if (testCase.expected) {
    if (result.trim() !== testCase.expected.trim()) {
      passed = false;
      reason = `預期 "${testCase.expected}" 但得到 "${result}"`;
    }
  }
  
  if (testCase.shouldNotContain) {
    for (const pattern of testCase.shouldNotContain) {
      if (result.includes(pattern)) {
        passed = false;
        reason = `結果包含不應出現的模式 "${pattern}"`;
        break;
      }
    }
  }
  
  if (passed) {
    passCount++;
    console.log(`✅ 測試 ${index + 1}: ${testCase.name}`);
    console.log(`   輸入: ${testCase.input}`);
    console.log(`   結果: ${result}`);
  } else {
    console.log(`❌ 測試 ${index + 1}: ${testCase.name}`);
    console.log(`   輸入: ${testCase.input}`);
    console.log(`   結果: ${result}`);
    console.log(`   錯誤: ${reason}`);
  }
  console.log("");
});

console.log(`🎯 測試總結: ${passCount}/${testCases.length} 通過`);

if (passCount === testCases.length) {
  console.log("🎉 所有測試通過！Bug修正成功！");
} else {
  console.log("⚠️  仍有部分測試失敗，需要進一步修正");
}
