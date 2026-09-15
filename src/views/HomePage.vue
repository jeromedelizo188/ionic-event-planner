<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <div class="topbar">
          <LogoMark :size="34" />
          <div class="tb-titles">
            <span class="tb-name">Event Planner</span>
            <span class="tb-sub">{{ greeting }} &middot; {{ events.length }} events</span>
          </div>
          <div class="tb-actions">
            <ConnectionBadge />
            <button class="tb-add" @click="goTo('/event/new')">
              <i class="fa-solid fa-plus"></i>
              <span class="tb-add-label">Add</span>
            </button>
            <ThemeToggle />
          </div>
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

      <template v-else>
        <div class="wrap">
          <div class="search-row">
            <ion-searchbar v-model="searchQuery" placeholder="Search events" class="sk-search" />
          </div>

          <div v-if="loadError" class="error-chip">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span class="error-text">{{ loadError }}</span>
            <button class="error-retry" @click="loadEvents">Retry</button>
          </div>

          <!-- Hero: next upcoming event, coral pastel card -->
          <div
            v-if="nextEvent"
            class="ac-card is-coral hero-card sk-press"
            @click="goTo(`/event/${nextEvent.id}`)"
          >
            <div class="hero-top">
              <span class="hero-chip">
                <i class="fa-solid fa-bolt"></i> Next up
              </span>
              <i class="fa-solid fa-arrow-right-long hero-arrow"></i>
            </div>

            <div class="hero-count">
              <span class="hero-num">{{ countdown.days }}</span>
              <span class="hero-unit">days to go</span>
            </div>

            <div class="hero-sub-count">
              <span>{{ pad2(countdown.hours) }}h</span>
              <span>{{ pad2(countdown.minutes) }}m</span>
              <span>{{ pad2(countdown.seconds) }}s</span>
            </div>

            <h2 class="hero-title">
              <i class="fa-solid fa-calendar-days"></i>
              {{ nextEvent.name }}
            </h2>

            <div class="ac-meta">
              <span class="meta-row">
                <i class="fa-solid fa-clock"></i>{{ fullDate(nextEvent.eventTimestamp) }}
              </span>
              <span class="meta-row">
                <i class="fa-solid fa-location-dot"></i>{{ nextEvent.venue }}
              </span>
            </div>

            <div class="card-bottom">
              <div class="avatars">
                <span
                  v-for="(init, idx) in avatarItems.slice(0, 3)"
                  :key="idx"
                  class="avatar"
                  :style="{ background: AVATAR_TONES[idx % AVATAR_TONES.length] }"
                  >{{ init }}</span
                >
                <span v-if="avatarItems.length > 3" class="avatar avatar-more"
                  >+{{ avatarItems.length - 3 }}</span
                >
                <span v-if="avatarItems.length === 0" class="avatar avatar-empty">
                  <i class="fa-solid fa-user"></i>
                </span>
              </div>
              <StatusBadge :status="nextEvent.status" />
            </div>
          </div>

          <!-- Section heading + right-aligned link -->
          <div class="section-row">
            <h2 class="section-title">{{ activeLabel }} events</h2>
            <button class="section-link" @click="goTo('/tabs/calendar')">
              Calendar <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          <!-- Horizontal scrollable status chips -->
          <div class="chip-strip">
            <button
              v-for="chip in chips"
              :key="chip.value"
              class="chip"
              :class="{ active: statusFilter === chip.value }"
              @click="statusFilter = chip.value"
            >
              {{ chip.label }}
              <span v-if="stats[chip.value] !== undefined" class="chip-count">{{ stats[chip.value] }}</span>
            </button>
          </div>

          <!-- Accent-colored event cards -->
          <div
            v-for="event in filteredEvents"
            :key="event.id"
            class="ac-card sk-press"
            :class="accentOf(event.status)"
            @click="goTo(`/event/${event.id}`)"
          >
            <div class="card-top">
              <div class="card-datebox">
                <span class="cd-day">{{ dayNum(event.eventTimestamp) }}</span>
                <span class="cd-month">{{ monthShort(event.eventTimestamp) }}</span>
              </div>
              <h3 class="card-title">{{ event.name }}</h3>
              <i class="fa-solid fa-arrow-right card-arrow"></i>
            </div>

            <div class="ac-meta">
              <span class="meta-row">
                <i class="fa-solid fa-clock"></i>{{ timeNum(event.eventTimestamp) }} &middot;
                {{ fullDayDuring(event.eventTimestamp) }}
              </span>
              <span class="meta-row">
                <i class="fa-solid fa-location-dot"></i>{{ event.venue }}
              </span>
            </div>

            <div class="card-bottom">
              <StatusBadge :status="event.status" />
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="filteredEvents.length === 0" class="empty-card">
            <span class="empty-icon"><i class="fa-solid fa-calendar-plus"></i></span>
            <p class="empty-title">{{ searchQuery ? 'No results' : 'No events yet' }}</p>
            <p class="empty-sub">{{ searchQuery ? 'Try a different search.' : 'Create your first event to see it light up here.' }}</p>
            <button class="empty-btn" @click="goTo('/event/new')">
              <i class="fa-solid fa-plus"></i> New event
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
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import {
  eventsLoaded,
  liveEvents,
  liveEventsError,
  refreshNow,
  startEventsListening,
} from '@/services/eventService';
import { getCountdown, pad2, startOfDay } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge.vue';
import ConnectionBadge from '@/components/ConnectionBadge.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';
import LogoMark from '@/components/LogoMark.vue';

