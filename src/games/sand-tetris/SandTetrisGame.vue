<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import GameChrome from "../../components/GameChrome.vue";

const canvas = ref(null);
const WIDTH = 12;
const HEIGHT = 20;
const PALETTE = [null, "#ff765f", "#789bff", "#56bd9b", "#e0aa50", "#9580ff", "#ec77b5", "#7ad6d0"];
const SHAPES = {
  I: [[0,1],[1,1],[2,1],[3,1]], O: [[0,0],[1,0],[0,1],[1,1]], T: [[0,0],[1,0],[2,0],[1,1]],
  L: [[0,0],[0,1],[0,2],[1,2]], J: [[1,0],[1,1],[1,2],[0,2]], S: [[1,0],[2,0],[0,1],[1,1]], Z: [[0,0],[1,0],[1,1],[2,1]]
};
const TYPES = Object.keys(SHAPES);
const grid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0));
const score = ref(0);
const lines = ref(0);
const status = ref("ready");
const nextType = ref("T");
const drag = ref({ active: false, pointerId: null, startX: 0, startY: 0, baseX: 0 });
let active = null;
let frame = 0;
let lastTime = 0;
let fallAccumulator = 0;
let sandAccumulator = 0;

const statusText = computed(() => status.value === "ready" ? "準備開始" : status.value === "playing" ? "方塊下落中" : status.value === "paused" ? "已暫停" : "遊戲結束");
const tone = computed(() => status.value === "over" ? "danger" : status.value === "playing" ? "active" : "neutral");
const stats = computed(() => [{ label: "分數", value: score.value }, { label: "消行", value: lines.value }, { label: "NEXT", value: nextType.value }]);

