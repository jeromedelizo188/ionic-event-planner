<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <div class="detail-topbar">
          <button class="icon-btn" @click="router.back()" aria-label="Back">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <span class="tb-name">Event Details</span>
          <div class="tb-actions">
            <button class="icon-btn warn" :disabled="!event" @click="goEdit" aria-label="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="icon-btn danger" :disabled="!event" @click="onConfirmDelete" aria-label="Delete">
              <i class="fa-solid fa-trash-can"></i>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading">
        <ion-spinner name="crescent" />
      </div>

      <div v-else-if="event" class="detail-wrap">
        <!-- Hero: accent pastel card by status -->
        <div class="ac-card" :class="accentOf(event.status)">
          <div class="hero-top">
            <StatusBadge :status="event.status" />
            <i class="fa-solid fa-bullhorn hero-emoji"></i>
          </div>
          <div class="hero-date-row">
            <span class="hero-day">{{ dayNum(event.eventTimestamp) }}</span>
            <span class="hero-month-time">{{ monthDayTime(event.eventTimestamp) }}</span>
          </div>
          <h1 class="hero-title">{{ event.name }}</h1>
        </div>

        <!-- Info panel -->
        <div class="sk-panel info-panel">
          <div class="info-row">
            <span class="info-icon"><i class="fa-solid fa-clock"></i></span>
            <div>
              <span class="info-label">Date &amp; Time</span>
              <span class="info-value">{{ formatDate(event.eventTimestamp) }}</span>
            </div>
          </div>
          <div class="info-divider"></div>
          <div class="info-row">
            <span class="info-icon"><i class="fa-solid fa-location-dot"></i></span>
            <div>
              <span class="info-label">Venue</span>
              <span class="info-value" v-html="markText(event.venue, event.venue)"></span>
            </div>
          </div>
          <div v-if="event.description" class="info-divider"></div>
          <div v-if="event.description" class="info-row">
            <span class="info-icon"><i class="fa-solid fa-note-sticky"></i></span>
            <div>
              <span class="info-label">Description</span>
              <span class="info-value" v-html="highlightDesc(event.description, event.venue)"></span>
            </div>
          </div>
        </div>

        <!-- Pill action buttons -->
        <div class="actions">
          <button class="pill-action primary" @click="goEdit">
            <i class="fa-solid fa-pen"></i> Edit Event
          </button>
          <button class="pill-action danger" @click="onConfirmDelete">
            <i class="fa-solid fa-trash-can"></i> Delete Event
          </button>
        </div>
      </div>

      <div v-else class="empty-state">
        <p class="empty-text">{{ loadError || 'Event not found' }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonContent, IonHeader, IonPage, IonSpinner, IonToolbar, alertController, onIonViewWillEnter } from '@ionic/vue';
import type { EventItem } from '@/types/event';
import { deleteEvent, getErrorMessage, getEvent } from '@/services/eventService';
import { formatDate } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const event = ref<EventItem | null>(null);
const loadError = ref('');

function dayNum(timestamp: number): number {
  return new Date(timestamp).getDate();
}

function monthDayTime(timestamp: number): string {
  const d = new Date(timestamp);
  const month = d.toLocaleString(undefined, { month: 'long' });
  const time = d.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${month} \u00B7 ${time}`;
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

function markText(text: string, highlight: string): string {
  if (!highlight) return text;
  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(escaped, 'gi'),
    (m) => `<mark class="sk-mark">${m}</mark>`
  );
}

function highlightDesc(desc: string, venue: string): string {
  if (!venue) return desc;
  return markText(desc, venue);
}

function goEdit() {
  if (event.value) router.push(`/event/${event.value.id}/edit`);
}

async function loadEvent() {
  loading.value = true;
  loadError.value = '';
  try {
    event.value = await getEvent(String(route.params.id));
  } catch (err) {
    event.value = null;
    loadError.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

async function onConfirmDelete() {
  const alert = await alertController.create({
    header: 'Delete Event',
    message: `Delete "${event.value?.name}"?`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        cssClass: 'danger',
        handler: async () => {
          try {
            if (event.value) await deleteEvent(event.value.id);
            router.replace('/tabs/home');
          } catch (err) {
            const fail = await alertController.create({
              header: 'Delete Failed',
              message: getErrorMessage(err),
              buttons: ['OK'],
            });
            await fail.present();
          }
        },
      },
    ],
  });
  await alert.present();
}

onIonViewWillEnter(loadEvent);

onMounted(loadEvent);
</script>

<style scoped>
.detail-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 14px 8px;
}

.tb-name {
  margin-right: auto;
  font-size: 1.02rem;
  font-weight: 900;
  color: var(--sk-text);
  letter-spacing: -0.01em;
}

.tb-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: var(--sk-chip-bg);
  color: var(--sk-chip-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
}

.icon-btn.warn {
  color: var(--sk-amber-deep);
}

.icon-btn.danger {
  color: var(--sk-coral-deep);
}

.icon-btn:disabled {
  opacity: 0.4;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.empty-state {
  text-align: center;
  margin-top: 4rem;
}

.empty-text {
  color: var(--sk-text-muted);
  font-weight: 600;
}

.detail-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px 14px 30px;
}

/* Hero accent card */
.ac-card {
  border-radius: var(--sk-radius-card);
  padding: 17px 17px 15px;
  display: flex;
  flex-direction: column;
  gap: 11px;
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

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-emoji {
  font-size: 1.5rem;
  opacity: 0.75;
}

.hero-date-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.hero-day {
  font-size: 3.2rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.03em;
}

.hero-month-time {
  font-size: 1rem;
  font-weight: 700;
  opacity: 0.75;
}

.hero-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 900;
  letter-spacing: -0.01em;
  word-break: break-word;
}

/* Info panel */
.info-panel {
  padding: 6px 16px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 13px 0;
}

.info-icon {
  width: 38px;
  height: 38px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: var(--sk-coral-deep);
  background: var(--sk-red-tint);
  flex-shrink: 0;
}

.info-label {
  display: block;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sk-text-muted);
  margin-bottom: 3px;
}

.info-value {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--sk-text);
  word-break: break-word;
  line-height: 1.45;
}

.info-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--sk-border), transparent);
}

:deep(.sk-mark) {
  background: var(--sk-marker);
  border-radius: 4px;
  padding: 0 3px;
  color: inherit;
}

/* Pill actions */
.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 2px 0;
}

.pill-action {
  height: 46px;
  border: none;
  border-radius: var(--sk-radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 800;
  font-size: 0.88rem;
  cursor: pointer;
  box-shadow: var(--sk-raised-soft);
}

.pill-action i {
  font-size: 13px;
}

.pill-action.primary {
  background: var(--sk-lime-deep);
  color: #ffffff;
}

.pill-action.danger {
  background: var(--sk-coral-deep);
  color: #ffffff;
}
</style>