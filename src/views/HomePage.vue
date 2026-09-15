<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
<ion-title>
            <span class="head-light">Event</span>{{ ' ' }}<span class="head-bold">Planner</span>
          </ion-title>
          <ion-buttons slot="end">
            <ConnectionBadge />
          </ion-buttons>
        </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar v-model="searchQuery" placeholder="Search events" class="sk-search" />
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <div v-if="loading" class="loading">
        <ion-spinner name="crescent" />
      </div>

      <template v-else>
        <div class="stack">
          <!-- Hero: next upcoming event -->
          <div v-if="nextEvent" class="sk-panel hero" @click="goTo(`/event/${nextEvent.id}`)">
            <p class="hero-kicker">Next Up</p>
            <h2 class="hero-name">
              <span class="hero-name-light">{{ nextEvent.name }}</span>
            </h2>
            <div class="hero-date">
              <span class="date-num">{{ dayNum(nextEvent.eventTimestamp) }}</span>
              <span class="date-month">{{ monthShort(nextEvent.eventTimestamp) }}</span>
            </div>
            <p class="hero-venue">{{ nextEvent.venue }}</p>
            <div class="countdown">
              <div class="cd-seg">
                <span class="cd-num">{{ countdown.days }}</span>
                <span class="cd-lbl">days</span>
              </div>
              <div class="cd-seg">
                <span class="cd-num">{{ pad2(countdown.hours) }}</span>
                <span class="cd-lbl">hrs</span>
              </div>
              <div class="cd-seg">
                <span class="cd-num">{{ pad2(countdown.minutes) }}</span>
                <span class="cd-lbl">min</span>
              </div>
              <div class="cd-seg">
                <span class="cd-num">{{ pad2(countdown.seconds) }}</span>
                <span class="cd-lbl">sec</span>
              </div>
            </div>
          </div>

          <!-- Stats: container card with inner stat cards -->
          <div class="sk-panel stats">
            <div class="stat">
              <span class="stat-num">{{ stats.total }}</span>
              <span class="stat-lbl">Total</span>
            </div>
            <div class="stat">
              <span class="stat-num">{{ stats.upcoming }}</span>
              <span class="stat-lbl">Upcoming</span>
            </div>
            <div class="stat">
              <span class="stat-num">{{ stats.ongoing }}</span>
              <span class="stat-lbl">Ongoing</span>
            </div>
            <div class="stat">
              <span class="stat-num">{{ stats.completed }}</span>
              <span class="stat-lbl">Done</span>
            </div>
          </div>

          <!-- Events: container card with inner rows -->
          <div class="sk-panel events">
            <div class="events-head">
              <span class="head-light">All</span>
              <span class="head-bold">Events</span>
            </div>

            <div
              v-for="event in filteredEvents"
              :key="event.id"
              class="event-row sk-press"
              @click="goTo(`/event/${event.id}`)"
            >
              <div class="event-date">
                <span class="date-num">{{ dayNum(event.eventTimestamp) }}</span>
                <span class="date-month">{{ monthShort(event.eventTimestamp) }}</span>
              </div>
              <div class="event-info">
                <p class="event-name">{{ event.name }}</p>
                <p class="event-time">{{ timeNum(event.eventTimestamp) }} &middot; {{ event.venue }}</p>
              </div>
              <StatusBadge :status="event.status" />
            </div>

            <div v-if="filteredEvents.length === 0" class="empty sk-panel">
              <p>No events found</p>
            </div>

            <button class="add-row sk-press" @click="goTo('/event/new')">
              <ion-icon :icon="add"></ion-icon>
              <span>New Event</span>
            </button>
          </div>
        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { add } from 'ionicons/icons';
import type { EventItem } from '@/types/event';
import { getEvents } from '@/services/eventService';
import { getCountdown, pad2, startOfDay } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge.vue';
import ConnectionBadge from '@/components/ConnectionBadge.vue';

const router = useRouter();

const loading = ref(true);
const events = ref<EventItem[]>([]);
const searchQuery = ref('');
const now = ref(Date.now());
let clockTimer: number | undefined;

const filteredEvents = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return events.value;
  return events.value.filter(
    (event) =>
      event.name.toLowerCase().includes(query) ||
      event.venue.toLowerCase().includes(query) ||
      event.status.toLowerCase().includes(query)
  );
});

const stats = computed(() => ({
  total: events.value.length,
  upcoming: events.value.filter((e) => e.status === 'upcoming').length,
  ongoing: events.value.filter((e) => e.status === 'ongoing').length,
  completed: events.value.filter((e) => e.status === 'completed').length,
}));

