# GuitarTab 專案架構文件

本文件說明系統模組組成、資料流、與關鍵互動流程。後續將附上圖（架構圖、流程圖、循序圖）。

## 系統模組架構（Architecture Overview）
- UI Layer（index.html + styles.css）
  - Toolbar（上傳/下載/PDF/主題）
  - Controls Panel（Key/Capo/目前設定）
  - Preview Panel（Markdown 渲染）
  - Modal（檔名輸入）
- Application Layer（assets/js/app.js）
  - 初始化、事件綁定、狀態同步
  - 協調各功能模組
- Modules（assets/js/modules）
  - transpose.js：和弦轉調
  - pdf.js：PDF 匯出
  -（規劃）editor.js、tags.js、songlist.js、state.js、ui.js

### 架構圖
```mermaid
%% Mermaid 10.8.0 compatible
flowchart TD
  subgraph UI[UI Layer]
    TB["Toolbar<br/>上傳/下載/PDF/主題"]
    CP["Controls Panel<br/>Key/Capo/設定"]
    PV["Preview Panel<br/>Markdown 渲染"]
    MD["Modal<br/>檔名輸入"]
  end

  subgraph APP[Application Layer]
    APPJS["app.js<br/>初始化/事件/協作"]
  end

  subgraph MOD[Modules]
    TR["transpose.js<br/>和弦轉調"]
    PDF["pdf.js<br/>PDF 匯出"]
    ED[(editor.js)]
    TG[(tags.js)]
    SL[(songlist.js)]
    ST[(state.js)]
    UIX[(ui.js)]
  end

  TB --> APPJS
  CP --> APPJS
  MD --> APPJS
  APPJS --> PV
  APPJS <--> TR
  APPJS --> PDF
  APPJS <--> ST
  APPJS --> UIX
  ED --> APPJS
  TG --> APPJS
  SL --> APPJS
```

## 資料流程（Data Flow）
1. 使用者載入/編輯 Markdown（未來 editor.js）
2. app.js 更新 state.chordSheet → 呼叫 marked 產生 HTML → 更新 Preview
3. 切換 Key/Capo → 呼叫 transpose.js 產生轉調後文字 → 再渲染
4. 下載 Markdown → 由 app.js 彈出檔名 modal → 產生 Blob → 下載
5. 匯出 PDF → pdf.js 將 Preview DOM 輸出 PDF 檔

### 資料流程圖
```mermaid
%% Mermaid 10.8.0 compatible
flowchart TD
  U[User] -->|上傳/編輯| UI[UI]
  UI -->|文字| APP[app.js]
  APP -->|更新| ST[state]
  APP -->|轉調| TR[transpose.js]
  APP -->|渲染 Markdown| MR[marked]
  MR --> PV[Preview DOM]
  APP -->|下載請求| MD[Modal]
  MD -->|給檔名| APP
  APP -->|Blob 下載| FS[Browser Download]
  APP -->|PDF 匯出| PDF[pdf.js]
  PDF -->|html2pdf| OUT[PDF 檔]
```

## 關鍵互動循序（Sequence）

### A. 上傳檔案
```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant UI as UI (Toolbar)
  participant FR as FileReader
  participant APP as app.js
  participant MR as marked
  participant PV as Preview

  U->>UI: 點「上傳」
  UI->>FR: 讀取檔案文字
  FR-->>APP: onload(text)
  APP->>APP: 解析 Key/Capo、更新 state
  APP->>MR: parse(text)
  MR-->>APP: HTML
  APP->>PV: 更新預覽
```

### B. 切換 Key/Capo
```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant UI as UI (Controls Panel)
  participant APP as app.js
  participant TR as transpose.js
  participant MR as marked
  participant PV as Preview

  U->>UI: 點 Key/Capo 按鈕
  UI->>APP: 觸發事件
  APP->>APP: 更新 state
  APP->>TR: transpose(sheet, fromKey, toKey, capo)
  TR-->>APP: 轉調後文字
  APP->>MR: parse(transposed)
  MR-->>APP: HTML
  APP->>PV: 更新預覽
```

### C. 下載與 PDF 匯出
```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant UI as UI (Toolbar)
  participant APP as app.js
  participant MD as Modal
  participant PDF as pdf.js
  participant PV as Preview DOM

  U->>UI: 點「下載」
  UI->>APP: download()
  APP->>MD: 顯示檔名輸入
  MD-->>APP: 回傳檔名
  APP->>APP: 產生 Blob 並觸發下載
  U->>UI: 點「PDF」
  UI->>APP: exportPDF()
  APP->>PDF: exportToPDF(PV, filename)
  PDF-->>U: 下載 PDF
```

## 非功能性需求（NFR）
- 安全：未來引入 DOMPurify 過濾 Markdown HTML
- 效能：渲染 Debounce、大檔案處理（規劃中）
- 可維護：ES Modules、單元測試（轉調核心）

## 版本策略
- step-1：樣式/腳本拆分、轉調/PDF 模組化（已完成）
- step-2：editor/renderer/state 模組化與安全渲染
- step-3：tags/songlist/演出模式
- step-4：轉調引擎強化與測試覆蓋

---

## 補充循序圖（Editor / Tags / Songlist）

### D. 樂譜編輯器互動（即時預覽）
```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant ED as editor.js (Editor UI)
  participant APP as app.js
  participant ST as state.js
  participant TR as transpose.js
  participant MR as marked
  participant PV as Preview

  U->>ED: 編輯 Markdown 文本
  ED->>APP: onChange(text) (debounce)
  APP->>ST: set(chordSheet)
  APP->>TR: transposeIfNeeded(sheet, keys, capo)
  TR-->>APP: 轉調後文字
  APP->>MR: parse(text)
  MR-->>APP: HTML
  APP->>PV: 更新預覽
```

### E. 小節 Tag 新增/移除/更新
```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant UI as UI (Preview/Editor)
  participant TG as tags.js
  participant APP as app.js
  participant ST as state.js
  participant MR as marked
  participant PV as Preview

  U->>UI: 點擊小節「+」新增 Tag
  UI->>TG: addTag(barId, {type, value})
  TG->>APP: emit(tagsChanged)
  APP->>ST: set(tags)
  APP->>MR: 重新渲染（依 Tag 規則加上標記樣式）
  MR-->>APP: HTML
  APP->>PV: 更新預覽（顯示 cresc/dim 等圖示）

  U->>UI: 點擊 Tag 進行移除/編輯
  UI->>TG: remove/update
  TG->>APP: emit(tagsChanged)
  APP->>PV: 重渲染顯示
```

### F. 歌序/演出模式切換
```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant SL as songlist.js
  participant APP as app.js
  participant ST as state.js
  participant TR as transpose.js
  participant MR as marked
  participant PV as 演出模式畫面

  U->>SL: 選取歌單中的下一首歌
  SL->>APP: emit(songSelected, songMeta)
  APP->>ST: set(currentSong, chordSheet, settings)
  APP->>TR: 依設定轉調/Capo
  TR-->>APP: 轉調後文字
  APP->>MR: parse(text)
  MR-->>APP: HTML
  APP->>PV: 切換畫面並捲動到開頭
```
