<script setup>
import { computed, ref } from "vue";

const palette = ["coral", "blue", "mint", "amber", "violet"];
const colors = { coral: "#ff765f", blue: "#789bff", mint: "#56bd9b", amber: "#e0aa50", violet: "#9580ff" };
const moves = ref(0);
const limit = 18;
const board = ref(makeBoard());
const cellTokens = ref(Array(64).fill(0));
const changedCells = ref(new Set());
const status = computed(() => board.value.every((row) => row.every((color) => color === board.value[0][0])) ? "完成" : moves.value >= limit ? "失敗" : "進行中");

function makeBoard() { return Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => palette[(row * 3 + col * 2 + row % 3) % palette.length])); }
function reset() { board.value = makeBoard(); moves.value = 0; changedCells.value = new Set(); cellTokens.value = Array(64).fill(0); }

function fill(newColor) {
  if (status.value !== "進行中" || board.value[0][0] === newColor) return;
  const oldColor = board.value[0][0];
  const queue = [[0, 0]];
  const visited = new Set();
  while (queue.length) {
    const [row, col] = queue.shift();
    const key = `${row}:${col}`;
    if (visited.has(key) || board.value[row]?.[col] !== oldColor) continue;
    visited.add(key);
    board.value[row][col] = newColor;
    [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]].forEach(([nextRow, nextCol]) => {
      if (nextRow >= 0 && nextRow < 8 && nextCol >= 0 && nextCol < 8) queue.push([nextRow, nextCol]);
    });
  }
  const changed = [...visited].map((keyValue) => {
    const [row, col] = keyValue.split(":").map(Number);
    return row * 8 + col;
  });
  const nextTokens = cellTokens.value.slice();
  changed.forEach((index) => { nextTokens[index] += 1; });
  cellTokens.value = nextTokens;
  changedCells.value = new Set(changed);
  moves.value += 1;
}
</script>

<template>
  <div class="game-panel">
    <div class="score-row"><div class="score-box"><strong>{{ moves }}/{{ limit }}</strong><span>步數</span></div><div class="score-box"><strong>{{ status }}</strong><span>狀態</span></div></div>
    <div class="fill-board" :class="{ 'fill-board--complete': status === '完成' }"><span v-for="(color, index) in board.flat()" :key="`${index}-${cellTokens[index]}`" class="fill-cell" :class="{ 'fill-cell--changed': changedCells.has(index) }" :style="{ '--c': colors[color] }" /></div>
    <div class="color-palette"><button v-for="color in palette" :key="color" class="palette-dot" :class="{ active: board[0][0] === color }" :style="{ '--c': colors[color] }" :aria-label="color" @click="fill(color)" /></div>
    <div class="game-actions"><button class="button button--primary" @click="reset">重置</button></div>
    <p class="game-hint">從左上角的連通區開始染色，在 18 步內填滿整張棋盤。</p>
  </div>
</template>