const router = useRouter();

const loading = computed(() => !eventsLoaded.value);
const events = liveEvents;
const loadError = liveEventsError;
const searchQuery = ref('');
const statusFilter = ref('all');
const now = ref(Date.now());
let clockTimer: number | undefined;

const AVATAR_TONES = [
  'var(--sk-lime-deep)',
  'var(--sk-amber-deep)',
  'var(--sk-coral-deep)',
];

const chips = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Canceled' },
] as const;

const activeLabel = computed(() => {
  const chip = chips.find((c) => c.value === statusFilter.value);
  return chip ? chip.label : 'All';
});

const filteredEvents = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return events.value.filter((event) => {
    if (statusFilter.value !== 'all' && event.status !== statusFilter.value) return false;
    if (!query) return true;
    return (
      event.name.toLowerCase().includes(query) ||
      event.venue.toLowerCase().includes(query) ||
      event.status.toLowerCase().includes(query)
    );
  });
});

const stats = computed<Record<string, number>>(() => ({
  all: events.value.length,
  upcoming: events.value.filter((e) => e.status === 'upcoming').length,
  ongoing: events.value.filter((e) => e.status === 'ongoing').length,
  completed: events.value.filter((e) => e.status === 'completed').length,
  cancelled: events.value.filter((e) => e.status === 'cancelled').length,
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

const avatarItems = computed(() => {
  const sorted = [...events.value]
    .filter((e) => e.status === 'upcoming' || e.status === 'ongoing')
    .sort((a, b) => a.eventTimestamp - b.eventTimestamp);
  const pool = sorted.length ? sorted : events.value;
  return pool.slice(0, 4).map((e) => initials(e.name));
});

const greeting = (() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
})();

function dayNum(timestamp: number): number {
  return new Date(timestamp).getDate();
}

function monthShort(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, { month: 'short' });
}

function timeNum(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function fullDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fullDayDuring(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
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
/* ===== Top bar ===== */
.topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 14px 8px;
}

.tb-titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-right: auto;
}

.tb-name {
  font-weight: 900;
  font-size: 1.02rem;
  color: var(--sk-text);
  line-height: 1.15;
  letter-spacing: -0.01em;
}

.tb-sub {
  font-size: 0.66rem;
  font-weight: 500;
  color: var(--sk-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tb-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tb-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  cursor: pointer;
  height: 30px;
  padding: 0 13px;
  border-radius: var(--sk-radius-pill);
  background: linear-gradient(
    135deg,
    var(--sk-lime-deep) 0%,
    var(--sk-amber-deep) 60%,
    var(--sk-coral-deep) 100%
  );
  color: #ffffff;
  font-weight: 800;
  font-size: 0.76rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}

.tb-add i {
  font-size: 11px;
}

/* ===== Content ===== */
.wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px 14px 90px;
}

.search-row {
  padding: 0 2px;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

/* Error chip */
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

/* ===== Accent cards (full-bleed pastel, dark text) ===== */
.ac-card {
  border-radius: var(--sk-radius-card);
  padding: 15px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--sk-on-accent);
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
  color: var(--sk-chip-text);
}

/* Hero countdown card */
.hero-card {
  padding: 18px 18px 15px;
  gap: 10px;
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: var(--sk-radius-pill);
  background: rgba(255, 255, 255, 0.55);
  color: var(--sk-on-accent);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-chip i {
  color: var(--sk-coral-deep);
}

.hero-arrow {
  font-size: 15px;
  opacity: 0.65;
}

.hero-count {
  display: flex;
  align-items: baseline;
  gap: 9px;
}

.hero-num {
  font-size: 3.1rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.03em;
}

.hero-unit {
  font-size: 0.92rem;
  font-weight: 800;
  opacity: 0.8;
}

.hero-sub-count {
  display: flex;
  gap: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  opacity: 0.75;
}

.hero-sub-count span {
  background: rgba(255, 255, 255, 0.5);
  border-radius: var(--sk-radius-pill);
  padding: 2px 9px;
}

.hero-title {
  margin: 0;
  font-size: 1.28rem;
  font-weight: 900;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 8px;
  word-break: break-word;
}

.hero-title i {
  font-size: 1rem;
  opacity: 0.8;
}

/* Metadata rows with icons */
.ac-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-row i {
  font-size: 0.78rem;
  opacity: 0.85;
  flex-shrink: 0;
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
}

/* Avatar cluster */
.avatars {
  display: flex;
  align-items: center;
}

.avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 0.66rem;
  font-weight: 800;
  border: 2px solid var(--sk-on-accent);
  margin-left: -7px;
}

.avatar:first-child {
  margin-left: 0;
}

.avatar-more {
  background: rgba(0, 0, 0, 0.22);
}

.avatar-empty {
  background: rgba(0, 0, 0, 0.18);
}

.avatar-empty i {
  font-size: 11px;
}

/* ===== Section heading + link ===== */
.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
}

