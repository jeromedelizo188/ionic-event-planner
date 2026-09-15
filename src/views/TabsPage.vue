<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
    </ion-tabs>

    <!-- Floating dock: detached pill bar + separate add orb -->
    <div class="sk-dock">
      <div class="sk-pillbar">
        <button
          class="dock-tab"
          :class="{ active: currentTab === 'home' }"
          @click.prevent="goTab('home')"
          aria-label="Home"
        >
          <i class="fa-solid fa-house"></i>
        </button>
        <button
          class="dock-tab"
          :class="{ active: currentTab === 'calendar' }"
          @click.prevent="goTab('calendar')"
          aria-label="Calendar"
        >
          <i class="fa-solid fa-calendar-days"></i>
        </button>
      </div>

      <button class="sk-orb" @click="goCreate" aria-label="Create event">
        <i class="fa-solid fa-plus"></i>
      </button>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonPage, IonRouterOutlet, IonTabs } from '@ionic/vue';

const router = useRouter();
const route = useRoute();

const currentTab = computed(() =>
  route.path.startsWith('/tabs/calendar') ? 'calendar' : 'home'
);

function goTab(tab: string) {
  router.push(tab === 'calendar' ? '/tabs/calendar' : '/tabs/home');
}

function goCreate() {
  router.push('/event/new');
}
</script>

<style scoped>
.sk-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 18px;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  padding: 0 20px;
  z-index: 800;
  pointer-events: none;
}

.sk-dock > * {
  pointer-events: auto;
}

/* Detached pill bar */
.sk-pillbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 168px;
  height: 52px;
  padding: 0 8px;
  background: var(--sk-dock-bg);
  border: 1px solid var(--sk-dock-border);
  border-radius: var(--sk-radius-pill);
  box-shadow: var(--sk-raised-shadow);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
}

.dock-tab {
  border: none;
  background: transparent;
  width: 44px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--sk-radius-pill);
  color: var(--sk-text-muted);
  font-size: 18px;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    transform 0.14s ease;
}

.dock-tab.active {
  background: var(--sk-accent-tint);
  color: var(--sk-accent-shade);
  font-weight: 800;
}

html.dark .dock-tab.active {
  color: var(--sk-lime);
}

.dock-tab:active {
  transform: scale(0.92);
}

/* Separate tri-accent add orb */
.sk-orb {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ffffff;
  font-size: 20px;
  background: linear-gradient(
    135deg,
    var(--sk-lime-deep) 0%,
    var(--sk-amber-deep) 55%,
    var(--sk-coral-deep) 100%
  );
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.sk-orb:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.sk-orb:active {
  transform: translateY(1px) scale(0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.24);
}
</style>