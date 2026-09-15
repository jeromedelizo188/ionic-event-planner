<template>
  <button
    class="theme-toggle"
    type="button"
    role="switch"
    :aria-checked="isDark"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggleTheme()"
  >
    <span class="tt-track" :class="{ on: isDark }">
      <span class="tt-thumb">
        <i class="fa-solid fa-sun tt-sun"></i>
        <i class="fa-solid fa-moon tt-moon"></i>
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

const { isDark, toggleTheme } = useTheme();
</script>

<style scoped>
.theme-toggle {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tt-track {
  position: relative;
  width: 48px;
  height: 28px;
  border-radius: var(--sk-radius-pill);
  background: var(--sk-chip-bg);
  border: 1px solid var(--sk-border);
  display: inline-block;
  transition: background-color 0.2s ease;
}

.tt-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--sk-surface);
  box-shadow: var(--sk-raised-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sk-amber-deep);
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tt-track.on {
  background: var(--sk-surface-2);
}

.tt-track.on .tt-thumb {
  transform: translateX(20px);
  color: var(--sk-accent);
}

.tt-thumb i {
  font-size: 12px;
  line-height: 1;
  position: absolute;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.tt-sun {
  opacity: 1;
  transform: none;
}
.tt-track.on .tt-sun {
  opacity: 0;
  transform: rotate(30deg) scale(0.6);
}
.tt-moon {
  opacity: 0;
  transform: rotate(-30deg) scale(0.6);
}
.tt-track.on .tt-moon {
  opacity: 1;
  transform: none;
}
</style>