<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Calendar</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="loading" class="loading">
        <ion-spinner name="crescent" />
      </div>

      <div v-else class="cal-wrap">
        <div v-if="loadError" class="sk-panel error-panel">
          <p class="error-text">{{ loadError }}</p>
          <ion-button size="small" fill="solid" class="error-retry" @click="loadEvents">
            Retry
          </ion-button>
        </div>

        <div class="sk-panel cal-panel">
          <div class="cal-head">
            <ion-button
              fill="clear"
              class="cal-nav"
              @click="shiftMonth(-1)"
              aria-label="Previous month"
            >
              <ion-icon slot="icon-only" :icon="chevronBack"></ion-icon>
            </ion-button>
            <div class="cal-title">
              <span class="title-light">{{ monthLight }}</span>
              <span class="title-bold">{{ monthBold }}</span>
            </div>
            <ion-button
              fill="clear"
              class="cal-nav"
              @click="shiftMonth(1)"
              aria-label="Next month"
            >
              <ion-icon slot="icon-only" :icon="chevronForward"></ion-icon>
            </ion-button>
          </div>

          <div class="cal-today-row">
            <ion-button
              v-if="!isCurrentMonth"
              fill="solid"
              size="small"
              class="cal-today-btn"
              @click="goToday"
            >
              Today
            </ion-button>
          </div>

          <div class="cal-weekdays">
            <span v-for="day in WEEKDAYS" :key="day">{{ day }}</span>
          </div>

          <div class="cal-grid">
            <div
              v-for="(cell, i) in gridCells"
              :key="i"
              class="cal-cell"
              :class="{ 'is-empty': cell.empty, 'is-today': cell.today }"
            >
              <template v-if="!cell.empty">
                <button
                  class="cal-day"
                  :class="{ 'has-events': cell.events.length > 0, selected: isSelected(cell) }"
                  @click="selectDay(cell)"
                >
                  {{ cell.day }}
                </button>
                <div class="cal-dots">
                  <span
                    v-for="event in cell.events.slice(0, 3)"
                    :key="event.id"
                    :class="['dot', `dot--${event.status}`]"
                  ></span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Selected day events -->
        <div v-if="selectedEvents.length" class="sk-panel day-panel">
          <h3 class="day-panel-title sk-title">{{ selectedLabel }}</h3>
          <div
            v-for="event in selectedEvents"
            :key="event.id"
            class="sk-panel sk-press day-event"
            @click="goTo(`/event/${event.id}`)"
          >
            <div>
              <p class="event-name sk-title">{{ event.name }}</p>
              <p class="event-time">{{ formatTime(event.eventTimestamp) }}</p>
            </div>
            <StatusBadge :status="event.status" />
          </div>
        </div>

        <div v-else-if="selectedKey" class="sk-panel day-panel">
          <h3 class="day-panel-title sk-title">{{ selectedLabel }}</h3>
          <p class="no-events">No events this day.</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { chevronBack, chevronForward } from 'ionicons/icons';
import type { EventItem } from '@/types/event';
import {
  eventsLoaded,
  liveEvents,
  liveEventsError,
  refreshNow,
  startEventsListening,
} from '@/services/eventService';
import { dateKey, startOfDay, WEEKDAYS } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge.vue';

interface DayCell {
  day: number;
  key: string;
  empty: boolean;
  today: boolean;
  events: EventItem[];
}

const router = useRouter();

const loading = computed(() => !eventsLoaded.value);
const events = liveEvents;
const loadError = liveEventsError;
const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth());
const selectedKey = ref<string | null>(null);

const eventsByDay = computed(() => {
  const map = new Map<string, EventItem[]>();
  for (const event of events.value) {
    const key = dateKey(event.eventTimestamp);
    const bucket = map.get(key) ?? [];
    bucket.push(event);
    map.set(key, bucket);
  }
  for (const bucket of map.values()) {
    bucket.sort((a, b) => a.eventTimestamp - b.eventTimestamp);
  }
  return map;
});

const monthBold = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1).toLocaleString(undefined, { month: 'long' })
);

const monthLight = computed(() => String(viewYear.value));

const isCurrentMonth = computed(() => {
  const now = new Date();
  return viewYear.value === now.getFullYear() && viewMonth.value === now.getMonth();
});

const gridCells = computed<DayCell[]>(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate();
  const todayKey = dateKey(startOfDay(new Date()).getTime());
  const cells: DayCell[] = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push({ day: 0, key: '', empty: true, today: false, events: [] });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(viewYear.value, viewMonth.value, day);
    const key = dateKey(date.getTime());
    cells.push({
      day,
      key,
      empty: false,
      today: key === todayKey,
      events: eventsByDay.value.get(key) ?? [],
    });
  }
  return cells;
});

