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

- 每款遊戲的規則引擎與 Vue UI 分離。
- 遊戲狀態以 `localStorage` 保存，第一版不依賴後端。
- 先完成可玩的核心迴圈，再補關卡、AI、動畫與 PWA 離線快取。
- 目前第一個完整模組是 2048，其餘遊戲先以明確的模組插槽接入。
