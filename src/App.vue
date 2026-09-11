<script setup>
import { computed, ref } from "vue";
import ComingSoon from "./components/ComingSoon.vue";
import GameCard from "./components/GameCard.vue";
import GameShell from "./components/GameShell.vue";
import { games } from "./data/games";
import { useAppStore } from "./stores/app";
import Game2048 from "./games/2048/2048Game.vue";
import SudokuGame from "./games/sudoku/SudokuGame.vue";
import ColorConnectGame from "./games/color-connect/ColorConnectGame.vue";
import WaterSortGame from "./games/water-sort/WaterSortGame.vue";
import MultiColorFillGame from "./games/multi-color-fill/MultiColorFillGame.vue";
import SandTetrisGame from "./games/sand-tetris/SandTetrisGame.vue";
import ChessGame from "./games/chess/ChessGame.vue";
import BigTwoGame from "./games/big-two/BigTwoGame.vue";

const app = useAppStore();
const activeId = ref(null);
const activeGame = computed(() => games.find((game) => game.id === activeId.value));
const playableCount = computed(() => games.filter((game) => game.status === "ready").length);
const gameComponents = { "2048": Game2048, sudoku: SudokuGame, "color-connect": ColorConnectGame, "water-sort": WaterSortGame, "multi-color-fill": MultiColorFillGame, "sand-tetris": SandTetrisGame, chess: ChessGame, "big-two": BigTwoGame };
const activeComponent = computed(() => activeGame.value ? gameComponents[activeGame.value.id] : null);
function selectGame(game) { activeId.value = game.id; }
function goHome() { activeId.value = null; }
</script>

<template>
  <div class="app-frame">
    <header class="topbar">
      <button class="icon-button" aria-label="回到首頁" @click="goHome">⌂</button>
      <button class="brand" @click="goHome">
        <span class="eyebrow">OFFLINE MINI GAMES</span>
        <span class="brand__title">Pocket Arcade</span>
      </button>
      <button class="icon-button" :aria-label="app.theme === 'dark' ? '切換明亮模式' : '切換暗黑模式'" @click="app.toggleTheme">
        {{ app.theme === "dark" ? "☼" : "◐" }}
      </button>
    </header>

    <main v-if="!activeGame" class="home-view">
      <section class="hero-card">
        <div>
          <span class="pill">{{ playableCount }}/{{ games.length }} playable · local only</span>
          <h1>一包就好，別把小遊戲做成 SaaS。</h1>
          <p>純前端、可離線、手機可玩。進度與最佳成績只存這台裝置。</p>
        </div>
        <div class="hero-mark" aria-hidden="true">PA</div>
      </section>

      <section class="section-heading">
        <div><p class="eyebrow">THE COLLECTION</p><h2>選一款，直接開玩。</h2></div>
        <span class="muted">{{ games.length }} modules planned</span>
      </section>

      <section class="game-grid" aria-label="遊戲清單">
        <GameCard v-for="game in games" :key="game.id" :game="game" @select="selectGame" />
      </section>
    </main>

    <GameShell v-else :eyebrow="`${activeGame.category} / ${String(games.indexOf(activeGame) + 1).padStart(2, '0')}`" :title="activeGame.title" :subtitle="activeGame.description" @back="goHome">
      <template #actions><span v-if="activeGame.status === 'ready'" class="live-badge">LIVE</span></template>
      <component :is="activeComponent" v-if="activeComponent" />
      <ComingSoon v-else :game="activeGame" />
    </GameShell>
  </div>
</template>
