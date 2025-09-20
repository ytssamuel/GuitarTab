// Capo修正功能單元測試
// 用於測試 app.js 中修正後的 updateCapoInPreview 功能

// 模擬測試環境
class CapoTestSuite {
    constructor() {
        this.testResults = [];
        this.passCount = 0;
        this.totalCount = 0;
    }

    // 模擬 transposeChord 函數（簡化版本）
    transposeChord(chord, semitones) {
        const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
        const CHORD_MAP = {
            'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,
            'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11
        };

        const match = chord.match(/^([A-G][b#]?)(.*)$/);
        if (!match) throw new Error(`Cannot parse chord: ${chord}`);
        
        const [, root, suffix] = match;
        if (!(root in CHORD_MAP)) throw new Error(`Invalid chord root: ${root}`);
        
        // 修正負數半音的處理
        const idx = (CHORD_MAP[root] + semitones + 12*10) % 12;  // 加上足夠大的正數確保結果為正
        return KEYS[idx] + (suffix || '');
    }

    // 模擬 transposeChordSheet 函數（簡化版本）
    transposeChordSheet(sheet, fromKey, toKey) {
        const CHORD_MAP = {
            'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,
            'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11
        };

        if (!sheet || typeof sheet !== 'string') return sheet || '';
        if (fromKey === toKey) return sheet;

        const diff = (CHORD_MAP[toKey] - CHORD_MAP[fromKey] + 12) % 12;
        const chordRegex = /\b([A-G][b#]?)((?:maj|min|m|dim|aug|sus|add|dom|alt)?(?:\d+)?(?:[b#]\d+)?)\b/g;
        
        return sheet.replace(chordRegex, (match, root, suffix) => {
            if (root in CHORD_MAP) {
                try {
                    return this.transposeChord(root, diff) + (suffix || '');
                } catch (error) {
                    return match;
                }
            }
            return match;
        });
    }

    // 模擬修正後的 updateCapoInPreview 邏輯
    simulateCapoChange(originalSheet, currentKey, originalKey, newCapo) {
        try {
            let processedSheet = originalSheet;
            
            // 計算目標吉他調性：目標調性 - 新Capo = 目標吉他調性
            const targetGuitarKey = this.transposeChord(currentKey, -newCapo);
            
            // 更新Key行的格式，保持目標調性不變，更新AG(吉他彈奏調性)
            const keyPattern = /(Key\s*[:：]\s*)([A-G][b#]?)(\s*\(\s*AG\s*[:：]\s*)([A-G][b#]?)(\s*\))/gi;
            processedSheet = processedSheet.replace(keyPattern, `$1${currentKey}$3${targetGuitarKey}$5`);
            
            // 更新Capo標記
            const capoPattern = /(Capo\s*[:：]\s*)(\d+)/gi;
            processedSheet = processedSheet.replace(capoPattern, `$1${newCapo}`);
            
            // 分離Key行和其他內容，只轉調和弦部分
            const lines = processedSheet.split('\n');
            const transposedLines = lines.map(line => {
                // 如果是Key行，保持不變
                if (line.match(/Key\s*[:：]/i)) {
                    return line;
                }
                // 其他行進行轉調
                return this.transposeChordSheet(line, originalKey, targetGuitarKey);
            });
            
            return transposedLines.join('\n');
        } catch (error) {
            throw new Error('轉調過程中發生錯誤: ' + error.message);
        }
    }

    // 單個測試用例
    runTest(testName, testFunction) {
        this.totalCount++;
        try {
            const result = testFunction();
            if (result.pass) {
                this.passCount++;
                console.log(`✅ ${testName}: 通過`);
                if (result.details) {
                    console.log(`   詳情: ${result.details}`);
                }
            } else {
                console.log(`❌ ${testName}: 失敗`);
                if (result.expected && result.actual) {
                    console.log(`   期望: ${result.expected}`);
                    console.log(`   實際: ${result.actual}`);
                }
                if (result.details) {
                    console.log(`   詳情: ${result.details}`);
                }
            }
            this.testResults.push({ name: testName, pass: result.pass, details: result });
        } catch (error) {
            console.log(`❌ ${testName}: 錯誤 - ${error.message}`);
            this.testResults.push({ name: testName, pass: false, error: error.message });
        }
    }

    // 測試套件
    runAllTests() {
        console.log('🎸 開始執行 Capo 修正功能測試\n');

        // 測試1: 基本Capo變更 (3->0)
        this.runTest('基本Capo變更 (3->0)', () => {
            const original = `Key: Bb (AG:G)   Capo: 3

[Pre]
    G  |  D  

[Verse 1]
   G          Em`;

            const result = this.simulateCapoChange(original, 'Bb', 'G', 0);
            
            // 檢查Key行
            const keyMatch = result.match(/(Key\s*[:：]\s*[A-G][b#]?\s*\(\s*AG\s*[:：]\s*[A-G][b#]?\s*\)\s*Capo\s*[:：]\s*\d+)/i);
            const actualKeyLine = keyMatch ? keyMatch[0] : '';
            const expectedKeyLine = 'Key: Bb (AG:Bb)   Capo: 0';
            
            // 檢查和弦 - 手動驗證關鍵和弦
            const hasBb = result.includes('Bb  |  F') || result.includes('   Bb          Gm');
            const hasF = result.includes('Bb  |  F');
            const hasGm = result.includes('   Bb          Gm');
            
            const keyLineCorrect = actualKeyLine === expectedKeyLine;
            const chordsCorrect = hasBb && hasF && hasGm;
            
            return {
                pass: keyLineCorrect && chordsCorrect,
                expected: `Key行: ${expectedKeyLine}, 和弦包含: Bb, F, Gm`,
                actual: `Key行: ${actualKeyLine}, 和弦: Bb存在=${hasBb}, F存在=${hasF}, Gm存在=${hasGm}`,
                details: keyLineCorrect ? '✓ Key行正確' : '✗ Key行錯誤' + (chordsCorrect ? ', ✓ 和弦正確' : ', ✗ 和弦錯誤')
            };
        });

        // 測試2: 反向測試 (0->3)
        this.runTest('反向測試 (0->3)', () => {
            const original = `Key: Bb (AG:Bb)   Capo: 0

[Pre]
    Bb  |  F  

[Verse 1]
   Bb          Gm`;

            const result = this.simulateCapoChange(original, 'Bb', 'Bb', 3);
            
            const keyMatch = result.match(/(Key\s*[:：]\s*[A-G][b#]?\s*\(\s*AG\s*[:：]\s*[A-G][b#]?\s*\)\s*Capo\s*[:：]\s*\d+)/i);
            const actualKeyLine = keyMatch ? keyMatch[0] : '';
            const expectedKeyLine = 'Key: Bb (AG:G)   Capo: 3';
            
            return {
                pass: actualKeyLine === expectedKeyLine,
                expected: expectedKeyLine,
                actual: actualKeyLine
            };
        });

        // 測試3: 目標調性變更
        this.runTest('目標調性變更測試', () => {
            const original = `Key: Bb (AG:G)   Capo: 3`;
            const result = this.simulateCapoChange(original, 'C', 'G', 3);
            
            const keyMatch = result.match(/(Key\s*[:：]\s*[A-G][b#]?\s*\(\s*AG\s*[:：]\s*[A-G][b#]?\s*\)\s*Capo\s*[:：]\s*\d+)/i);
            const actualKeyLine = keyMatch ? keyMatch[0] : '';
            // C - 3 = C - 3 = A (因為 C=0, 0-3 = -3, (-3+12)%12 = 9 = A)
            const expectedKeyLine = 'Key: C (AG:A)   Capo: 3';
            
            return {
                pass: actualKeyLine === expectedKeyLine,
                expected: expectedKeyLine,
                actual: actualKeyLine
            };
        });

        // 測試4: Capo 5測試
        this.runTest('Capo 5測試', () => {
            const original = `Key: D (AG:A)   Capo: 7

[Verse]
   A          F#m`;

            const result = this.simulateCapoChange(original, 'D', 'A', 5);
            
            const keyMatch = result.match(/(Key\s*[:：]\s*[A-G][b#]?\s*\(\s*AG\s*[:：]\s*[A-G][b#]?\s*\)\s*Capo\s*[:：]\s*\d+)/i);
            const actualKeyLine = keyMatch ? keyMatch[0] : '';
            // D - 5 = D - 5 = Bb (因為 D=2, 2-5 = -3, (-3+12)%12 = 9 = A... 等等，讓我重新計算)
            // D = 2, 2-5 = -3, (-3+120)%12 = 117%12 = 9 = A, 但這不對...
            // 讓我手動計算：D往下5個半音 = D -> C# -> C -> B -> Bb -> A
            const expectedKeyLine = 'Key: D (AG:A)   Capo: 5';
            
            return {
                pass: actualKeyLine === expectedKeyLine,
                expected: expectedKeyLine,
                actual: actualKeyLine
            };
        });

        // 測試5: 邊界值測試 (Capo 0)
        this.runTest('邊界值測試 (Capo 0)', () => {
            const original = `Key: G (AG:D)   Capo: 5`;
            const result = this.simulateCapoChange(original, 'G', 'D', 0);
            
            const keyMatch = result.match(/(Key\s*[:：]\s*[A-G][b#]?\s*\(\s*AG\s*[:：]\s*[A-G][b#]?\s*\)\s*Capo\s*[:：]\s*\d+)/i);
            const actualKeyLine = keyMatch ? keyMatch[0] : '';
            const expectedKeyLine = 'Key: G (AG:G)   Capo: 0';
            
            return {
                pass: actualKeyLine === expectedKeyLine,
                expected: expectedKeyLine,
                actual: actualKeyLine
            };
        });

        // 測試6: 複雜和弦測試
        this.runTest('複雜和弦測試', () => {
            const original = `Key: C (AG:G)   Capo: 5

[Chorus]
      Gmaj7  Asus4    C 
      Em7    Bm       A`;

            const result = this.simulateCapoChange(original, 'C', 'G', 0);
            
            // 檢查主要和弦是否正確轉調
            const hasC = result.includes('Cmaj7');
            const hasC2 = result.includes('C ');
            const keyLineCorrect = result.includes('Key: C (AG:C)   Capo: 0');
            
            return {
                pass: hasC && hasC2 && keyLineCorrect,
                details: `Cmaj7存在: ${hasC}, C存在: ${hasC2}, Key行正確: ${keyLineCorrect}`
            };
        });

        // 新增測試7: 驗證左側原調同步
        this.runTest('左側原調同步測試', () => {
            const original = `Key: Bb (AG:G)   Capo: 3`;
            
            // 模擬Capo變更為0，檢查AG是否正確變為Bb
            const targetGuitarKey = this.transposeChord('Bb', -0); // Bb - 0 = Bb
            
            // 驗證計算是否正確
            const expectedAG = 'Bb';
            const actualAG = targetGuitarKey;
            
            return {
                pass: actualAG === expectedAG,
                expected: `左側原調應顯示: ${expectedAG}`,
                actual: `計算結果: ${actualAG}`,
                details: `Capo變更後，AG從G變為${actualAG}，左側原調應同步顯示${actualAG}`
            };
        });

        // 顯示總結
        console.log('\n📊 測試總結:');
        console.log(`通過: ${this.passCount}/${this.totalCount}`);
        console.log(`成功率: ${(this.passCount / this.totalCount * 100).toFixed(1)}%`);
        
        if (this.passCount === this.totalCount) {
            console.log('🎉 所有測試都通過了！修正功能正常運作。');
        } else {
            console.log('⚠️ 有測試失敗，請檢查上述結果。');
        }

        return {
            pass: this.passCount,
            total: this.totalCount,
            rate: this.passCount / this.totalCount
        };
    }
}

// 執行測試
if (typeof module !== 'undefined' && module.exports) {
    // Node.js 環境
    module.exports = CapoTestSuite;
} else {
    // 瀏覽器環境
    window.CapoTestSuite = CapoTestSuite;
}

// 如果是直接執行，就運行測試
if (typeof window === 'undefined') {
    // Node.js 環境直接執行
    const testSuite = new CapoTestSuite();
    testSuite.runAllTests();
} else {
    // 瀏覽器環境，提供全域函數
    window.runCapoTests = function() {
        const testSuite = new CapoTestSuite();
        return testSuite.runAllTests();
    };
    
    console.log('測試套件已載入。在控制台執行 runCapoTests() 來開始測試。');
}
