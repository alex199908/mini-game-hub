<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import GameChrome from "../../components/GameChrome.vue";

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
const notes = ref(Array.from({ length: 81 }, () => []));
const selected = ref(-1);
const mistakes = ref(0);
const noteMode = ref(false);
const feedback = ref({ index: -1, type: "", token: 0 });
const complete = computed(() => board.value.every((value, index) => value === solution.value[index]));
const selectedValue = computed(() => selected.value >= 0 ? board.value[selected.value] : 0);
const stats = computed(() => [
  { label: "錯誤", value: mistakes.value },
  { label: "剩餘", value: board.value.filter((value) => !value).length },
  { label: "輸入", value: noteMode.value ? "筆記" : "答案" }
]);

function newPuzzle() {
  puzzleIndex.value = (puzzleIndex.value + 1) % puzzles.length;
  board.value = [...puzzle.value];
  notes.value = Array.from({ length: 81 }, () => []);
  selected.value = -1; mistakes.value = 0; noteMode.value = false;
  feedback.value = { index: -1, type: "", token: feedback.value.token + 1 };
}
function mark(index, type) { feedback.value = { index, type, token: feedback.value.token + 1 }; }
function isPeer(index) {
  if (selected.value < 0 || index === selected.value) return false;
  const row = Math.floor(index / 9); const col = index % 9;
  const selectedRow = Math.floor(selected.value / 9); const selectedCol = selected.value % 9;
  return row === selectedRow || col === selectedCol || (Math.floor(row / 3) === Math.floor(selectedRow / 3) && Math.floor(col / 3) === Math.floor(selectedCol / 3));
}
function toggleNote(value) {
  if (selected.value < 0 || puzzle.value[selected.value] !== 0 || board.value[selected.value]) return;
  const next = notes.value.map((items) => items.slice());
  const current = next[selected.value];
  next[selected.value] = current.includes(value) ? current.filter((item) => item !== value) : [...current, value].sort();
  notes.value = next;
}
function enter(value) {
  if (selected.value < 0 || puzzle.value[selected.value] !== 0 || complete.value) return;
  if (noteMode.value && value) { toggleNote(value); return; }
  board.value[selected.value] = value;
  notes.value[selected.value] = [];
  const isWrong = value && value !== solution.value[selected.value];
  if (isWrong) mistakes.value += 1;
  mark(selected.value, value === 0 ? "clear" : isWrong ? "wrong" : "correct");
}
function hint() {
  if (selected.value < 0 || puzzle.value[selected.value] !== 0 || board.value[selected.value] === solution.value[selected.value]) return;
  board.value[selected.value] = solution.value[selected.value];
  notes.value[selected.value] = [];
  mark(selected.value, "hint");
}
function keydown(event) {
  if (/^[1-9]$/.test(event.key)) { enter(Number(event.key)); event.preventDefault(); }
  else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") { enter(0); event.preventDefault(); }
  else if (event.key.toLowerCase() === "n") { noteMode.value = !noteMode.value; }
  else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    if (selected.value < 0) selected.value = 0;
    else {
      const delta = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[event.key];
      const next = selected.value + delta;
      if (next >= 0 && next < 81 && !(event.key === "ArrowLeft" && selected.value % 9 === 0) && !(event.key === "ArrowRight" && selected.value % 9 === 8)) selected.value = next;
    }
    event.preventDefault();
  }
}

onMounted(() => window.addEventListener("keydown", keydown));
onBeforeUnmount(() => window.removeEventListener("keydown", keydown));
</script>

<template>
  <GameChrome :status="complete ? '盤面完成' : selected >= 0 ? (noteMode ? '筆記模式' : '輸入答案') : '選一個格子'" :tone="complete ? 'success' : selected >= 0 ? 'active' : 'neutral'" :stats="stats">
    <div class="sudoku-board" :class="{ 'sudoku-board--complete': complete }">
      <button
        v-for="(value, index) in board"
        :key="`${index}-${feedback.index === index ? feedback.token : 0}`"
        class="sudoku-cell"
        :class="{
          fixed: puzzle[index], selected: selected === index, 'is-peer': isPeer(index), 'is-same': selectedValue && value === selectedValue && selected !== index,
          wrong: value && !puzzle[index] && value !== solution[index],
          'sudoku-cell--correct': feedback.index === index && feedback.type === 'correct',
          'sudoku-cell--wrong': feedback.index === index && feedback.type === 'wrong',
          'sudoku-cell--hint': feedback.index === index && feedback.type === 'hint'
        }"
        @click="selected = index"
      >
        <template v-if="value">{{ value }}</template>
        <span v-else-if="notes[index].length" class="sudoku-notes"><span v-for="digit in 9" :key="digit">{{ notes[index].includes(digit) ? digit : '' }}</span></span>
      </button>
    </div>

    <template #primary>
      <div class="number-pad">
        <button v-for="value in 9" :key="value" class="button button--subtle" @click="enter(value)">{{ value }}</button>
        <button class="button button--subtle" @click="enter(0)">⌫</button>
      </div>
    </template>
    <template #secondary>
      <button class="button" :class="{ 'button--primary': noteMode }" @click="noteMode = !noteMode">筆記 N</button>
      <button class="button button--subtle" :disabled="selected < 0" @click="hint">提示</button>
      <button class="button button--subtle" @click="newPuzzle">換題</button>
    </template>
    <template #hint>選格後會同時高亮同行、同列、同宮與相同數字。鍵盤可直接輸入，N 切換候選筆記，方向鍵移動選取。</template>
  </GameChrome>
</template>
