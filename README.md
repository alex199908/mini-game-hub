# Mini Game Hub

一套以 Vue 3 + Vite + Pinia 建立的單機網頁小遊戲合集。

## 遊戲規劃

2048、Sudoku、Color Connect、Water Sort、Multi Color Fill、Sand Tetris、Chess、大老二。

## 本地開發

```bash
npm install
npm run dev
```

生產建置與預覽：

```bash
npm run build
npm run preview
```

## 架構原則

- 每款遊戲獨立放在 `src/games/<game>/`，規則與 UI 可持續拆分。
- 遊戲狀態以 `localStorage` 保存，第一版不依賴後端。
- 生產版透過 service worker 對同源資源做 runtime cache，首次載入後可離線使用。
- 先完成可玩的核心迴圈，再補關卡、AI、動畫與 PWA 離線快取。
- 目前八款遊戲都已接入獨立 UI；Chess 與大老二仍是 first-pass，特殊規則與完整牌型會再補。