const selectedEvents = computed(() =>
  selectedKey.value ? eventsByDay.value.get(selectedKey.value) ?? [] : []
);

const selectedLabel = computed(() => {
  const parts = selectedKey.value?.split('-') ?? [];
  if (parts.length !== 3) return '';
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).toLocaleString(
    undefined,
    { weekday: 'long', month: 'long', day: 'numeric' }
  );
});

function isSelected(cell: DayCell) {
  return cell.key === selectedKey.value;
}

function selectDay(cell: DayCell) {
  selectedKey.value = cell.key;
}

function shiftMonth(delta: number) {
  const d = new Date(viewYear.value, viewMonth.value + delta, 1);
  viewYear.value = d.getFullYear();
  viewMonth.value = d.getMonth();
}

function goToday() {
  const now = new Date();
  viewYear.value = now.getFullYear();
  viewMonth.value = now.getMonth();
  selectedKey.value = dateKey(startOfDay(now).getTime());
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function goTo(path: string) {
  router.push(path);
}

async function loadEvents() {
  await refreshNow();
  startEventsListening();
}

async function onRefresh(event: { target: { complete: () => void } }) {
  await loadEvents();
  event.target.complete();
}

onIonViewWillEnter(loadEvents);

onMounted(loadEvents);
</script>

<style scoped>
.loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.error-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-color: rgba(207, 100, 84, 0.35);
  background: rgba(255, 240, 236, 0.55);
}

.error-text {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 500;
  color: #a4473a;
  line-height: 1.4;
}

.error-retry {
  --border-radius: var(--sk-radius-pill);
  --background: #cf6454;
  font-weight: 700;
  flex-shrink: 0;
}

.cal-wrap {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cal-panel {
  padding: 12px;
}

.cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.cal-title {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}

.title-light {
  font-weight: 300;
  font-size: 0.95rem;
  color: var(--sk-text-light);
}

.title-bold {
  font-weight: 800;
  font-size: 1.35rem;
  color: var(--sk-text);
  line-height: 1;
}

.cal-today-row {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.cal-today-btn {
  --background: var(--sk-accent-tint);
  --color: var(--sk-accent);
  --border-radius: var(--sk-radius-pill);
  --box-shadow: none;
  font-size: 0.72rem;
  font-weight: 700;
  height: 28px;
}

.cal-nav {
  --color: var(--sk-text-light);
  font-size: 1.3rem;
  margin: 0;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 6px;
}

.cal-weekdays span {
  text-align: center;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sk-text-muted);
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.cal-cell {
  min-height: 42px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3px 0;
}

.cal-cell.is-empty {
  visibility: hidden;
}

.cal-day {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--sk-text);
  background: var(--sk-glass-level-3);
  border: 1px solid var(--sk-glass-border);
  backdrop-filter: var(--sk-panel-blur);
  -webkit-backdrop-filter: var(--sk-panel-blur);
  box-shadow: var(--sk-raised-soft);
  cursor: pointer;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    background 0.12s ease;
}

.cal-day:hover {
  transform: translateY(-1px);
}

.cal-day:active {
  transform: translateY(1px) scale(0.96);
  box-shadow: var(--sk-pressed-shadow);
}

.cal-day.selected {
  color: #fff;
  background: linear-gradient(150deg, #7cc08f, var(--ion-color-primary) 65%, var(--sk-accent-shade));
  border: none;
  box-shadow: 0 6px 16px rgba(88, 167, 111, 0.4);
}

.cal-cell.is-today .cal-day:not(.selected) {
  border: 2px solid var(--sk-accent);
  font-weight: 800;
}

.cal-dots {
  display: flex;
  gap: 3px;
  margin-top: 2px;
  min-height: 6px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
}

.dot--upcoming {
  background: #3b82f6;
}
.dot--ongoing {
  background: #f59e0b;
}
.dot--completed {
  background: #22c55e;
}
.dot--cancelled {
  background: #ef4444;
}

/* Selected day events */
.day-panel {
  padding: 14px;
}

.day-panel-title {
  font-size: 1rem;
  margin: 0 0 10px;
}

.day-event {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
}

.event-name {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
}

.event-time {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: var(--sk-text-muted);
}

.no-events {
  color: var(--sk-text-muted);
  font-size: 0.85rem;
  text-align: center;
  margin: 6px 0 0;
}
</style>