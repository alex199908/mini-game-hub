<script setup>
import { computed, ref } from "vue";
import GameChrome from "../../components/GameChrome.vue";

const pairs = [
  { color: "coral", start: [0, 0], end: [4, 0] },
  { color: "blue", start: [0, 4], end: [4, 4] },
  { color: "amber", start: [0, 2], end: [4, 2] }
];
const colors = { coral: "#ff765f", blue: "#789bff", amber: "#e0aa50" };
const boardEl = ref(null);
const paths = ref({});
const active = ref(null);
const origin = ref(null);
const complete = ref([]);
const invalidPulse = ref(0);
const status = computed(() => complete.value.length === pairs.length ? "全部接通" : active.value ? `正在連接 ${active.value}` : `${complete.value.length}/${pairs.length} 已接通`);
const stats = computed(() => [{ label: "連線", value: `${complete.value.length}/${pairs.length}` }, { label: "碰撞", value: invalidPulse.value }]);

function key(row, col) { return `${row}:${col}`; }
function endpoint(row, col) { return pairs.find((pair) => (pair.start[0] === row && pair.start[1] === col) || (pair.end[0] === row && pair.end[1] === col)); }
function owner(row, col) { return Object.entries(paths.value).find(([, path]) => path.some(([r, c]) => r === row && c === col))?.[0]; }
function adjacent(left, right) { return Math.abs(left[0] - right[0]) + Math.abs(left[1] - right[1]) === 1; }
function reset() { paths.value = {}; active.value = null; origin.value = null; complete.value = []; invalidPulse.value = 0; }

function startTrace(row, col, event) {
  const point = endpoint(row, col);
  if (!point) return;
  event?.preventDefault();
  active.value = point.color;
  origin.value = key(row, col);
  paths.value = { ...paths.value, [point.color]: [[row, col]] };
  complete.value = complete.value.filter((color) => color !== point.color);
  boardEl.value?.setPointerCapture?.(event?.pointerId);
}
function extendTo(row, col) {
  if (!active.value) return;
  const color = active.value;
  const path = paths.value[color] || [];
  const last = path.at(-1);
  if (!last || key(...last) === key(row, col)) return;
  const point = endpoint(row, col);
  const occupiedBy = owner(row, col);
  if (!adjacent(last, [row, col]) || (point && point.color !== color) || (occupiedBy && occupiedBy !== color)) {
    invalidPulse.value += 1;
    return;
  }
  const existingIndex = path.findIndex(([r, c]) => r === row && c === col);
  const nextPath = existingIndex >= 0 ? path.slice(0, existingIndex + 1) : [...path, [row, col]];
  paths.value = { ...paths.value, [color]: nextPath };
  if (point?.color === color && key(row, col) !== origin.value) {
    complete.value = [...new Set([...complete.value, color])];
    active.value = null;
    origin.value = null;
  }
}
function pointerMove(event) {
  if (!active.value || !boardEl.value) return;
  const rect = boardEl.value.getBoundingClientRect();
  const col = Math.floor(((event.clientX - rect.left) / rect.width) * 5);
  const row = Math.floor(((event.clientY - rect.top) / rect.height) * 5);
  if (row >= 0 && row < 5 && col >= 0 && col < 5) extendTo(row, col);
}
function pointerUp(event) {
  if (event?.pointerId !== undefined) { try { boardEl.value?.releasePointerCapture?.(event.pointerId); } catch {} }
  active.value = null;
  origin.value = null;
}
function isHot(row, col) {
  const point = endpoint(row, col);
  return Boolean(active.value && point?.color === active.value && key(row, col) !== origin.value);
}
</script>

<template>
  <GameChrome :status="status" :tone="complete.length === pairs.length ? 'success' : active ? 'active' : 'neutral'" :stats="stats">
    <div
      ref="boardEl"
      class="connect-board"
      :class="[{ 'connect-board--complete': complete.length === pairs.length, 'board-2048--shake': invalidPulse % 2 }]"
      @pointermove="pointerMove"
      @pointerup="pointerUp"
      @pointercancel="pointerUp"
    >
      <button
        v-for="index in 25"
        :key="index"
        class="connect-cell"
        :class="{
          endpoint: endpoint(Math.floor((index - 1) / 5), (index - 1) % 5),
          path: owner(Math.floor((index - 1) / 5), (index - 1) % 5),
          'is-tracing': active === (endpoint(Math.floor((index - 1) / 5), (index - 1) % 5)?.color || owner(Math.floor((index - 1) / 5), (index - 1) % 5)),
          'connect-cell--done': complete.includes(endpoint(Math.floor((index - 1) / 5), (index - 1) % 5)?.color),
          'is-hot': isHot(Math.floor((index - 1) / 5), (index - 1) % 5)
        }"
        :style="{ '--c': colors[endpoint(Math.floor((index - 1) / 5), (index - 1) % 5)?.color || owner(Math.floor((index - 1) / 5), (index - 1) % 5)] }"
        @pointerdown="startTrace(Math.floor((index - 1) / 5), (index - 1) % 5, $event)"
      />
    </div>

    <template #primary><button class="button button--primary" @click="reset">重新佈線</button></template>
    <template #secondary><span class="interaction-chip">按住端點直接拖</span></template>
    <template #hint>不再「點一格、點一格、點一格」。從任一同色端點按住拖曳，碰到既有路徑會即時拒絕，拖進另一端就自動吸附完成。</template>
  </GameChrome>
</template>
