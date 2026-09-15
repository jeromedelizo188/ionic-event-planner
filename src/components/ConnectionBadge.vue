<template>
  <span class="conn-badge" :class="stateClass" @click="showInfo">
    <span class="dot"></span>
    <span class="label">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { alertController } from '@ionic/vue';
import { connectionError, connectionState, refreshConnection } from '@/firebase';

const state = connectionState;

const label = computed(() => {
  switch (state.value) {
    case 'connected':
      return 'Live DB';
    case 'connecting':
      return 'Connecting';
    case 'disconnected':
      return 'Offline';
    case 'blocked':
      return 'Rules blocked';
    default:
      return 'Demo data';
  }
});

const stateClass = computed(() => {
  switch (state.value) {
    case 'connected':
      return 'is-connected';
    case 'connecting':
      return 'is-connecting';
    case 'disconnected':
      return 'is-offline';
    case 'blocked':
      return 'is-blocked';
    default:
      return 'is-demo';
  }
});

async function showInfo() {
  await refreshConnection();
  const status = state.value;
  const detail = connectionError.value;

  let header = 'Database Status';
  let message = detail;

  switch (status) {
    case 'connected':
      header = 'Connected';
      message = 'Firebase Realtime Database is reachable and accepting reads and writes.';
      break;
    case 'connecting':
      header = 'Checking';
      message = 'Testing access to the database...';
      break;
    case 'disconnected':
      header = 'Offline';
      message = detail || 'No connection to the Firebase servers. Check your internet connection.';
      break;
    case 'blocked':
      header = 'Database Rules Blocking Access';
      message =
        (detail ? `${detail}\n\n` : '') +
        'The app signs in anonymously. In the Firebase console, enable it under ' +
        'Authentication > Sign-in method > Anonymous, then set Realtime Database > Rules to:\n' +
        '{ "rules": { ".read": "auth != null", ".write": "auth != null" } }\n\n' +
        'For a public test-mode database instead, use:\n{ "rules": { ".read": true, ".write": true } }';
      break;
    case 'not-configured':
      header = 'Not Configured';
      message = 'No Firebase credentials found in .env. Add your apiKey and databaseURL, then restart the dev server.';
      break;
  }

  const alert = await alertController.create({
    header,
    message,
    buttons: [
      { text: 'Close', role: 'cancel' },
      ...(status !== 'not-configured' ? [{ text: 'Re-check', handler: () => void refreshConnection() }] : []),
    ],
  });
  await alert.present();
}
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
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
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

.is-connecting .dot,
.is-blocked .dot {
  background: #d7c36a;
}

.is-connecting .dot {
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