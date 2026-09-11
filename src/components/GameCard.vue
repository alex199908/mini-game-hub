<script setup>
defineProps({ game: { type: Object, required: true }, index: { type: Number, default: 0 } });
defineEmits(["select"]);
</script>

<template>
  <button class="game-card" :style="{ '--card-index': index }" :class="[`accent-${game.accent}`, { locked: game.status !== 'ready' }]" @click="$emit('select', game)">
    <span class="game-card__icon" aria-hidden="true">{{ game.icon }}</span>
    <span class="game-card__meta">{{ game.category }}</span>
    <span class="game-card__title">{{ game.title }}</span>
    <span class="game-card__description">{{ game.description }}</span>
    <span class="game-card__status">{{ game.status === "ready" ? "PLAY" : "SOON" }}</span>
  </button>
</template>
