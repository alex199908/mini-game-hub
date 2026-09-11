<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const canvas = ref(null);
const tool = ref(1);
const size = 64;
const cells = Array.from({ length: size }, () => Array(size).fill(0));
let frame = 0;
let drawing = false;

function draw() {
  const context = canvas.value?.getContext("2d");
  if (!context) return;
  const cellSize = canvas.value.width / size;
  context.fillStyle = "#0a0d12";
  context.fillRect(0, 0, canvas.value.width, canvas.value.height);
  for (let row = 0; row < size; row += 1) for (let col = 0; col < size; col += 1) {
    if (cells[row][col] === 1) { context.fillStyle = "#e6ae68"; context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize); }
    if (cells[row][col] === 2) { context.fillStyle = "#667386"; context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize); }
  }
}

function paint(event) {
  const rect = canvas.value.getBoundingClientRect();
  const col = Math.floor(((event.clientX - rect.left) / rect.width) * size);
  const row = Math.floor(((event.clientY - rect.top) / rect.height) * size);
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
    if (cells[row + rowOffset]?.[col + colOffset] !== undefined) cells[row + rowOffset][col + colOffset] = tool.value;
  }
}

function tick() {
  for (let row = size - 2; row >= 0; row -= 1) for (let col = 1; col < size - 1; col += 1) {
    if (cells[row][col] !== 1) continue;
    if (!cells[row + 1][col]) cells[row + 1][col] = cells[row][col] = 0;
    else {
      const directions = Math.random() < .5 ? [-1, 1] : [1, -1];
      for (const direction of directions) {
        if (!cells[row + 1][col + direction]) { cells[row + 1][col + direction] = 1; cells[row][col] = 0; break; }
      }
    }
  }
  draw();
  frame = requestAnimationFrame(tick);
}

function clear() { cells.forEach((row) => row.fill(0)); }
function pointerDown(event) { drawing = true; paint(event); }
function pointerMove(event) { if (drawing) paint(event); }
function pointerUp() { drawing = false; }

onMounted(() => { canvas.value.addEventListener("pointerdown", pointerDown); canvas.value.addEventListener("pointermove", pointerMove); window.addEventListener("pointerup", pointerUp); tick(); });
onBeforeUnmount(() => { cancelAnimationFrame(frame); canvas.value?.removeEventListener("pointerdown", pointerDown); canvas.value?.removeEventListener("pointermove", pointerMove); window.removeEventListener("pointerup", pointerUp); });
</script>

<template>
  <div class="game-panel">
    <div class="sand-tools">
      <button class="button" :class="{ 'button--primary': tool === 1 }" @click="tool = 1">沙</button>
      <button class="button" :class="{ 'button--primary': tool === 2 }" @click="tool = 2">牆</button>
      <button class="button" :class="{ 'button--primary': tool === 0 }" @click="tool = 0">橡皮擦</button>
      <button class="button button--subtle" @click="clear">清空</button>
    </div>
    <div class="canvas-wrap"><canvas ref="canvas" class="sand-canvas" width="320" height="320" /></div>
    <p class="game-hint">按住滑鼠或手指繪製。沙粒受到重力影響，牆壁不會動。</p>
  </div>
</template>
