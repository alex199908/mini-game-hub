<script setup>
defineProps({
  eyebrow: { type: String, default: "GAME" },
  title: { type: String, required: true },
  subtitle: { type: String, default: "" }
});
defineEmits(["back"]);
</script>

<template>
  <section class="game-shell">
    <header class="game-shell__header">
      <div>
        <p class="eyebrow">{{ eyebrow }}</p>
        <h2>{{ title }}</h2>
        <p class="game-shell__subtitle">{{ subtitle }}</p>
      </div>
      <div class="game-shell__actions">
        <slot name="actions" />
        <button class="button" @click="$emit('back')">回大廳</button>
      </div>
    </header>
    <slot />
  </section>
</template>
