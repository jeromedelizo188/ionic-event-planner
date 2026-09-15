<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
    </ion-tabs>

    <!-- Floating dock: detached pill bar + separate add orb -->
    <div class="sk-dock">
      <ion-tab-bar class="sk-pillbar">
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon :icon="homeOutline"></ion-icon>
        </ion-tab-button>
        <ion-tab-button tab="calendar" href="/tabs/calendar">
          <ion-icon :icon="calendarOutline"></ion-icon>
        </ion-tab-button>
      </ion-tab-bar>

      <button class="sk-orb" @click="goCreate" aria-label="Create event">
        <ion-icon :icon="add"></ion-icon>
      </button>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { IonIcon, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue';
import { add, calendarOutline, homeOutline } from 'ionicons/icons';

const router = useRouter();

function goCreate() {
  router.push('/event/new');
}
</script>

<style scoped>
.sk-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 22px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 14px;
  padding: 0 20px;
  z-index: 1000;
  pointer-events: none;
}

.sk-dock > * {
  pointer-events: auto;
}

/* Detached pill bar */
ion-tab-bar.sk-pillbar {
  width: auto;
  min-width: 180px;
  height: 60px;
  --background: linear-gradient(150deg, var(--sk-glass-level-1), var(--sk-glass-level-2));
  --border: none;
  background: linear-gradient(150deg, var(--sk-glass-level-1), var(--sk-glass-level-2));
  border: 1px solid var(--sk-glass-border);
  border-radius: var(--sk-radius-pill);
  backdrop-filter: var(--sk-panel-blur);
  -webkit-backdrop-filter: var(--sk-panel-blur);
  box-shadow: var(--sk-raised-shadow);
  padding: 0 8px;
}

ion-tab-button {
  --color: #9daf9e;
  --color-selected: var(--sk-accent);
  --ripple-color: var(--sk-accent-tint);
}

ion-tab-button.tab-selected {
  background: var(--sk-accent-tint);
  border-radius: var(--sk-radius-pill);
  margin: 4px;
}

/* Separate solid-green add orb */
.sk-orb {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  font-size: 30px;
  background: radial-gradient(
    circle at 32% 26%,
    #7cc08f,
    var(--ion-color-primary) 62%,
    var(--ion-color-primary-shade)
  );
  box-shadow: 0 10px 24px rgba(88, 167, 111, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.sk-orb:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(88, 167, 111, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.sk-orb:active {
  transform: translateY(1px) scale(0.97);
  box-shadow: 0 4px 12px rgba(88, 167, 111, 0.35);
}
</style>