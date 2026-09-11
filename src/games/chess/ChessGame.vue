<script setup>
import { computed, ref } from "vue";

const symbols = { white: { king: "♔", queen: "♕", rook: "♖", bishop: "♗", knight: "♘", pawn: "♙" }, black: { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" } };
const board = ref(makeBoard());
const turn = ref("white");
const selected = ref(null);
const winner = ref(null);

function makeBoard() {
  const next = Array.from({ length: 8 }, () => Array(8).fill(null));
  const back = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
  back.forEach((type, col) => { next[0][col] = { type, color: "black" }; next[7][col] = { type, color: "white" }; });
  for (let col = 0; col < 8; col += 1) { next[1][col] = { type: "pawn", color: "black" }; next[6][col] = { type: "pawn", color: "white" }; }
  return next;
}

function inBounds(row, col) { return row >= 0 && row < 8 && col >= 0 && col < 8; }
function clearPath(from, to) {
  const rowStep = Math.sign(to[0] - from[0]); const colStep = Math.sign(to[1] - from[1]);
  let row = from[0] + rowStep; let col = from[1] + colStep;
  while (row !== to[0] || col !== to[1]) { if (board.value[row][col]) return false; row += rowStep; col += colStep; }
  return true;
}
function movesFrom(from) {
  const piece = board.value[from[0]][from[1]]; if (!piece) return [];
  const result = []; const add = (row, col) => { if (!inBounds(row, col)) return false; const target = board.value[row][col]; if (!target || target.color !== piece.color) result.push([row, col]); return !target; };
  if (piece.type === "pawn") {
    const direction = piece.color === "white" ? -1 : 1; const start = piece.color === "white" ? 6 : 1;
    if (inBounds(from[0] + direction, from[1]) && !board.value[from[0] + direction][from[1]]) { result.push([from[0] + direction, from[1]]); if (from[0] === start && !board.value[from[0] + direction * 2][from[1]]) result.push([from[0] + direction * 2, from[1]]); }
    [-1, 1].forEach((offset) => { const row = from[0] + direction; const col = from[1] + offset; if (inBounds(row, col) && board.value[row][col]?.color !== piece.color && board.value[row][col]) result.push([row, col]); });
    return result;
  }
  if (piece.type === "knight") [[1,2],[1,-2],[-1,2],[-1,-2],[2,1],[2,-1],[-2,1],[-2,-1]].forEach(([row, col]) => add(from[0] + row, from[1] + col));
  if (piece.type === "king") for (let row = -1; row <= 1; row += 1) for (let col = -1; col <= 1; col += 1) if (row || col) add(from[0] + row, from[1] + col);
  const diagonal = piece.type === "bishop" || piece.type === "queen"; const straight = piece.type === "rook" || piece.type === "queen"; const rays = [];
  if (diagonal) rays.push([1,1],[1,-1],[-1,1],[-1,-1]); if (straight) rays.push([1,0],[-1,0],[0,1],[0,-1]);
  rays.forEach(([rowStep, colStep]) => { let row = from[0] + rowStep; let col = from[1] + colStep; while (inBounds(row, col)) { const canContinue = add(row, col); if (!canContinue) break; row += rowStep; col += colStep; } });
  return result.filter((to) => piece.type === "knight" || piece.type === "king" || piece.type === "pawn" || clearPath(from, to));
}

const possible = computed(() => selected.value ? movesFrom(selected.value).map(([row, col]) => `${row}:${col}`) : []);
function reset() { board.value = makeBoard(); turn.value = "white"; selected.value = null; winner.value = null; }
function clickCell(row, col) {
  if (winner.value) return;
  const piece = board.value[row][col];
  if (selected.value) {
    const legal = possible.value.includes(`${row}:${col}`);
    if (legal) {
      const moving = board.value[selected.value[0]][selected.value[1]];
      if (piece?.type === "king") winner.value = moving.color;
      board.value[row][col] = moving; board.value[selected.value[0]][selected.value[1]] = null;
      if (moving.type === "pawn" && (row === 0 || row === 7)) moving.type = "queen";
      turn.value = moving.color === "white" ? "black" : "white"; selected.value = null; return;
    }
  }
  selected.value = piece?.color === turn.value ? [row, col] : null;
}
</script>

<template>
  <div class="game-panel">
    <div class="score-row"><div class="score-box"><strong>{{ winner || turn }}</strong><span>{{ winner ? "勝者" : "輪到" }}</span></div></div>
    <div class="chess-board">
      <button v-for="(piece, index) in board.flat()" :key="index" class="chess-cell" :class="{ dark: (Math.floor(index / 8) + index) % 2, selected: selected?.[0] === Math.floor(index / 8) && selected?.[1] === index % 8, move: possible.includes(`${Math.floor(index / 8)}:${index % 8}`) }" @click="clickCell(Math.floor(index / 8), index % 8)">
        {{ piece ? symbols[piece.color][piece.type] : "" }}
      </button>
    </div>
    <div class="game-actions"><button class="button button--primary" @click="reset">重新開始</button></div>
    <p class="game-hint">目前是本機雙人 first-pass：基本走法、吃子、升變；將軍、王車易位與吃過路兵下一階段補。</p>
  </div>
</template>
