<script setup>
import { computed, ref } from "vue";

const puzzles = [
  ["530070000", "600195000", "098000060", "800060003", "400803001", "700020006", "060000280", "000419005", "000080079"],
  ["009000000", "080605020", "501078000", "000000700", "706000102", "003000000", "000720903", "040301080", "000000600"]
];
const solutions = [
  "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
  "269341578387695421541278369192483756756912843823567194615728934948361287437859612"
];

const puzzleIndex = ref(0);
const puzzle = computed(() => puzzles[puzzleIndex.value].join("").split("").map(Number));
const solution = computed(() => solutions[puzzleIndex.value].split("").map(Number));
const board = ref([...puzzle.value]);
const selected = ref(-1);
const mistakes = ref(0);
const feedback = ref({ index: -1, type: "", token: 0 });
const complete = computed(() => board.value.every((value, index) => value === solution.value[index]));

function newPuzzle() {
  puzzleIndex.value = (puzzleIndex.value + 1) % puzzles.length;
  board.value = [...puzzle.value];
  selected.value = -1;
  mistakes.value = 0;
  feedback.value = { index: -1, type: "", token: feedback.value.token + 1 };
}

function mark(index, type) { feedback.value = { index, type, token: feedback.value.token + 1 }; }

function enter(value) {
  if (selected.value < 0 || puzzle.value[selected.value] !== 0 || complete.value) return;
  board.value[selected.value] = value;
  const isWrong = value && value !== solution.value[selected.value];
  if (isWrong) mistakes.value += 1;
  mark(selected.value, value === 0 ? "clear" : isWrong ? "wrong" : "correct");
}

function hint() {
  if (selected.value < 0 || puzzle.value[selected.value] !== 0) return;
  board.value[selected.value] = solution.value[selected.value];
  mark(selected.value, "hint");
}
</script>

<template>
  <div class="game-panel">
    <div class="score-row">
      <div class="score-box"><strong>{{ mistakes }}</strong><span>錯誤</span></div>
      <div class="score-box"><strong>{{ complete ? "完成" : "進行中" }}</strong><span>狀態</span></div>
    </div>
    <div class="sudoku-board" :class="{ 'sudoku-board--complete': complete }">
      <button v-for="(value, index) in board" :key="`${index}-${feedback.index === index ? feedback.token : 0}`" class="sudoku-cell" :class="{ fixed: puzzle[index], selected: selected === index, wrong: value && !puzzle[index] && value !== solution[index], 'sudoku-cell--correct': feedback.index === index && feedback.type === 'correct', 'sudoku-cell--wrong': feedback.index === index && feedback.type === 'wrong', 'sudoku-cell--hint': feedback.index === index && feedback.type === 'hint' }" @click="selected = index">
        {{ value || "" }}
      </button>
    </div>
    <div class="number-pad">
      <button v-for="value in 9" :key="value" class="button button--subtle" @click="enter(value)">{{ value }}</button>
      <button class="button button--subtle" @click="enter(0)">⌫</button>
    </div>
    <div class="game-actions">
      <button class="button button--subtle" @click="hint">提示</button>
      <button class="button button--primary" @click="newPuzzle">換題目</button>
    </div>
    <p class="game-hint">先點格子，再輸入數字。紅色是目前填錯，不會阻止你繼續。</p>
  </div>
</template>
