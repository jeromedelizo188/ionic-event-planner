<template>
  <span class="status-badge" :class="`is-${status}`">
    <span class="sc-dot"></span>
    {{ status }}
  </span>
</template>

<script setup lang="ts">
defineProps<{ status: string }>();
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 11px;
  border-radius: var(--sk-radius-pill);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ffffff;
  background: var(--sk-lime-deep);
  white-space: nowrap;
}

.sc-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
}

.is-upcoming {
  background: var(--sk-lime-deep);
}

.is-ongoing {
  background: var(--sk-amber-deep);
}

.is-completed {
  background: var(--sk-coral-deep);
}

.is-cancelled {
  background: var(--sk-chip-bg);
  color: var(--sk-chip-text);
}

.is-cancelled .sc-dot {
  background: var(--sk-text-muted);
}
</style>