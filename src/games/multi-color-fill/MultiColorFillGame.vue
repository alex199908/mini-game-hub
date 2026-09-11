<script setup>
import { computed, ref } from "vue";
import GameChrome from "../../components/GameChrome.vue";

const palette = ["coral", "blue", "mint", "amber", "violet"];
const colors = { coral: "#ff765f", blue: "#789bff", mint: "#56bd9b", amber: "#e0aa50", violet: "#9580ff" };
const moves = ref(0);
const limit = 18;
const board = ref(makeBoard());
const previewColor = ref(null);
const changedCells = ref(new Set());
const status = computed(() => board.value.every((row) => row.every((color) => color === board.value[0][0])) ? "完成" : moves.value >= limit ? "步數用完" : "選擇下一個顏色");
const tone = computed(() => status.value === "完成" ? "success" : status.value === "步數用完" ? "danger" : previewColor.value ? "active" : "neutral");
const stats = computed(() => [{ label: "步數", value: `${moves.value}/${limit}` }, { label: "剩餘", value: limit - moves.value }, { label: "目前", value: board.value[0][0] }]);
const preview = computed(() => previewColor.value && previewColor.value !== board.value[0][0] ? flood(board.value, previewColor.value) : { board: board.value, changed: new Set() });

function makeBoard() { return Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => palette[(row * 3 + col * 2 + row % 3) % palette.length])); }
function clone(source) { return source.map((row) => row.slice()); }
function flood(source, newColor) {
  const next = clone(source); const oldColor = next[0][0]; const queue = [[0, 0]]; const visited = new Set();
  while (queue.length) {
    const [row, col] = queue.shift(); const key = `${row}:${col}`;
    if (visited.has(key) || next[row]?.[col] !== oldColor) continue;
    visited.add(key); next[row][col] = newColor;
    [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]].forEach(([r, c]) => { if (r >= 0 && r < 8 && c >= 0 && c < 8) queue.push([r, c]); });
  }
  return { board: next, changed: new Set([...visited].map((key) => { const [r, c] = key.split(":").map(Number); return r * 8 + c; })) };
}
function reset() { board.value = makeBoard(); moves.value = 0; previewColor.value = null; changedCells.value = new Set(); }
function fill(newColor) {
  if (status.value !== "選擇下一個顏色" || board.value[0][0] === newColor) return;
  const result = flood(board.value, newColor);
  board.value = result.board; changedCells.value = result.changed; moves.value += 1; previewColor.value = null;
}
</script>

<template>
  <GameChrome :status="status" :tone="tone" :stats="stats">
    <div class="fill-board" :class="{ 'fill-board--complete': status === '完成', 'is-previewing': previewColor }">
      <span
        v-for="(color, index) in preview.board.flat()"
        :key="index"
        class="fill-cell"
        :class="{ 'fill-cell--changed': changedCells.has(index), 'is-preview': preview.changed.has(index) }"
        :style="{ '--c': colors[color], background: colors[color] }"
      />
    </div>

    <template #primary>
      <div class="color-palette">
        <button
          v-for="color in palette"
          :key="color"
          class="palette-dot"
          :class="{ active: board[0][0] === color }"
          :style="{ '--c': colors[color] }"
          :aria-label="`改成 ${color}`"
          @pointerenter="previewColor = color"
          @pointerleave="previewColor = null"
          @focus="previewColor = color"
          @blur="previewColor = null"
          @click="fill(color)"
        />
      </div>
    </template>
    <template #secondary><button class="button button--subtle" @click="reset">重置</button></template>
    <template #hint>滑過或聚焦色票會先預覽這一步實際會吞掉哪些格子，確認後再點。以前那種「按了才知道發生什麼」的猜謎 UX 先丟掉。</template>
  </GameChrome>
</template>
