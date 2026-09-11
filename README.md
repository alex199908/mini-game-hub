# Mini Game Hub

Vue 3 + Vite + Pinia 的單機網頁小遊戲合集。這版開始把重點從「功能能動」改成「真的像遊戲」：直接操作、連續手勢、統一 HUD / controls / feedback，以及每款遊戲自己的核心 game feel。

## 遊戲

- **2048** — swipe-first、鍵盤操作、Undo、localStorage。
- **Sudoku** — 關聯區域高亮、鍵盤輸入、候選筆記、提示。
- **Color Connect** — 從端點按住直接拖曳，不再逐格點擊。
- **Water Sort** — 試管可直接拖到合法目標，支援點選備援與 Undo。
- **Multi Color Fill** — hover / focus 預覽下一步 flood-fill 結果。
- **Sand Tetris** — Tetromino 下落、旋轉、Hard drop；鎖定後碎成受重力影響的沙粒並可消行。
- **Chess** — `chess.js` 規則引擎，支援合法走法、將軍 / 將死、王車易位、吃過路兵、升變、和棋、拖曳落子與棋譜。
- **大老二** — 單張 / 對子 / 三條 / 順子 / 同花 / 葫蘆 / 鐵支 / 同花順、四人輪轉、Pass 重置牌權、CPU 出牌與手牌橫掃多選。

## 本地開發

```bash
npm install
npm run dev
```

生產建置：

```bash
npm run build
npm run preview
```

## 架構

```text
src/
├─ components/        共用 GameShell / GameChrome / cards
├─ data/              遊戲 registry
├─ games/             每款遊戲自己的 UI 與規則
├─ stores/            全域偏好，例如 theme
├─ styles.css         基礎視覺
└─ interaction.css    共用 interaction / motion / responsive layer
```

### 原則

- 遊戲規則與 UI 分開；複雜規則優先使用成熟 engine，不重新發明輪子。
- 手機優先採直接操作：swipe、drag、pointer gesture；桌面補 keyboard / mouse。
- 共用 HUD、狀態、操作列與 motion token，避免八款遊戲像八個互不相干的 CodePen。
- `prefers-reduced-motion` 仍保留，動畫不是拿 accessibility 去祭天。
- 第一版維持 local-first，不依賴後端；進度需要保存的遊戲使用 `localStorage`。
