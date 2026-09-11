# Pocket Arcade MVP

八款純前端單機小遊戲：

- 2048
- Sudoku
- Color Connect
- Water Sort
- Multi Color Fill
- Sand Tetris
- Chess
- 大老二

## 執行

最簡單：

```bash
python -m http.server 8080
```

然後開啟：

```text
http://localhost:8080
```

不要直接雙擊 `index.html` 測 PWA/service worker，瀏覽器安全限制會擋，這不是網站在鬧，是瀏覽器很愛管。

## 狀態

這是一版「玩法 + UI + 共用殼」MVP。

Chess：
- 有基本合法走法
- 有 check / checkmate / stalemate 判定
- 有升變為 Queen
- 尚未做 castling / en passant

大老二：
- 1v3 CPU
- 單張 / Pair / Triple / 五張牌型
- 首手含 ♣3
- MVP 順子規則尚未加入 A2345 特例
