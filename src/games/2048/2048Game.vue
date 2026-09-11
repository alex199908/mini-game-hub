<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { createGame, move, undo } from "./engine";

const STORAGE_KEY = "mini-game-hub-2048";

function loadGame() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || createGame();
  } catch {
    return createGame();
  }
}

const game = ref(loadGame());
const board = computed(() => game.value.board.flat());
const statusText = computed(() => {
  if (game.value.status === "won") return "已達成 2048";
  if (game.value.status === "lost") return "沒有可走步數";
  return "進行中";
});

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(game.value)); }
function restart() { game.value = createGame(game.value.best); }
function handleMove(direction) { game.value = move(game.value, direction); }
function handleUndo() { game.value = undo(game.value); }

function onKeydown(event) {
  const directions = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  if (!directions[event.key]) return;
  event.preventDefault();
  handleMove(directions[event.key]);
}

const touchStart = ref(null);
function onTouchStart(event) {
  const point = event.changedTouches[0];
  touchStart.value = { x: point.clientX, y: point.clientY };
}

function onTouchEnd(event) {
  if (!touchStart.value) return;
  const point = event.changedTouches[0];
  const dx = point.clientX - touchStart.value.x;
  const dy = point.clientY - touchStart.value.y;
  touchStart.value = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  handleMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
}

watch(game, persist, { deep: true });
onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div class="game-panel">
    <div class="score-row">
      <div class="score-box"><strong>{{ game.score }}</strong><span>分數</span></div>
      <div class="score-box"><strong>{{ game.best }}</strong><span>最高分</span></div>
      <div class="score-box"><strong>{{ statusText }}</strong><span>狀態</span></div>
    </div>

    <div class="board-2048" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
      <div v-for="(value, index) in board" :key="index" class="tile-2048" :data-value="value">{{ value || "" }}</div>
    </div>

    <div class="d-pad" aria-label="2048 directional controls">
      <span />
      <button class="button button--subtle" @click="handleMove('up')">↑</button>
      <span />
      <button class="button button--subtle" @click="handleMove('left')">←</button>
      <button class="button button--subtle" @click="handleMove('down')">↓</button>
      <button class="button button--subtle" @click="handleMove('right')">→</button>
    </div>

    <div class="game-actions">
      <button class="button button--subtle" :disabled="!game.history.length" @click="handleUndo">Undo</button>
      <button class="button button--primary" @click="restart">重新開始</button>
    </div>
    <p class="game-hint">桌面按方向鍵，手機直接滑動棋盤。遊戲進度會自動保存在這台裝置。</p>
  </div>
</template>
