<script setup>
import { computed, ref } from "vue";

const capacity = 4;
const colors = { coral: "#ff765f", blue: "#789bff", mint: "#56bd9b", amber: "#e0aa50", violet: "#9580ff" };
const initial = [["coral", "blue", "amber", "violet"], ["violet", "amber", "blue", "coral"], ["amber", "coral", "violet", "blue"], ["blue", "violet", "coral", "amber"], [], []];
const tubes = ref(clone(initial));
const selected = ref(-1);
const history = ref([]);
const complete = computed(() => tubes.value.every((tube) => tube.length === 0 || (tube.length === capacity && tube.every((color) => color === tube[0]))));

function clone(value) { return value.map((tube) => tube.slice()); }
function reset() { tubes.value = clone(initial); selected.value = -1; history.value = []; }
function undo() { const previous = history.value.pop(); if (previous) tubes.value = previous; selected.value = -1; }

function clickTube(index) {
  if (complete.value) return;
  if (selected.value < 0) {
    if (tubes.value[index].length) selected.value = index;
    return;
  }
  if (selected.value === index) { selected.value = -1; return; }
  const source = tubes.value[selected.value];
  const target = tubes.value[index];
  const color = source.at(-1);
  let amount = 0;
  for (let cursor = source.length - 1; cursor >= 0 && source[cursor] === color; cursor -= 1) amount += 1;
  const available = capacity - target.length;
  if (available > 0 && (!target.length || target.at(-1) === color)) {
    history.value.push(clone(tubes.value));
    const count = Math.min(amount, available);
    for (let countIndex = 0; countIndex < count; countIndex += 1) target.push(source.pop());
  }
  selected.value = -1;
}
</script>

<template>
  <div class="game-panel">
    <div class="score-row"><div class="score-box"><strong>{{ complete ? "完成" : "整理中" }}</strong><span>狀態</span></div><div class="score-box"><strong>{{ history.length }}</strong><span>步數</span></div></div>
    <div class="tubes">
      <button v-for="(tube, index) in tubes" :key="index" class="tube" :class="{ selected: selected === index }" @click="clickTube(index)">
        <span v-for="(color, colorIndex) in tube" :key="colorIndex" class="water" :style="{ '--c': colors[color] }" />
      </button>
    </div>
    <div class="game-actions"><button class="button button--subtle" :disabled="!history.length" @click="undo">Undo</button><button class="button button--primary" @click="reset">重置</button></div>
    <p class="game-hint">點來源試管，再點目標試管。只能倒到空管或相同顏色上方。</p>
  </div>
</template>
