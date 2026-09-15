<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <div class="topbar">
          <LogoMark :size="30" />
          <span class="tb-name">Calendar</span>
          <ThemeToggle />
        </div>
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
        <div v-if="loadError" class="error-chip">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span class="error-text">{{ loadError }}</span>
          <button class="error-retry" @click="loadEvents">Retry</button>
        </div>

        <div class="sk-panel cal-panel">
          <div class="cal-head">
            <button class="cal-nav" @click="shiftMonth(-1)" aria-label="Previous month">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <div class="cal-title">
              <span class="title-bold">{{ monthBold }}</span>
              <span class="title-light">{{ monthLight }}</span>
            </div>
            <button class="cal-nav" @click="shiftMonth(1)" aria-label="Next month">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          <div class="cal-today-row">
            <button v-if="!isCurrentMonth" class="cal-today-btn" @click="goToday">
              <i class="fa-solid fa-location-crosshairs"></i> Today
            </button>
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
        <template v-if="selectedKey">
          <h3 class="day-heading">{{ selectedLabel }}</h3>
          <div
            v-for="event in selectedEvents"
            :key="event.id"
            class="ac-card sk-press"
            :class="accentOf(event.status)"
            @click="goTo(`/event/${event.id}`)"
          >
            <div class="day-event">
              <div class="de-icon">
                <i class="fa-solid fa-calendar-day"></i>
              </div>
              <div class="de-body">
                <p class="event-name">{{ event.name }}</p>
                <p class="event-time">{{ formatTime(event.eventTimestamp) }}</p>
              </div>
              <StatusBadge :status="event.status" />
            </div>
          </div>

          <div v-if="selectedEvents.length === 0" class="sk-panel no-events-card">
            <i class="fa-solid fa-mug-hot no-events-icon"></i>
            <p class="no-events">No events this day.</p>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonContent, IonHeader, IonPage, IonRefresher, IonRefresherContent, IonSpinner, IonToolbar, onIonViewWillEnter } from '@ionic/vue';
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
import ThemeToggle from '@/components/ThemeToggle.vue';
import LogoMark from '@/components/LogoMark.vue';

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

function accentOf(status: string): string {
  switch (status) {
    case 'ongoing':
      return 'is-amber';
    case 'completed':
      return 'is-coral';
    case 'cancelled':
      return 'is-grey';
    default:
      return 'is-lime';
  }
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
.topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 8px;
}

.tb-name {
  margin-right: auto;
  font-size: 1.05rem;
  font-weight: 900;
  color: var(--sk-text);
  letter-spacing: -0.01em;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.error-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: var(--sk-radius-pill);
  background: var(--sk-red-tint);
  border: 1px solid rgba(229, 101, 79, 0.28);
  color: var(--sk-coral-deep);
  font-size: 0.76rem;
}

.error-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.error-retry {
  border: none;
  background: var(--sk-coral-deep);
  color: #fff;
  font-weight: 800;
  font-size: 0.7rem;
  border-radius: var(--sk-radius-pill);
  padding: 5px 12px;
  cursor: pointer;
  flex-shrink: 0;
}

.cal-wrap {
  padding: 6px 14px 90px;
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.cal-panel {
  padding: 12px;
}

.cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.cal-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
}

.title-bold {
  font-weight: 900;
  font-size: 1.1rem;
  color: var(--sk-text);
}

.title-light {
  font-weight: 600;
  font-size: 0.7rem;
  color: var(--sk-text-muted);
}

.cal-nav {
  border: none;
  background: var(--sk-chip-bg);
  color: var(--sk-chip-text);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  cursor: pointer;
}

.cal-today-row {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.cal-today-btn {
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 13px;
  border-radius: var(--sk-radius-pill);
  background: var(--sk-accent-tint);
  color: var(--sk-accent-shade);
  font-size: 0.7rem;
  font-weight: 800;
}

html.dark .cal-today-btn {
  color: var(--sk-lime);
}

.cal-today-btn i {
  font-size: 0.66rem;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}

.cal-weekdays span {
  text-align: center;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sk-text-muted);
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-cell {
  min-height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2px 0;
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
  background: transparent;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    background 0.12s ease,
    box-shadow 0.12s ease;
}

.cal-day:active {
  transform: scale(0.9);
}

.cal-day.selected {
  color: #ffffff;
  background: var(--sk-lime-deep);
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(121, 185, 60, 0.4);
}

.cal-cell.is-today .cal-day:not(.selected) {
  border: 2px solid var(--sk-amber-deep);
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
  background: var(--sk-lime-deep);
}
.dot--ongoing {
  background: var(--sk-amber-deep);
}
.dot--completed {
  background: var(--sk-coral-deep);
}
.dot--cancelled {
  background: var(--sk-text-muted);
}

/* Selected day heading */
.day-heading {
  margin: 2px 2px 0;
  font-size: 0.98rem;
  font-weight: 900;
  color: var(--sk-text);
}

/* Accent event cards */
.ac-card {
  border-radius: var(--sk-radius-card);
  padding: 11px 13px;
  box-shadow: var(--sk-raised-soft);
}

.is-lime {
  background: var(--sk-lime);
}
.is-amber {
  background: var(--sk-amber);
}
.is-coral {
  background: var(--sk-coral);
}
.is-grey {
  background: var(--sk-chip-bg);
}

.day-event {
  display: flex;
  align-items: center;
  gap: 11px;
}

.de-icon {
  width: 38px;
  height: 38px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.55);
  color: var(--sk-on-accent);
  flex-shrink: 0;
}

.de-body {
  flex: 1;
  min-width: 0;
}

.event-name {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 900;
  color: var(--sk-on-accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-time {
  margin: 2px 0 0;
  font-size: 0.72rem;
  font-weight: 600;
  opacity: 0.75;
}

.no-events-card {
  padding: 22px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.no-events-icon {
  font-size: 20px;
  color: var(--sk-amber-deep);
}

.no-events {
  margin: 0;
  color: var(--sk-text-muted);
  font-size: 0.85rem;
}
</style>