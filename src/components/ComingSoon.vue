<script setup>
defineProps({ game: { type: Object, required: true } });
</script>

<template>
  <div class="coming-soon">
    <span class="coming-soon__icon">{{ game.icon }}</span>
    <p class="eyebrow">MODULE RESERVED</p>
    <h3>{{ game.title }} 還在施工</h3>
    <p>這個遊戲已經納入架構，但規則引擎尚未接入。先把地基做好，避免後面八款各自長成怪物。</p>
  </div>
</template>
