# 🧪 Test 資料夾

這個資料夾包含所有測試相關的檔案和工具。

## 📁 檔案結構

```
test/
├── integration_test.html     # 整合測試首頁
├── parse_test.html          # Key/Capo解析邏輯測試
├── debug_transpose.html     # 轉調調試工具
├── test_transpose.html      # 基本轉調功能測試
├── validate_fix.mjs         # Node.js驗證腳本
├── sample_new_format.md     # 新格式範例檔案
└── README.md               # 本說明文件
```

## 🎯 使用方法

### 1. 整合測試首頁
```
http://localhost:8000/test/integration_test.html
```
- 提供所有測試的入口點
- 說明修改內容和驗證步驟
- 包含檔案結構檢查

### 2. 解析邏輯測試
```
http://localhost:8000/test/parse_test.html
```
- 測試新的Key格式解析：`Key: Bb (AG:G)`
- 驗證向後相容性
- 測試中文冒號支援

### 3. 轉調調試工具
```
http://localhost:8000/test/debug_transpose.html
```
- 即時轉調測試
- 和弦對照表
- 自動化測試套件
- Bug修正驗證

### 4. 基本功能測試
```
http://localhost:8000/test/test_transpose.html
```
- 核心轉調功能測試
- 包含複雜和弦測試
- 斜線和弦測試

### 5. Node.js驗證腳本
```bash
cd test/
node validate_fix.mjs
```
- 命令列測試工具
- 回歸測試
- CI/CD整合用

### 6. 範例檔案
- `sample_new_format.md`: 新格式的範例樂譜檔案
- 可直接下載並上傳到主程式測試

## 🔧 新功能說明

### Key格式變更
**新格式：**
```
Key: Bb (AG:G)   Capo: 3
```

**說明：**
- `Bb` = 目標調性（演出調性）
- `G` = 原調性（吉他實際彈奏的調性）
- `3` = Capo位置

**載入後狀態：**
- 原調: G
- 目標調: Bb  
- Capo: 3

### 向後相容
舊格式仍然支援：
```
Key: G   Capo: 0
```

## ✅ 已修正的問題

1. **#b等音問題** - 不再出現不合理的等音記法
2. **複雜和弦識別** - 正確識別Bm7、Cmaj7等複雜和弦
3. **斜線和弦支援** - bass note也會被正確轉調
4. **檔案組織** - 測試檔案統一管理

## 🎯 測試建議

1. **開始測試**：先打開 `integration_test.html`
2. **解析測試**：確認Key格式解析正確
3. **功能測試**：使用調試工具驗證轉調功能
4. **實際使用**：上傳範例檔案到主程式測試
5. **回歸測試**：執行Node.js腳本確認無回歸

---

**測試愉快！** 🎉
