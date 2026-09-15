<template>
  <span class="conn-badge" :class="stateClass">
    <span class="dot"></span>
    <span class="label">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { connectionState } from '@/firebase';

const label = computed(() => {
  switch (connectionState.value) {
    case 'connected':
      return 'Live DB';
    case 'connecting':
      return 'Connecting';
    case 'disconnected':
      return 'Offline';
    default:
      return 'Demo data';
  }
});

const stateClass = computed(() => {
  switch (connectionState.value) {
    case 'connected':
      return 'is-connected';
    case 'connecting':
      return 'is-connecting';
    case 'disconnected':
      return 'is-offline';
    default:
      return 'is-demo';
  }
});
</script>

<style scoped>
.conn-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--sk-radius-pill);
  background: var(--sk-glass-level-2);
  border: 1px solid var(--sk-glass-border);
  backdrop-filter: var(--sk-panel-blur);
  -webkit-backdrop-filter: var(--sk-panel-blur);
  box-shadow: var(--sk-raised-soft);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #b8b8b8;
}

.label {
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sk-text-light);
  white-space: nowrap;
}

.is-connected .dot {
  background: #3f9e63;
  box-shadow: 0 0 6px rgba(63, 158, 99, 0.7);
}

.is-connecting .dot {
  background: #d7c36a;
  animation: sk-pulse 1s ease-in-out infinite;
}

.is-offline .dot {
  background: #cf6454;
}

.is-demo .dot {
  background: #b8b8b8;
}

@keyframes sk-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}
</style>