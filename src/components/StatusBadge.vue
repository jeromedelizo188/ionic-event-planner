<template>
  <span class="sk-badge" :style="badgeStyle">{{ displayStatus }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ status: string }>();

const statusColors: Record<string, { top: string; bottom: string }> = {
  upcoming: { top: '#7cc08f', bottom: '#3f9e63' },
  ongoing: { top: '#b3c46a', bottom: '#7fa34b' },
  completed: { top: '#5bbf7d', bottom: '#2e8b57' },
  cancelled: { top: '#a5ad8a', bottom: '#8b9370' },
};

const badgeStyle = computed(() => {
  const colors = statusColors[props.status.toLowerCase()] ?? {
    top: '#a5ad8a',
    bottom: '#8b9370',
  };
  return {
    background: `linear-gradient(180deg, ${colors.top}, ${colors.bottom})`,
    color: '#fff',
  };
});

const displayStatus = computed(() =>
  props.status.charAt(0).toUpperCase() + props.status.slice(1)
);
</script>
