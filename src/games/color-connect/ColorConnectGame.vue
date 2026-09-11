<script setup>
import { computed, ref } from "vue";

const pairs = [
  { color: "coral", start: [0, 0], end: [4, 0] },
  { color: "blue", start: [0, 4], end: [4, 4] },
  { color: "amber", start: [0, 2], end: [4, 2] }
];
const colors = { coral: "#ff765f", blue: "#789bff", amber: "#e0aa50" };
const paths = ref({});
const active = ref(null);
const complete = ref([]);
const status = computed(() => complete.value.length === pairs.length ? "完成" : `${complete.value.length}/${pairs.length} 完成`);

function key(row, col) { return `${row}:${col}`; }
function endpoint(row, col) { return pairs.find((pair) => pair.start[0] === row && pair.start[1] === col || pair.end[0] === row && pair.end[1] === col); }
function owner(row, col) { return Object.entries(paths.value).find(([, path]) => path.some(([pathRow, pathCol]) => pathRow === row && pathCol === col))?.[0]; }
function adjacent(left, right) { return Math.abs(left[0] - right[0]) + Math.abs(left[1] - right[1]) === 1; }
function reset() { paths.value = {}; active.value = null; complete.value = []; }

function clickCell(row, col) {
  const point = endpoint(row, col);
  if (point) {
    if (!active.value) {
      active.value = point.color;
      paths.value[point.color] = [point.start.slice()];
    } else if (active.value === point.color && paths.value[point.color].at(-1).join(":") === point.end.join(":")) {
      complete.value = [...new Set([...complete.value, point.color])];
      active.value = null;
    }
    return;
  }
  if (!active.value) return;
  const path = paths.value[active.value] || [];
  const last = path.at(-1);
  const existingOwner = owner(row, col);
  if (!adjacent(last, [row, col]) || existingOwner && existingOwner !== active.value) return;
  const currentIndex = path.findIndex(([pathRow, pathCol]) => pathRow === row && pathCol === col);
  paths.value[active.value] = currentIndex >= 0 ? path.slice(0, currentIndex + 1) : [...path, [row, col]];
}
</script>

<template>
  <div class="game-panel">
    <div class="score-row"><div class="score-box"><strong>{{ status }}</strong><span>狀態</span></div></div>
    <div class="connect-board">
      <button v-for="index in 25" :key="index" class="connect-cell" :class="{ endpoint: endpoint(Math.floor((index - 1) / 5), (index - 1) % 5), path: owner(Math.floor((index - 1) / 5), (index - 1) % 5) }" :style="{ '--c': colors[endpoint(Math.floor((index - 1) / 5), (index - 1) % 5)?.color || owner(Math.floor((index - 1) / 5), (index - 1) % 5)] }" @click="clickCell(Math.floor((index - 1) / 5), (index - 1) % 5)" />
    </div>
    <div class="game-actions"><button class="button button--primary" @click="reset">重置</button></div>
    <p class="game-hint">點端點，再點相鄰格子建立路徑，最後點同色終點。路徑不能穿過其他顏色。</p>
  </div>
</template>
