<script setup>
const props = defineProps({
  status: { type: String, default: "進行中" },
  tone: { type: String, default: "neutral" },
  stats: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false }
});
</script>

<template>
  <section class="game-chrome" :class="{ 'is-busy': busy }">
    <header class="game-hud">
      <div class="game-status" :data-tone="tone" aria-live="polite">
        <span class="game-status__dot" aria-hidden="true" />
        <span>{{ status }}</span>
      </div>
      <div class="game-stats" v-if="stats.length">
        <div v-for="item in stats" :key="item.label" class="game-stat">
          <strong>{{ item.value }}</strong>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </header>

    <div class="game-stage">
      <slot />
    </div>

    <footer class="game-control-deck">
      <div class="game-control-deck__primary"><slot name="primary" /></div>
      <div class="game-control-deck__secondary"><slot name="secondary" /></div>
    </footer>

    <div class="game-instruction"><slot name="hint" /></div>
  </section>
</template>
