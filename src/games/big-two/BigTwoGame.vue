<script setup>
import { computed, ref } from "vue";

const suits = [{ symbol: "♣", color: "black" }, { symbol: "♦", color: "red" }, { symbol: "♥", color: "red" }, { symbol: "♠", color: "black" }];
const ranks = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"];
const players = ref([]); const turn = ref(0); const selected = ref([]); const last = ref(null); const message = ref(""); const winner = ref(null); const first = ref(true);
const dealToken = ref(0);
const human = computed(() => players.value[0] || { cards: [] });

function newGame() {
  const deck = suits.flatMap((suit, suitIndex) => ranks.map((rank, rankIndex) => ({ rank, suit: suit.symbol, color: suit.color, value: rankIndex * 4 + suitIndex })));
  for (let index = deck.length - 1; index > 0; index -= 1) { const swap = Math.floor(Math.random() * (index + 1)); [deck[index], deck[swap]] = [deck[swap], deck[index]]; }
  players.value = [0, 1, 2, 3].map((index) => ({ name: index === 0 ? "你" : `CPU ${index}`, cards: deck.slice(index * 13, index * 13 + 13).sort((left, right) => left.value - right.value) }));
  turn.value = players.value.findIndex((player) => player.cards.some((card) => card.rank === "3" && card.suit === "♣"));
  dealToken.value += 1;
  selected.value = []; last.value = null; winner.value = null; first.value = true; message.value = `${players.value[turn.value].name} 持有梅花 3，先手。`;
}

function canPlay(card) { return !last.value || card.value > last.value.value; }
function advance() { turn.value = (turn.value + 1) % 4; if (turn.value !== 0) window.setTimeout(cpuTurn, 260); }
function play(card) {
  if (turn.value !== 0 || !card || !canPlay(card) || first.value && !(card.rank === "3" && card.suit === "♣")) return;
  players.value[0].cards = players.value[0].cards.filter((item) => item.value !== card.value); last.value = card; first.value = false; selected.value = []; message.value = `你出了 ${card.rank}${card.suit}`;
  if (!players.value[0].cards.length) winner.value = "你"; else advance();
}
function cpuTurn() {
  if (winner.value || turn.value === 0) return;
  const player = players.value[turn.value]; const card = player.cards.find((item) => canPlay(item) && (!first.value || item.rank === "3" && item.suit === "♣"));
  if (card) { player.cards = player.cards.filter((item) => item.value !== card.value); last.value = card; first.value = false; message.value = `${player.name} 出了 ${card.rank}${card.suit}`; if (!player.cards.length) winner.value = player.name; } else { message.value = `${player.name} Pass`; }
  if (!winner.value) advance();
}
function toggle(card) { if (turn.value !== 0 || winner.value) return; selected.value = selected.value[0]?.value === card.value ? [] : [card]; }
</script>

<template>
  <div v-if="!players.length" class="game-panel"><button class="button button--primary" @click="newGame">開始牌局</button></div>
  <div v-else class="game-panel">
    <div class="score-row"><div class="score-box"><strong>{{ winner || players[turn].name }}</strong><span>{{ winner ? "勝者" : "輪到" }}</span></div><div class="score-box"><strong>{{ human.cards.length }}</strong><span>你的手牌</span></div></div>
    <div class="players"><div v-for="player in players.slice(1)" :key="player.name" class="cpu" :class="{ turn: player === players[turn] }"><strong>{{ player.name }}</strong><br />{{ player.cards.length }} 張牌</div></div>
    <div class="last-play"><strong>桌面牌</strong><div v-if="last" :key="`${last.value}-${dealToken}`" class="last-play__card" :class="{ red: last.color === 'red' }"><span>{{ last.rank }}</span><span>{{ last.suit }}</span></div><span v-else class="last-play__empty">尚未出牌</span></div>
    <p class="notice">{{ message }}<br />第一版先做單張出牌，牌型引擎下一階段接入。</p>
    <div class="cards"><button v-for="(card, index) in human.cards" :key="card.value" class="card" :style="{ '--card-index': index }" :class="{ red: card.color === 'red', selected: selected[0]?.value === card.value }" @click="toggle(card)"><strong>{{ card.rank }}</strong><span>{{ card.suit }}</span></button></div>
    <div class="game-actions"><button class="button button--primary" :disabled="turn !== 0 || !selected.length" @click="play(selected[0])">出牌</button><button class="button button--subtle" @click="newGame">重新發牌</button></div>
  </div>
</template>