.section-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 900;
  color: var(--sk-text);
  letter-spacing: -0.01em;
}

.section-link {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--sk-text-muted);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.section-link i {
  font-size: 0.6rem;
}

/* ===== Chips strip ===== */
.chip-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px;
  scrollbar-width: none;
}

.chip-strip::-webkit-scrollbar {
  display: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  height: 30px;
  padding: 0 13px;
  border: none;
  border-radius: var(--sk-radius-pill);
  background: var(--sk-chip-bg);
  color: var(--sk-chip-text);
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.14s ease;
}

.chip:active {
  transform: scale(0.95);
}

.chip.active {
  background: var(--sk-lime-deep);
  color: #ffffff;
}

.chip-count {
  font-size: 0.6rem;
  font-weight: 800;
  background: rgba(0, 0, 0, 0.12);
  border-radius: var(--sk-radius-pill);
  padding: 1px 7px;
}

.chip.active .chip-count {
  background: rgba(255, 255, 255, 0.28);
}

/* ===== Event cards ===== */
.card-top {
  display: flex;
  align-items: center;
  gap: 11px;
}

.card-datebox {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.55);
  flex-shrink: 0;
}

.cd-day {
  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1;
}

.cd-month {
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.75;
}

.card-title {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 1.02rem;
  font-weight: 900;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-arrow {
  font-size: 13px;
  opacity: 0.55;
  flex-shrink: 0;
}

/* ===== Empty state ===== */
.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 28px 18px;
  border-radius: var(--sk-radius-card);
  background: var(--sk-surface);
  border: 1px solid var(--sk-border);
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--sk-coral-deep);
  background: var(--sk-red-tint);
  margin-bottom: 4px;
}

.empty-title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 900;
  color: var(--sk-text);
}

.empty-sub {
  margin: 0;
  font-size: 0.78rem;
  color: var(--sk-text-muted);
}

.empty-btn {
  margin-top: 10px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 0 18px;
  border-radius: var(--sk-radius-pill);
  background: var(--sk-lime-deep);
  color: #fff;
  font-weight: 800;
  font-size: 0.82rem;
}

.empty-btn i {
  font-size: 12px;
}

/* Compact on small screens */
@media (max-width: 380px) {
  .tb-sub {
    display: none;
  }
  .hero-num {
    font-size: 2.6rem;
  }
}
</style>