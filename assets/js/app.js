// App bootstrap and UI wiring
import { KEYS, CHORD_MAP, transposeChordSheet } from './modules/transpose.js';
import { exportToPDF } from './modules/pdf.js';

// state
const state = {
  originalKey: 'G',    // 吉他彈的調性 (AG)
  currentKey: 'Bb',    // 目標調性 (Key)
  capo: 3,             // Capo位置
  chordSheet: '',
  currentFileName: ''
};

// DOM refs
const $ = (sel) => document.querySelector(sel);

function createKeyButtons() {
  const container = document.getElementById('key-buttons');
  container.innerHTML = '';
  KEYS.forEach((key) => {
    const btn = document.createElement('button');
    btn.className = `key-button ${key === state.currentKey ? 'active' : ''}`;
    btn.textContent = key;
    btn.onclick = () => {
      document.querySelectorAll('.key-button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentKey = key;
      document.getElementById('current-key-display').textContent = key;
      renderChordSheet();
    };
    container.appendChild(btn);
  });
}

function createCapoButtons() {
  const container = document.getElementById('capo-buttons');
  container.innerHTML = '';
  for (let i = 0; i <= 8; i++) {
    const btn = document.createElement('button');
    btn.className = `capo-button ${i === state.capo ? 'active' : ''}`;
    btn.textContent = i;
    btn.onclick = () => {
      document.querySelectorAll('.capo-button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.capo = i;
      document.getElementById('capo-display').textContent = i;
      renderChordSheet();
    };
    container.appendChild(btn);
  }
}

function updateCapoInPreview() {
  try {
    // 更新Capo標記
    const capoPattern = /(Capo\s*[:：]\s*)(\d+)/gi;
    const updatedSheet = state.chordSheet.replace(capoPattern, `$1${state.capo}`);
    
    // 執行轉調
    const transposedSheet = transposeChordSheet(updatedSheet, state.originalKey, state.currentKey, state.capo);
    
    // 渲染Markdown
    if (window.marked) {
      const htmlContent = window.marked.parse(transposedSheet);
      document.getElementById('preview').innerHTML = htmlContent;
    } else {
      console.error('Marked library not loaded');
      document.getElementById('preview').innerHTML = '<p>錯誤：Markdown渲染器未載入</p>';
    }
    
    // 清除之前的錯誤狀態
    clearErrorState();
    
  } catch (error) {
    console.error('Error in updateCapoInPreview:', error);
    showErrorState('轉調過程中發生錯誤: ' + error.message);
  }
}

function clearErrorState() {
  const preview = document.getElementById('preview');
  if (preview) {
    preview.classList.remove('error-state');
  }
}

function showErrorState(message) {
  const preview = document.getElementById('preview');
  if (preview) {
    preview.classList.add('error-state');
    // 可以在這裡顯示錯誤訊息給使用者
    console.warn('User-facing error:', message);
  }
}

function renderChordSheet() { updateCapoInPreview(); }

function showFilenameModal(defaultName, callback) {
  const modal = document.getElementById('filenameModal');
  const filenameInput = document.getElementById('filename-input');
  const modalOk = document.getElementById('modal-ok');
  const modalCancel = document.getElementById('modal-cancel');
  const modalClose = document.querySelector('.modal-close');

  filenameInput.value = defaultName;
  modal.style.display = 'flex';
  filenameInput.focus();

  const handleOk = () => { modal.style.display = 'none'; callback(filenameInput.value); remove(); };
  const handleCancel = () => { modal.style.display = 'none'; remove(); };

  function onBackdrop(e){ if(e.target===modal){ handleCancel(); }}

  function onEsc(e){ if(e.key==='Escape'){ handleCancel(); }}

  function remove(){
    modalOk.removeEventListener('click', handleOk);
    modalCancel.removeEventListener('click', handleCancel);
    modalClose.removeEventListener('click', handleCancel);
    modal.removeEventListener('click', onBackdrop);
    document.removeEventListener('keydown', onEsc);
  }

  modalOk.addEventListener('click', handleOk);
  modalCancel.addEventListener('click', handleCancel);
  modalClose.addEventListener('click', handleCancel);
  modal.addEventListener('click', onBackdrop);
  document.addEventListener('keydown', onEsc);
}

function setupEventListeners() {
  document.getElementById('upload-btn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });

  document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    state.currentFileName = file.name;
    document.getElementById('filename-display').textContent = state.currentFileName;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      state.chordSheet = text;
      
      // 解析新格式: Key: Bb (AG:G) 或舊格式: Key: G
      const keyMatchNew = text.match(/Key\s*[:：]\s*([A-G][b#]?)\s*\(\s*AG\s*[:：]\s*([A-G][b#]?)\s*\)/i);
      const keyMatchOld = text.match(/Key\s*[:：]\s*([A-G][b#]?)/i);
      const capoMatch = text.match(/Capo\s*[:：]\s*(\d+)/i);
      
      if (keyMatchNew) {
        // 新格式: Key: Bb (AG:G) - Bb是目標調，G是原調(吉他調)
        state.currentKey = keyMatchNew[1];  // 目標調 (Bb)
        state.originalKey = keyMatchNew[2]; // 原調/吉他調 (G)
        document.getElementById('current-key-display').textContent = state.currentKey;
        document.getElementById('original-key-display').textContent = state.originalKey;
        createKeyButtons();
      } else if (keyMatchOld) {
        // 舊格式: Key: G - 當作原調，目標調設為相同
        state.originalKey = keyMatchOld[1];
        state.currentKey = state.originalKey;
        document.getElementById('original-key-display').textContent = state.originalKey;
        document.getElementById('current-key-display').textContent = state.currentKey;
        createKeyButtons();
      }
      
      if (capoMatch) {
        state.capo = parseInt(capoMatch[1]);
        document.getElementById('capo-display').textContent = state.capo;
        createCapoButtons();
      }
      renderChordSheet();
    };
    reader.readAsText(file);
  });

  document.getElementById('download-btn').addEventListener('click', () => {
    const converted = transposeChordSheet(state.chordSheet, state.originalKey, state.currentKey, state.capo);
    const defaultName = state.currentFileName ? state.currentFileName.replace('.md', '_轉調.md') : '轉調歌譜.md';
    showFilenameModal(defaultName, (filename) => {
      const blob = new Blob([converted], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename.replace(/[\\/:*?"<>|]/g, '');
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    });
  });

  document.getElementById('export-pdf-btn').addEventListener('click', () => {
    const base = state.currentFileName ? state.currentFileName.replace('.md', '') : '轉調歌譜';
    exportToPDF({ element: document.getElementById('preview'), filename: `${base}_轉調.pdf` });
  });

  document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);

  document.getElementById('top-toggle-btn').addEventListener('click', () => {
    const isHidden = document.body.classList.toggle('collapsed-header');
    document.getElementById('top-toggle-btn').title = isHidden ? '顯示標頭' : '隱藏標頭';
  });
}

function toggleTheme() {
  const btn = document.getElementById('theme-toggle-btn');
  const textEl = document.getElementById('theme-text');
  if (document.body.classList.contains('light-mode')) {
    document.body.classList.remove('light-mode');
    textEl.textContent = '淺色模式';
    btn.querySelector('i').className = 'fas fa-sun';
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.add('light-mode');
    textEl.textContent = '深色模式';
    btn.querySelector('i').className = 'fas fa-moon';
    localStorage.setItem('theme', 'light');
  }
}

function init() {
  // demo sheet copied from original
  state.chordSheet = `### [吉他譜] 勝於塵土 More Than Ashes


---
 

<pre>
Key: Bb (AG:G)   Capo: 3

[Pre]
    G  |  D  

[Verse 1]
   G          Em
我價值勝過於塵土
          C      D   G       
當你為我而來，必消失無形
   G          Em
因信基督我今站立
        C      D    G
當你注視我，一切都更新

[Chorus]
      C<sub>maj7</sub>  D<sub>sus4</sub>    G 
我是玫瑰，你受苦的喜悅
      C<sub>maj7</sub>  D<sub>sus4</sub>     G      
我深知道，你因我動心歡愉
    C<sub>maj7</sub> D<sub>sus4</sub>     Em
當我的心四面遭受責難
           C<sub>maj7</sub>    D<sub>sus4</sub>  G
你以真理護庇我，是你的玫瑰

[Verse 2]
   G          Em
生命不再憑眼所見
          C      D   G 
我現與他合一，彰顯在他裡
   G          Em
我的愛為他寶貴珍惜
          C      D   G 
主我用眼一看，奪了你的心

[Tag 1] x4
      G          D
我是玫瑰，谷中百合花
     Em       C
屬於你，我甚美麗

[Tag 2] x2
 G          D  
婚禮即將就要來臨
              Em        C
因我就是為了羔羊 的婚娶而活
</pre>`;

  createKeyButtons();
  createCapoButtons();
  
  // 設定初始顯示狀態
  document.getElementById('original-key-display').textContent = state.originalKey;
  document.getElementById('current-key-display').textContent = state.currentKey;
  document.getElementById('capo-display').textContent = state.capo;
  
  renderChordSheet();
  setupEventListeners();

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    const btn = document.getElementById('theme-toggle-btn');
    const textEl = document.getElementById('theme-text');
    textEl.textContent = '深色模式';
    btn.querySelector('i').className = 'fas fa-moon';
  }
}

window.addEventListener('load', () => {
  if (window.marked) {
    window.marked.setOptions({ breaks: true, gfm: true });
  }
  init();
});