function randomType() { return TYPES[Math.floor(Math.random() * TYPES.length)]; }
function shape(type, rotation = 0) {
  let points = SHAPES[type].map(([x, y]) => [x, y]);
  for (let turn = 0; turn < rotation % 4; turn += 1) points = points.map(([x, y]) => [y, -x]);
  const minX = Math.min(...points.map(([x]) => x)); const minY = Math.min(...points.map(([, y]) => y));
  return points.map(([x, y]) => [x - minX, y - minY]);
}
function coords(piece = active) { return piece ? shape(piece.type, piece.rotation).map(([x, y]) => [piece.x + x, piece.y + y]) : []; }
function canPlace(piece) {
  return coords(piece).every(([x, y]) => x >= 0 && x < WIDTH && y < HEIGHT && (y < 0 || !grid[y][x]));
}
function spawn() {
  const type = nextType.value || randomType(); nextType.value = randomType();
  const width = Math.max(...shape(type).map(([x]) => x)) + 1;
  active = { type, rotation: 0, x: Math.floor((WIDTH - width) / 2), y: -1, color: 1 + TYPES.indexOf(type) };
  if (!canPlace(active)) { status.value = "over"; active = null; }
}
function clearGrid() { grid.forEach((row) => row.fill(0)); }
function newGame() {
  clearGrid(); score.value = 0; lines.value = 0; nextType.value = randomType(); status.value = "playing";
  active = null; spawn(); fallAccumulator = 0; sandAccumulator = 0; draw();
}
function lockPiece() {
  coords().forEach(([x, y]) => { if (y >= 0 && y < HEIGHT) grid[y][x] = active.color; });
  score.value += 20; active = null; settleSand(); clearLines(); spawn();
}
function move(dx, dy) {
  if (!active || status.value !== "playing") return false;
  const candidate = { ...active, x: active.x + dx, y: active.y + dy };
  if (canPlace(candidate)) { active = candidate; return true; }
  if (dy > 0) lockPiece();
  return false;
}
function rotate() {
  if (!active || status.value !== "playing") return;
  for (const kick of [0, -1, 1, -2, 2]) {
    const candidate = { ...active, rotation: (active.rotation + 1) % 4, x: active.x + kick };
    if (canPlace(candidate)) { active = candidate; return; }
  }
}
function hardDrop() {
  if (!active || status.value !== "playing") return;
  let distance = 0; while (move(0, 1)) distance += 1;
  score.value += distance * 2;
}
function settleSand() {
  for (let row = HEIGHT - 2; row >= 0; row -= 1) {
    for (let col = 0; col < WIDTH; col += 1) {
      if (!grid[row][col]) continue;
      if (!grid[row + 1][col]) { grid[row + 1][col] = grid[row][col]; grid[row][col] = 0; continue; }
      const directions = Math.random() < .5 ? [-1, 1] : [1, -1];
      for (const direction of directions) {
        const nextCol = col + direction;
        if (nextCol >= 0 && nextCol < WIDTH && !grid[row + 1][nextCol]) {
          grid[row + 1][nextCol] = grid[row][col]; grid[row][col] = 0; break;
        }
      }
    }
  }
}
function clearLines() {
  let count = 0;
  for (let row = HEIGHT - 1; row >= 0; row -= 1) {
    if (grid[row].every(Boolean)) { grid.splice(row, 1); grid.unshift(Array(WIDTH).fill(0)); count += 1; row += 1; }
  }
  if (count) { lines.value += count; score.value += count * count * 250; }
}
function draw() {
  const context = canvas.value?.getContext("2d"); if (!context) return;
  const cellW = canvas.value.width / WIDTH; const cellH = canvas.value.height / HEIGHT;
  context.fillStyle = "#090c11"; context.fillRect(0, 0, canvas.value.width, canvas.value.height);
  context.strokeStyle = "rgba(255,255,255,.045)"; context.lineWidth = 1;
  for (let x = 1; x < WIDTH; x += 1) { context.beginPath(); context.moveTo(x * cellW, 0); context.lineTo(x * cellW, canvas.value.height); context.stroke(); }
  for (let y = 1; y < HEIGHT; y += 1) { context.beginPath(); context.moveTo(0, y * cellH); context.lineTo(canvas.value.width, y * cellH); context.stroke(); }
  grid.forEach((row, y) => row.forEach((value, x) => {
    if (!value) return; context.fillStyle = PALETTE[value]; context.globalAlpha = .9 + ((x + y) % 3) * .03; context.fillRect(x * cellW + 1, y * cellH + 1, cellW - 2, cellH - 2);
  }));
  context.globalAlpha = 1;
  coords().forEach(([x, y]) => { if (y < 0) return; context.fillStyle = PALETTE[active.color]; context.fillRect(x * cellW + 1, y * cellH + 1, cellW - 2, cellH - 2); context.strokeStyle = "rgba(255,255,255,.5)"; context.strokeRect(x * cellW + 2, y * cellH + 2, cellW - 4, cellH - 4); });
}
function loop(time) {
  const delta = Math.min(40, time - lastTime || 0); lastTime = time;
  if (status.value === "playing") {
    fallAccumulator += delta; sandAccumulator += delta;
    if (fallAccumulator >= 520) { move(0, 1); fallAccumulator = 0; }
    if (sandAccumulator >= 70) { settleSand(); clearLines(); sandAccumulator = 0; }
  }
  draw(); frame = requestAnimationFrame(loop);
}
function keydown(event) {
  if (["ArrowLeft","ArrowRight","ArrowDown","ArrowUp"," "].includes(event.key)) event.preventDefault();
  if (event.key === "ArrowLeft") move(-1, 0); if (event.key === "ArrowRight") move(1, 0); if (event.key === "ArrowDown") move(0, 1); if (event.key === "ArrowUp") rotate(); if (event.key === " ") hardDrop(); if (event.key.toLowerCase() === "p") status.value = status.value === "playing" ? "paused" : status.value === "paused" ? "playing" : status.value;
}
function pointerDown(event) {
  if (status.value !== "playing" || !active) return;
  drag.value = { active: true, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, baseX: active.x };
  event.currentTarget.setPointerCapture?.(event.pointerId);
}
function pointerMove(event) {
  if (!drag.value.active || drag.value.pointerId !== event.pointerId || !active) return;
  const rect = canvas.value.getBoundingClientRect(); const cellWidth = rect.width / WIDTH;
  const delta = Math.round((event.clientX - drag.value.startX) / cellWidth);
  const candidate = { ...active, x: drag.value.baseX + delta };
  if (canPlace(candidate)) active = candidate;
}
function pointerUp(event) {
  if (!drag.value.active || drag.value.pointerId !== event.pointerId) return;
  const dx = event.clientX - drag.value.startX; const dy = event.clientY - drag.value.startY;
  try { event.currentTarget.releasePointerCapture?.(event.pointerId); } catch {}
  drag.value.active = false;
  if (Math.abs(dx) < 12 && Math.abs(dy) < 12) rotate(); else if (dy > 55) hardDrop();
}
function togglePause() {
  if (status.value === "ready" || status.value === "over") newGame();
  else status.value = status.value === "playing" ? "paused" : "playing";
}

onMounted(() => { window.addEventListener("keydown", keydown); frame = requestAnimationFrame(loop); });
onBeforeUnmount(() => { cancelAnimationFrame(frame); window.removeEventListener("keydown", keydown); });
</script>

<template>
  <GameChrome :status="statusText" :tone="tone" :stats="stats">
    <div class="sand-tetris-wrap">
      <canvas ref="canvas" class="sand-tetris-canvas" width="300" height="500" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerUp" />
      <aside class="sand-side">
        <div class="sand-next"><span class="eyebrow">NEXT</span><h3>{{ nextType }}</h3><p class="muted">落地後方塊會碎成沙粒並繼續受重力影響。</p></div>
        <div class="sand-next"><span class="eyebrow">GESTURE</span><p>左右拖：移動<br />點一下：旋轉<br />向下甩：Hard drop</p></div>
      </aside>
    </div>

    <template #primary>
      <button class="button button--primary" @click="togglePause">{{ status === 'playing' ? '暫停' : status === 'paused' ? '繼續' : '開始' }}</button>
      <button class="button button--subtle" @click="newGame">重新開始</button>
    </template>
    <template #secondary><button class="button" :disabled="status !== 'playing'" @click="rotate">旋轉</button><button class="button" :disabled="status !== 'playing'" @click="hardDrop">快速落下</button></template>
    <template #hint>這次是真的 Sand Tetris：Tetromino 會下落、旋轉、Hard drop，鎖定後碎成受重力影響的沙粒，填滿橫列才消除。原本那個畫沙 sandbox 已經退休。</template>
  </GameChrome>
</template>