const nextEvent = computed(() => {
  const upcoming = events.value
    .filter(
      (e) => e.status === 'upcoming' && e.eventTimestamp >= startOfDay(new Date()).getTime()
    )
    .sort((a, b) => a.eventTimestamp - b.eventTimestamp);
  return upcoming[0] ?? null;
});

const countdown = computed(() =>
  nextEvent.value
    ? getCountdown(nextEvent.value.eventTimestamp, now.value)
    : { days: 0, hours: 0, minutes: 0, seconds: 0, started: false }
);

function dayNum(timestamp: number): number {
  return new Date(timestamp).getDate();
}

function monthShort(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, { month: 'short' });
}

function timeNum(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function goTo(path: string) {
  router.push(path);
}

async function loadEvents() {
  loading.value = true;
  try {
    events.value = await getEvents();
  } finally {
    loading.value = false;
  }
}

async function onRefresh(event: { target: { complete: () => void } }) {
  await loadEvents();
  event.target.complete();
}

onMounted(() => {
  loadEvents();
  clockTimer = window.setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (clockTimer) window.clearInterval(clockTimer);
});
</script>

<style scoped>
.loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

/* Stacked card layers */
.stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 14px;
}

/* Hero card */
.hero {
  padding: 20px 18px 18px;
  cursor: pointer;
}

.hero-kicker {
  margin: 0 0 2px;
  font-size: 0.72rem;
  font-weight: 300;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--sk-text-light);
}

.hero-name {
  margin: 4px 0 14px;
  font-size: 1.5rem;
}

.hero-name-light {
  font-weight: 300;
}

.hero-date {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0 0 10px;
}

.date-num {
  font-size: 2.6rem;
  font-weight: 800;
  color: var(--sk-text);
  line-height: 1;
}

.date-month {
  font-size: 1.15rem;
  font-weight: 300;
  color: var(--sk-text-light);
}

.hero-venue {
  margin: 0 0 14px;
  font-size: 0.9rem;
  font-weight: 300;
  color: var(--sk-text-light);
}

.countdown {
  display: flex;
  gap: 8px;
}

.cd-seg {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 2px;
  border-radius: var(--sk-radius-sm);
  background: var(--sk-glass-level-3);
  border: 1px solid var(--sk-glass-border);
  backdrop-filter: var(--sk-panel-blur);
  -webkit-backdrop-filter: var(--sk-panel-blur);
  box-shadow: var(--sk-inset-shadow);
}

.cd-num {
  font-size: 1.35rem;
}

.cd-lbl {
  margin-top: 3px;
  font-size: 0.58rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--sk-text-light);
}

/* Stats container: inner stat cards */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 14px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 4px 12px;
  border-radius: var(--sk-radius-md);
  background: var(--sk-glass-level-3);
  border: 1px solid var(--sk-glass-border);
  backdrop-filter: var(--sk-panel-blur);
  -webkit-backdrop-filter: var(--sk-panel-blur);
  box-shadow: var(--sk-raised-soft);
}

.stat-num {
  font-size: 1.6rem;
}

.stat-lbl {
  font-size: 0.6rem;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--sk-text-light);
}

/* Events container: inner rows */
.events {
  padding: 18px 14px 14px;
}

.events-head {
  margin: 0 4px 14px;
  font-size: 1.1rem;
}

.head-light {
  font-weight: 300;
}

.head-bold {
  font-weight: 800;
}

.event-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  padding: 12px;
  border-radius: var(--sk-radius-pill);
  background: var(--sk-glass-level-2);
  border: 1px solid var(--sk-glass-border);
  backdrop-filter: var(--sk-panel-blur);
  -webkit-backdrop-filter: var(--sk-panel-blur);
  box-shadow: var(--sk-raised-soft);
}

.event-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--sk-glass-level-3);
}

.event-date .date-num {
  font-size: 1.15rem;
  line-height: 1;
}

.event-date .date-month {
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.event-info {
  flex: 1;
  min-width: 0;
}

.event-name {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--sk-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-time {
  margin: 3px 0 0;
  font-size: 0.74rem;
  font-weight: 300;
  color: var(--sk-text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty {
  text-align: center;
  padding: 20px 12px;
  margin-bottom: 10px;
}

.empty p {
  margin: 0;
  font-weight: 300;
  color: var(--sk-text-light);
}

.add-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: none;
  border-radius: var(--sk-radius-pill);
  background: linear-gradient(150deg, var(--sk-glass-level-2), var(--sk-glass-level-3));
  color: var(--sk-accent);
  font: inherit;
  font-size: 0.92rem;
  font-weight: 600;
}

.add-row ion-icon {
  font-size: 20px;
}
</style>