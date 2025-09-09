# GuitarTab 待辦清單（Todo / Backlog）

本文件彙整待新增功能、優化項目與技術建議，供規劃與追蹤使用。

## 0. 基礎建設與模組化
- [ ] 導入 ES Modules 完整模組化（已開始：transpose/pdf 完成）
- [ ] 新增並落地以下模組骨架與對應文件：
  - [ ] editor.js（Markdown 編輯器，onChange 通知）
  - [ ] renderer.js（marked + DOMPurify 安全渲染、樣式掛鉤）
  - [ ] state.js（集中狀態、事件發布/訂閱）
  - [ ] ui.js（共用 UI 控制：Modal/Toast/快捷鍵）
  - [ ] tags.js（小節 Tag CRUD 與渲染規則）
  - [ ] songlist.js（歌序/歌單管理與演出模式切換）
- [ ] README、ARCHITECTURE、file_discription 同步更新

## 1. Markdown 編輯器（功能 1 & 3）
- [ ] 介面改為「編輯器 + 預覽」雙欄模式，支援拖曳調整比例
- [ ] 引入 CodeMirror 或 Monaco（語法高亮、行號、快捷鍵）
- [ ] 編輯即時預覽（debounce 150–300ms）
- [ ] 支援開檔/存檔（.md）、字型大小、行高調整
- [ ] 標準化內嵌和弦語法（行內 vs 小節行）規範

## 2. 轉調引擎優化（功能 6）
- [ ] 僅處理「和弦行」：避免誤傷歌詞/文字（行規則或 token 比例判斷）
- [ ] 支援複合後綴：m/m7/m9/maj/maj7/7/9/11/13/sus2/sus4/add2/add9/6/69/dim/°/ø/aug/+、m7b5、7#9 等
- [ ] 支援斜線和弦（D/F#）：根音與低音分別轉換
- [ ] 等音偏好：# / b 選項
- [ ] 模式：
  - [ ] 實際音高轉調（含 Capo）
  - [ ] 指型轉換模式（實際音高不變）
- [ ] 單元測試覆蓋主要情境（含邊界、語法混合）

## 3. 小節 Tag（功能 4）
- [ ] UI：小節「+」按鈕新增 Tag，支援多個 Tag 並可排序
- [ ] 常用 Tag：crescendo、diminuendo、Break、Stop、Solo、Fill、Repeat xN、Hits 等
- [ ] 標準化語法：例如 {crescendo}、{dim}、{break}，或 YAML 區塊描述
- [ ] 樣式規則：預覽區以圖示/色塊顯示，PDF 亦保留
- [ ] CRUD：新增/移除/編輯，支援批次套用（多小節）
- [ ] 匯入匯出：Tag 伴隨樂譜存於 Markdown（可用隱藏註解或 Frontmatter）

## 4. 歌序/演出模式（功能 5）
- [ ] 歌單管理面板：新增/刪除/排序、每首歌載入對應 Markdown
- [ ] 演出模式：全畫面、字體放大、鍵盤/踏板快捷切換上下首與章節
- [ ] 設定記憶：每首歌單獨記憶 Key/Capo/顯示選項
- [ ] 匯出/匯入歌單（JSON）與快速載入常用歌單

## 5. PDF/列印（功能 2）
- [ ] Print CSS 強化：頁邊距、字體、page-break、避免小節被截斷
- [ ] 單欄/雙欄切換、行距/字號自訂
- [ ] PDF 樣式保真（Tag、章節標題、分隔線）

## 6. 安全性
- [ ] 加入 DOMPurify，過濾 Markdown 產生之 HTML
- [ ] Content-Security-Policy（CSP）頭建議（說明文件）
- [ ] 檔名清理（移除非法字元），下載後 revokeObjectURL（已加入基本版）

## 7. UX 與可及性
- [ ] 主題自動偵測（prefers-color-scheme），並可手動覆蓋
- [ ] 鍵盤操作與 ARIA：焦點樣式、快捷鍵（轉調、Capo、歌單切換）
- [ ] 拖放上傳、最近檔案清單、檔案大小與編碼提示
- [ ] 設定面板：#/b 偏好、轉調模式、字體大小、行高、顯示行號/小節線
- [ ] 演出模式的防誤觸（鎖定 UI）與高對比主題

## 8. 效能
- [ ] 只重算變動區（行級或區塊級 re-render）
- [ ] 大檔案：切分章節分頁渲染；空檔時用 requestIdleCallback
- [ ] Web Worker 移出重運算（轉調/解析）

## 9. 品質保證與工具鏈
- [ ] TypeScript 化（核心模組先行）：型別定義（Key、ChordToken、Bar、Tag、State）
- [ ] 測試：Vitest/Jest，涵蓋 transpose、parser、tag 應用
- [ ] Lint/Format：ESLint + Prettier
- [ ] CI：GitHub Actions（lint+test）
- [ ] 範例檔：提供多語法、多標記範例，便於驗收

## 10. 部署
- [ ] GitHub Pages 靜態部署與教學
- [ ] 版本標記：CHANGELOG、版本號規範（SemVer）

## 里程碑（建議順序）
1) 安全與錯誤修正：DOMPurify、主題切換穩定、檔名清理
2) 模組骨架與狀態：editor/renderer/state/ui 初版 + 即時預覽
3) 轉調引擎強化：和弦行判斷、斜線/複合後綴、等音偏好、模式切換
4) Tags + 演出模式：UI/渲染/儲存；歌單切換流程
5) PDF/Print 優化：版面與保真
6) TS 化與測試：提高穩定度
7) 效能與部署：Worker、分頁渲染、GitHub Pages
