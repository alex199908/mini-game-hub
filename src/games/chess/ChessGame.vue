<script setup>
import { computed, ref, shallowRef } from "vue";
import { Chess } from "chess.js";
import GameChrome from "../../components/GameChrome.vue";

const pieceNames = { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" };
const files = "abcdefgh";
const game = shallowRef(new Chess());
const version = ref(0);
const selected = ref(null);
const pendingPromotion = ref(null);
const suppressClick = ref(false);
const drag = ref({ active: false, pointerId: null, from: null, x: 0, y: 0, startX: 0, startY: 0, src: "" });

function pieceAsset(piece) {
  if (!piece) return "";
  const color = piece.color === "w" ? "white" : "black";
  return `${import.meta.env.BASE_URL}chess/pieces/${color}-${pieceNames[piece.type]}.svg`;
}

const boardCells = computed(() => {
  version.value;
  return game.value.board().flatMap((row, rowIndex) => row.map((piece, colIndex) => ({
    piece,
    row: rowIndex,
    col: colIndex,
    square: `${files[colIndex]}${8 - rowIndex}`
  })));
});
const history = computed(() => { version.value; return game.value.history({ verbose: true }); });
const lastMove = computed(() => history.value.at(-1) || null);
const legalMoves = computed(() => {
  version.value;
  if (!selected.value || game.value.isGameOver()) return [];
  return game.value.moves({ square: selected.value, verbose: true });
});
const legalBySquare = computed(() => new Map(legalMoves.value.map((move) => [move.to, move])));
const checkSquare = computed(() => {
  version.value;
  if (!game.value.inCheck()) return null;
  const color = game.value.turn();
  return boardCells.value.find((cell) => cell.piece?.type === "k" && cell.piece?.color === color)?.square || null;
});
const status = computed(() => {
  version.value;
  const turn = game.value.turn() === "w" ? "白方" : "黑方";
  if (game.value.isCheckmate()) return `${turn}被將死`;
  if (game.value.isStalemate()) return "逼和";
  if (game.value.isDraw()) return "和棋";
  if (game.value.inCheck()) return `${turn}被將軍`;
  return `${turn}行棋`;
});
const tone = computed(() => {
  version.value;
  return game.value.isGameOver() ? (game.value.isCheckmate() ? "danger" : "neutral") : game.value.inCheck() ? "danger" : "active";
});
const stats = computed(() => [
  { label: "回合", value: game.value.turn() === "w" ? "白" : "黑" },
  { label: "手數", value: history.value.length },
  { label: "狀態", value: game.value.inCheck() ? "CHECK" : "LIVE" }
]);

function reset() {
  game.value = new Chess();
  version.value += 1;
  selected.value = null;
  pendingPromotion.value = null;
}
function undo() {
  if (!game.value.undo()) return;
  version.value += 1;
  selected.value = null;
  pendingPromotion.value = null;
}
function commitMove(from, to, promotion) {
  try {
    const move = game.value.move({ from, to, ...(promotion ? { promotion } : {}) });
    if (!move) return false;
    version.value += 1;
    selected.value = null;
    pendingPromotion.value = null;
    return true;
  } catch { return false; }
}
function requestMove(from, to) {
  const candidates = game.value.moves({ square: from, verbose: true }).filter((move) => move.to === to);
  if (!candidates.length) return false;
  const promotions = [...new Set(candidates.map((move) => move.promotion).filter(Boolean))];
  if (promotions.length) {
    pendingPromotion.value = { from, to, options: promotions, color: game.value.turn() };
    return true;
  }
  return commitMove(from, to);
}
function clickSquare(cell) {
  if (suppressClick.value || game.value.isGameOver() || pendingPromotion.value) return;
  if (selected.value && legalBySquare.value.has(cell.square)) { requestMove(selected.value, cell.square); return; }
  if (cell.piece?.color === game.value.turn()) selected.value = selected.value === cell.square ? null : cell.square;
  else selected.value = null;
}
function pointerDown(cell, event) {
  if (game.value.isGameOver() || pendingPromotion.value || cell.piece?.color !== game.value.turn()) return;
  selected.value = cell.square;
  drag.value = {
    active: true,
    pointerId: event.pointerId,
    from: cell.square,
    x: event.clientX,
    y: event.clientY,
    startX: event.clientX,
    startY: event.clientY,
    src: pieceAsset(cell.piece)
  };
  event.currentTarget.setPointerCapture?.(event.pointerId);
}
function pointerMove(event) {
  if (!drag.value.active || drag.value.pointerId !== event.pointerId) return;
  drag.value.x = event.clientX;
  drag.value.y = event.clientY;
}
function targetSquareAt(x, y) {
  return document.elementsFromPoint(x, y).find((element) => element?.dataset?.square)?.dataset?.square || null;
}
function pointerUp(event) {
  if (!drag.value.active || drag.value.pointerId !== event.pointerId) return;
  const distance = Math.hypot(event.clientX - drag.value.startX, event.clientY - drag.value.startY);
  const from = drag.value.from;
  const target = targetSquareAt(event.clientX, event.clientY);
  try { event.currentTarget.releasePointerCapture?.(event.pointerId); } catch {}
  drag.value = { active: false, pointerId: null, from: null, x: 0, y: 0, startX: 0, startY: 0, src: "" };
  if (distance > 8) {
    suppressClick.value = true;
    if (target && target !== from) requestMove(from, target);
    window.setTimeout(() => { suppressClick.value = false; }, 0);
  }
}
</script>

<template>
  <GameChrome :status="status" :tone="tone" :stats="stats">
    <div class="chess-layout">
      <div class="chess-board interactive-chess">
        <button
          v-for="cell in boardCells"
          :key="cell.square"
          class="chess-cell"
          :data-square="cell.square"
          :class="{
            dark: (cell.row + cell.col) % 2,
            selected: selected === cell.square,
            'is-legal': legalBySquare.has(cell.square) && !legalBySquare.get(cell.square)?.captured,
            'is-capture': Boolean(legalBySquare.get(cell.square)?.captured),
            'is-check': checkSquare === cell.square,
            'chess-cell--from': lastMove?.from === cell.square,
            'chess-cell--to': lastMove?.to === cell.square
          }"
          @click="clickSquare(cell)"
          @pointerdown="pointerDown(cell, $event)"
          @pointermove="pointerMove"
          @pointerup="pointerUp"
          @pointercancel="pointerUp"
        >
          <img v-if="cell.piece" class="chess-piece" :src="pieceAsset(cell.piece)" alt="" draggable="false" />
        </button>
      </div>

      <aside class="chess-rail">
        <strong>棋譜</strong>
        <div class="chess-rail__moves">
          <div v-for="(move, index) in history" :key="`${index}-${move.san}`" class="chess-move"><span>{{ index + 1 }}</span><strong>{{ move.san }}</strong></div>
          <span v-if="!history.length" class="muted">尚未走子</span>
        </div>
      </aside>

      <div v-if="pendingPromotion" class="promotion-picker">
        <button v-for="piece in pendingPromotion.options" :key="piece" class="button" @click="commitMove(pendingPromotion.from, pendingPromotion.to, piece)">
          <img class="promotion-piece" :src="pieceAsset({ color: pendingPromotion.color, type: piece })" alt="" draggable="false" />
        </button>
      </div>
      <img v-if="drag.active" class="chess-drag-ghost" :src="drag.src" alt="" draggable="false" :style="{ left: `${drag.x}px`, top: `${drag.y}px` }" />
    </div>

    <template #primary>
      <button class="button button--subtle" :disabled="!history.length" @click="undo">悔棋</button>
      <button class="button button--primary" @click="reset">重新開局</button>
    </template>
    <template #secondary><span class="interaction-chip">拖曳棋子</span><span class="interaction-chip">王車易位 · 吃過路兵 · 升變</span></template>
    <template #hint>
      拖曳或點選棋子到合法落點，規則由 chess.js 驗證。
      <a class="asset-credit" href="https://www.vecteezy.com/" target="_blank" rel="noopener noreferrer">棋子素材：Vecteezy</a>
    </template>
  </GameChrome>
</template>
