<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import GameChrome from "../../components/GameChrome.vue";
import { createGame, move, undo } from "./engine";

const STORAGE_KEY = "mini-game-hub-2048";
const SWIPE_THRESHOLD = 42;

function loadGame() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || createGame(); }
  catch { return createGame(); }
}

const game = ref(loadGame());
const changed = ref(new Set());
const invalidPulse = ref(0);
const drag = ref({ active: false, pointerId: null, startX: 0, startY: 0, dx: 0, dy: 0 });
const board = computed(() => game.value.board.flat());
const statusText = computed(() => game.value.status === "won" ? "2048 達成" : game.value.status === "lost" ? "無路可走" : "滑動棋盤");
const statusTone = computed(() => game.value.status === "won" ? "success" : game.value.status === "lost" ? "danger" : "active");
const stats = computed(() => [
  { label: "分數", value: game.value.score },
  { label: "最高", value: game.value.best },
  { label: "UNDO", value: game.value.history.length }
]);
const dragStyle = computed(() => ({
  "--drag-x": `${drag.value.dx * .12}px`,
  "--drag-y": `${drag.value.dy * .12}px`,
  "--swipe-power": `${Math.min(100, Math.max(Math.abs(drag.value.dx), Math.abs(drag.value.dy)) / SWIPE_THRESHOLD * 100)}%`
}));

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(game.value)); }
function restart() { game.value = createGame(game.value.best); changed.value = new Set(); }
function handleMove(direction) {
  const before = game.value.board.flat();
  const next = move(game.value, direction);
  if (next === game.value) { invalidPulse.value += 1; return false; }
  game.value = next;
  const after = next.board.flat();
  changed.value = new Set(after.map((value, index) => value !== before[index] ? index : -1).filter((index) => index >= 0));
  return true;
}
function handleUndo() {
  const next = undo(game.value);
  if (next !== game.value) { game.value = next; changed.value = new Set(board.value.map((_, index) => index)); }
}
function onKeydown(event) {
  const directions = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  if (!directions[event.key]) return;
  event.preventDefault();
  handleMove(directions[event.key]);
}
function pointerDown(event) {
  if (game.value.status === "lost") return;
  drag.value = { active: true, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0 };
  event.currentTarget.setPointerCapture?.(event.pointerId);
}
function pointerMove(event) {
  if (!drag.value.active || drag.value.pointerId !== event.pointerId) return;
  drag.value.dx = event.clientX - drag.value.startX;
  drag.value.dy = event.clientY - drag.value.startY;
}
function finishPointer(event, cancelled = false) {
  if (!drag.value.active || drag.value.pointerId !== event.pointerId) return;
  const { dx, dy } = drag.value;
  try { event.currentTarget.releasePointerCapture?.(event.pointerId); } catch {}
  drag.value = { active: false, pointerId: null, startX: 0, startY: 0, dx: 0, dy: 0 };
  if (cancelled || Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
  handleMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
}

watch(game, persist, { deep: true });
onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <GameChrome :status="statusText" :tone="statusTone" :stats="stats">
    <div
      class="board-2048 interactive-board"
      :class="[{ 'is-dragging': drag.active, 'board-2048--shake': invalidPulse % 2 }]"
      :style="dragStyle"
      @pointerdown="pointerDown"
      @pointermove="pointerMove"
      @pointerup="finishPointer"
      @pointercancel="(event) => finishPointer(event, true)"
    >
      <div
        v-for="(value, index) in board"
        :key="index"
        class="tile-2048"
        :class="{ 'is-changed': changed.has(index), 'tile-2048--win': value === 2048 }"
        :data-value="value"
      >{{ value || "" }}</div>
      <div class="swipe-meter" aria-hidden="true"><span /></div>
    </div>

    <template #primary>
      <button class="button button--subtle" :disabled="!game.history.length" @click="handleUndo">Undo</button>
      <button class="button button--primary" @click="restart">重新開始</button>
    </template>
    <template #secondary>
      <span class="interaction-chip">手機：直接滑動</span>
      <span class="interaction-chip"><kbd>←↑↓→</kbd> 鍵盤</span>
    </template>
    <template #hint>拖曳途中棋盤會跟手，超過門檻才送出移動；無效方向會直接回彈，不再塞一組反人類方向鍵。</template>
  </GameChrome>
</template>
