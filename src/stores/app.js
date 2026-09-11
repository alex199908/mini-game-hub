import { defineStore } from "pinia";
import { ref, watch } from "vue";

const THEME_KEY = "mini-game-hub-theme";

export const useAppStore = defineStore("app", () => {
  const theme = ref(localStorage.getItem(THEME_KEY) || "dark");

  watch(theme, (value) => {
    localStorage.setItem(THEME_KEY, value);
    document.documentElement.dataset.theme = value;
  }, { immediate: true });

  function toggleTheme() {
    theme.value = theme.value === "dark" ? "light" : "dark";
  }

  return { theme, toggleTheme };
});
