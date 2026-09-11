<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const canvas = ref(null);
const tool = ref(1);
const drawing = ref(false);
const brush = ref({ row: -1, col: -1 });
const size = 64;
const cells = Array.from({ length: size }, () => Array(size).fill(0));
let frame = 0;
let phase = 0;

function draw() {
  const context = canvas.value?.getContext("2d");
  if (!context) return;
  const cellSize = canvas.value.width / size;
  context.fillStyle = "#0a0d12";
  context.fillRect(0, 0, canvas.value.width, canvas.value.height);
  for (let row = 0; row < size; row += 1) for (let col = 0; col < size; col += 1) {
    if (cells[row][col] === 1) { const shimmer = 0.88 + ((row + col + phase) % 5) * 0.025; context.fillStyle = `rgba(230, 174, 104, ${shimmer})`; context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize); }
    if (cells[row][col] === 2) { context.fillStyle = "#667386"; context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize); }
  }
  if (drawing.value && brush.value.row >= 0) {
    context.beginPath();
    context.setLineDash([cellSize * .22, cellSize * .18]);
    context.lineWidth = 2;
    context.strokeStyle = tool.value === 1 ? "rgba(255, 214, 144, .9)" : tool.value === 2 ? "rgba(161, 181, 214, .9)" : "rgba(255, 255, 255, .75)";
    context.shadowColor = context.strokeStyle;
    context.shadowBlur = 8;
    context.arc((brush.value.col + .5) * cellSize, (brush.value.row + .5) * cellSize, cellSize * 1.4, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
    context.shadowBlur = 0;
  }
}

function paint(event) {
  const rect = canvas.value.getBoundingClientRect();
  const col = Math.floor(((event.clientX - rect.left) / rect.width) * size);
  const row = Math.floor(((event.clientY - rect.top) / rect.height) * size);
  brush.value = { row, col };
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
  phase = (phase + 1) % 20;
  draw();
  frame = requestAnimationFrame(tick);
}

function clear() { cells.forEach((row) => row.fill(0)); brush.value = { row: -1, col: -1 }; }
function pointerDown(event) { drawing.value = true; paint(event); }
function pointerMove(event) { if (drawing.value) paint(event); }
function pointerUp() { drawing.value = false; }

onMounted(() => { canvas.value.addEventListener("pointerdown", pointerDown); canvas.value.addEventListener("pointermove", pointerMove); window.addEventListener("pointerup", pointerUp); window.addEventListener("pointercancel", pointerUp); tick(); });
onBeforeUnmount(() => { cancelAnimationFrame(frame); canvas.value?.removeEventListener("pointerdown", pointerDown); canvas.value?.removeEventListener("pointermove", pointerMove); window.removeEventListener("pointerup", pointerUp); window.removeEventListener("pointercancel", pointerUp); });
</script>

<template>
  <div class="game-panel">
    <div class="sand-tools">
      <button class="button" :class="{ 'button--primary': tool === 1 }" @click="tool = 1">沙</button>
      <button class="button" :class="{ 'button--primary': tool === 2 }" @click="tool = 2">牆</button>
      <button class="button" :class="{ 'button--primary': tool === 0 }" @click="tool = 0">橡皮擦</button>
      <button class="button button--subtle" @click="clear">清空</button>
    </div>
    <div class="canvas-wrap" :class="{ 'canvas-wrap--drawing': drawing }"><canvas ref="canvas" class="sand-canvas" width="320" height="320" /></div>
    <p class="game-hint">按住滑鼠或手指繪製。沙粒受到重力影響，牆壁不會動。</p>
  </div>
</template>
