<template>
  <span class="logo-mark" :style="{ width: size + 'px', height: size + 'px' }" aria-hidden="true">
    <i class="fa-solid fa-calendar-days"></i>
    <i class="fa-solid fa-check logo-check"></i>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 36 });
</script>

<style scoped>
.logo-mark {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--sk-lime-deep) 0%,
    var(--sk-amber-deep) 55%,
    var(--sk-coral-deep) 100%
  );
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
  color: #ffffff;
}

.logo-mark i {
  font-size: 0.52em;
  line-height: 1;
}

.logo-check {
  position: absolute;
  bottom: 14%;
  right: 12%;
  font-size: 0.3em;
  background: var(--sk-lime);
  color: var(--sk-on-accent);
  border-radius: 50%;
  padding: 0.12em;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  width: 0.85em;
  height: 0.85em;
}
</style>