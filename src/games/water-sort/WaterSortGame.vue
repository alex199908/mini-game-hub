<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import GameChrome from "../../components/GameChrome.vue";

const capacity = 4;
const colors = { coral: "#ff765f", blue: "#789bff", mint: "#56bd9b", amber: "#e0aa50", violet: "#9580ff" };
const initial = [["coral", "blue", "amber", "violet"], ["violet", "amber", "blue", "coral"], ["amber", "coral", "violet", "blue"], ["blue", "violet", "coral", "amber"], [], []];
const tubes = ref(clone(initial));
const selected = ref(-1);
const history = ref([]);
const pouring = ref({ source: -1, target: -1, token: 0 });
const invalid = ref({ index: -1, token: 0 });
const candidate = ref(-1);
const drag = ref({ active: false, source: -1, pointerId: null, startX: 0, startY: 0, dx: 0, dy: 0 });
let pourTimer;
const complete = computed(() => tubes.value.every((tube) => tube.length === 0 || (tube.length === capacity && tube.every((color) => color === tube[0]))));
const stats = computed(() => [{ label: "步數", value: history.value.length }, { label: "完成管", value: tubes.value.filter((tube) => tube.length === capacity && tube.every((c) => c === tube[0])).length }]);

function clone(value) { return value.map((tube) => tube.slice()); }
function clearPour() { window.clearTimeout(pourTimer); pouring.value = { source: -1, target: -1, token: pouring.value.token }; }
function reset() { clearPour(); tubes.value = clone(initial); selected.value = -1; history.value = []; candidate.value = -1; }
function undo() { const previous = history.value.pop(); if (previous) tubes.value = previous; selected.value = -1; clearPour(); }
function topRun(source) {
  if (!source.length) return { color: null, amount: 0 };
  const color = source.at(-1); let amount = 0;
  for (let cursor = source.length - 1; cursor >= 0 && source[cursor] === color; cursor -= 1) amount += 1;
  return { color, amount };
}
function validTarget(sourceIndex, targetIndex) {
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return false;
  const source = tubes.value[sourceIndex]; const target = tubes.value[targetIndex];
  if (!source.length || target.length >= capacity) return false;
  const { color } = topRun(source);
  return !target.length || target.at(-1) === color;
}
function pour(sourceIndex, targetIndex) {
  if (!validTarget(sourceIndex, targetIndex)) {
    invalid.value = { index: targetIndex >= 0 ? targetIndex : sourceIndex, token: invalid.value.token + 1 };
    return false;
  }
  const source = tubes.value[sourceIndex]; const target = tubes.value[targetIndex];
  const { amount } = topRun(source); const count = Math.min(amount, capacity - target.length);
  history.value.push(clone(tubes.value));
  for (let i = 0; i < count; i += 1) target.push(source.pop());
  clearPour();
  pouring.value = { source: sourceIndex, target: targetIndex, token: pouring.value.token + 1 };
  pourTimer = window.setTimeout(clearPour, 520);
  selected.value = -1;
  return true;
}
function tapTube(index) {
  if (complete.value) return;
  if (selected.value < 0) { if (tubes.value[index].length) selected.value = index; return; }
  if (selected.value === index) { selected.value = -1; return; }
  pour(selected.value, index);
}
function targetAt(x, y, source) {
  const elements = document.elementsFromPoint(x, y);
  const element = elements.find((item) => item?.dataset?.tubeIndex !== undefined && Number(item.dataset.tubeIndex) !== source);
  return element ? Number(element.dataset.tubeIndex) : -1;
}
function pointerDown(index, event) {
  if (complete.value) return;
  if (!tubes.value[index].length) { if (selected.value >= 0) tapTube(index); return; }
  drag.value = { active: true, source: index, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0 };
  event.currentTarget.setPointerCapture?.(event.pointerId);
}
function pointerMove(event) {
  if (!drag.value.active || drag.value.pointerId !== event.pointerId) return;
  drag.value.dx = event.clientX - drag.value.startX;
  drag.value.dy = event.clientY - drag.value.startY;
  const next = targetAt(event.clientX, event.clientY, drag.value.source);
  candidate.value = validTarget(drag.value.source, next) ? next : -1;
}
function pointerUp(event) {
  if (!drag.value.active || drag.value.pointerId !== event.pointerId) return;
  const source = drag.value.source;
  const distance = Math.hypot(drag.value.dx, drag.value.dy);
  const target = targetAt(event.clientX, event.clientY, source);
  try { event.currentTarget.releasePointerCapture?.(event.pointerId); } catch {}
  drag.value = { active: false, source: -1, pointerId: null, startX: 0, startY: 0, dx: 0, dy: 0 };
  candidate.value = -1;
  if (distance < 10) tapTube(source);
  else pour(source, target);
}
function tubeStyle(index) {
  if (!drag.value.active || drag.value.source !== index) return {};
  const tilt = Math.max(-18, Math.min(18, drag.value.dx / 12));
  return { "--tube-x": `${drag.value.dx}px`, "--tube-y": `${drag.value.dy}px`, "--tube-tilt": `${tilt}deg` };
}

onBeforeUnmount(clearPour);
</script>

<template>
  <GameChrome :status="complete ? '顏色整理完成' : drag.active ? '拖到目標試管' : selected >= 0 ? '選擇目標試管' : '拖曳或點選試管'" :tone="complete ? 'success' : drag.active || selected >= 0 ? 'active' : 'neutral'" :stats="stats">
    <div class="tubes">
      <button
        v-for="(tube, index) in tubes"
        :key="`${index}-${pouring.token}-${invalid.index === index ? invalid.token : 0}`"
        class="tube"
        :data-tube-index="index"
        :style="tubeStyle(index)"
        :class="{
          selected: selected === index,
          'tube--dragging': drag.active && drag.source === index,
          'tube--candidate': candidate === index,
          'tube--source': pouring.source === index,
          'tube--target': pouring.target === index,
          'tube--invalid': invalid.index === index,
          'tube--complete': tube.length === capacity && tube.every((color) => color === tube[0])
        }"
        @pointerdown="pointerDown(index, $event)"
        @pointermove="pointerMove"
        @pointerup="pointerUp"
        @pointercancel="pointerUp"
      >
        <span v-for="(color, colorIndex) in tube" :key="`${colorIndex}-${color}`" class="water" :style="{ '--c': colors[color] }" />
      </button>
    </div>

    <template #primary>
      <button class="button button--subtle" :disabled="!history.length" @click="undo">Undo</button>
      <button class="button button--primary" @click="reset">重新開始</button>
    </template>
    <template #secondary><span class="interaction-chip">拖曳試管直接倒水</span><span class="interaction-chip">點兩下也能操作</span></template>
    <template #hint>拖曳中的試管會跟手、合法目標會浮起高亮；放到錯的地方會回彈。桌面與手機都用同一套直接操作。</template>
  </GameChrome>
</template>
