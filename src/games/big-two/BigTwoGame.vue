<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import GameChrome from "../../components/GameChrome.vue";
import { canPlay, findCpuPlay, handLabel, makeDeck, removeCards, shuffle, sortCards } from "./engine";

const players = ref([]);
const turn = ref(0);
const selectedValues = ref([]);
const lastPlay = ref(null);
const passes = ref(0);
const leader = ref(0);
const firstTrick = ref(true);
const message = ref("按開始發牌");
const winner = ref(null);
const selecting = ref(false);
const selectionMode = ref("add");
let cpuTimer;

const human = computed(() => players.value[0] || { cards: [] });
const selectedCards = computed(() => human.value.cards.filter((card) => selectedValues.value.includes(card.value)));
const selectedResult = computed(() => canPlay(selectedCards.value, lastPlay.value?.cards || null, firstTrick.value));
const status = computed(() => winner.value ? `${winner.value} 獲勝` : !players.value.length ? "等待開局" : turn.value === 0 ? (selectedCards.value.length ? selectedResult.value.ok ? `${handLabel(selectedCards.value)}可以出` : selectedResult.value.reason : "輪到你") : `${players.value[turn.value].name} 思考中`);
const tone = computed(() => winner.value ? "success" : turn.value === 0 ? "active" : "neutral");
const stats = computed(() => [
  { label: "手牌", value: human.value.cards.length },
  { label: "已選", value: selectedCards.value.length },
  { label: "PASS", value: passes.value }
]);

function clearTimer() { window.clearTimeout(cpuTimer); }
function scheduleCpu() {
  clearTimer();
  if (!winner.value && players.value.length && turn.value !== 0) cpuTimer = window.setTimeout(cpuTurn, 520);
}
function newGame() {
  clearTimer();
  const deck = shuffle(makeDeck());
  players.value = [0, 1, 2, 3].map((index) => ({
    name: index === 0 ? "你" : `CPU ${index}`,
    cards: sortCards(deck.slice(index * 13, index * 13 + 13))
  }));
  turn.value = players.value.findIndex((player) => player.cards.some((card) => card.rank === "3" && card.suit === "♣"));
  leader.value = turn.value;
  selectedValues.value = [];
  lastPlay.value = null;
  passes.value = 0;
  firstTrick.value = true;
  winner.value = null;
  message.value = `${players.value[turn.value].name} 有梅花 3，先手。`;
  scheduleCpu();
}
function advance() { turn.value = (turn.value + 1) % 4; scheduleCpu(); }
function commitPlay(playerIndex, cards) {
  const result = canPlay(cards, lastPlay.value?.cards || null, firstTrick.value);
  if (!result.ok) { if (playerIndex === 0) message.value = result.reason; return false; }
  const player = players.value[playerIndex];
  player.cards = removeCards(player.cards, cards);
  lastPlay.value = { player: playerIndex, cards: sortCards(cards), evaluation: result.hand };
  leader.value = playerIndex;
  passes.value = 0;
  firstTrick.value = false;
  selectedValues.value = [];
  message.value = `${player.name} 出 ${result.hand.typeLabel}`;
  if (!player.cards.length) { winner.value = player.name; clearTimer(); return true; }
  advance();
  return true;
}
function playSelected() {
  if (turn.value !== 0 || !selectedCards.value.length || winner.value) return;
  commitPlay(0, selectedCards.value);
}
function pass(playerIndex = 0) {
  if (winner.value || !lastPlay.value || turn.value !== playerIndex) return;
  const player = players.value[playerIndex];
  passes.value += 1;
  message.value = `${player.name} Pass`;
  if (passes.value >= 3) {
    lastPlay.value = null;
    passes.value = 0;
    turn.value = leader.value;
    message.value = `${players.value[leader.value].name} 收回牌權，重新領牌。`;
    scheduleCpu();
    return;
  }
  advance();
}
function cpuTurn() {
  if (winner.value || turn.value === 0) return;
  const index = turn.value;
  const player = players.value[index];
  const cards = findCpuPlay(player.cards, lastPlay.value?.cards || null, firstTrick.value);
  if (cards) commitPlay(index, cards);
  else pass(index);
}
function applySelection(card) {
  if (turn.value !== 0 || winner.value) return;
  const selected = selectedValues.value.includes(card.value);
  if (selectionMode.value === "add" && !selected && selectedValues.value.length < 5) selectedValues.value = [...selectedValues.value, card.value];
  if (selectionMode.value === "remove" && selected) selectedValues.value = selectedValues.value.filter((value) => value !== card.value);
}
function startSweep(card) {
  selecting.value = true;
  selectionMode.value = selectedValues.value.includes(card.value) ? "remove" : "add";
  applySelection(card);
}
function sweep(card) { if (selecting.value) applySelection(card); }
function stopSweep() { selecting.value = false; }

onMounted(() => window.addEventListener("pointerup", stopSweep));
onBeforeUnmount(() => { clearTimer(); window.removeEventListener("pointerup", stopSweep); });
</script>

<template>
  <GameChrome :status="status" :tone="tone" :stats="stats" :busy="players.length && turn !== 0 && !winner">
    <div v-if="!players.length" class="big-two-table" style="place-items:center">
      <button class="button button--primary" @click="newGame">開始新牌局</button>
    </div>

    <div v-else class="big-two-table">
      <div class="big-two-opponents">
        <div v-for="(player, offset) in players.slice(1)" :key="player.name" class="big-two-seat" :class="{ 'is-turn': turn === offset + 1 }">
          <strong>{{ player.name }}</strong><br /><span>{{ player.cards.length }} 張</span>
        </div>
      </div>

      <div class="big-two-center">
        <div class="big-two-message">{{ message }}</div>
        <div class="big-two-trick">
          <button v-for="card in lastPlay?.cards || []" :key="card.value" class="card" :class="{ red: card.color === 'red' }" tabindex="-1"><strong>{{ card.rank }}</strong><span>{{ card.suit }}</span></button>
        </div>
        <strong v-if="lastPlay">{{ lastPlay.evaluation.typeLabel }} · {{ players[lastPlay.player].name }}</strong>
        <span v-else>自由領牌</span>
      </div>

      <div class="big-two-hand" @pointerleave="stopSweep">
        <button
          v-for="card in human.cards"
          :key="card.value"
          class="card"
          :class="{ red: card.color === 'red', selected: selectedValues.includes(card.value) }"
          :disabled="turn !== 0 || winner"
          @pointerdown.prevent="startSweep(card)"
          @pointerenter="sweep(card)"
        ><strong>{{ card.rank }}</strong><span>{{ card.suit }}</span></button>
      </div>
    </div>

    <template #primary>
      <button class="button button--primary" :disabled="turn !== 0 || !selectedCards.length || !selectedResult.ok || winner" @click="playSelected">出牌</button>
      <button class="button button--subtle" :disabled="turn !== 0 || !lastPlay || winner" @click="pass(0)">Pass</button>
    </template>
    <template #secondary>
      <span v-if="selectedCards.length" class="interaction-chip">{{ handLabel(selectedCards) }}</span>
      <button class="button button--subtle" @click="newGame">重新發牌</button>
    </template>
    <template #hint>現在支援單張、對子、三條、順子、同花、葫蘆、鐵支、同花順，以及三家 Pass 後重置牌權。手牌可按住橫掃多選，不再是一張一張比大小的假大老二。</template>
  </GameChrome>
</template>
