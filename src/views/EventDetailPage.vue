<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Event Details</ion-title>
        <ion-buttons slot="end">
          <ion-button :router-link="`/event/${event?.id}/edit`" :disabled="!event">
            <ion-icon :icon="createOutline"></ion-icon>
          </ion-button>
          <ion-button color="danger" :disabled="!event" @click="onConfirmDelete">
            <ion-icon :icon="trashOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading">
        <ion-spinner name="crescent" />
      </div>

      <div v-else-if="event" class="detail-wrap">
        <!-- Hero header: mixed-weight date + status -->
        <div class="sk-panel hero-card">
          <div class="hero-date-row">
            <span class="hero-day">{{ dayNum(event.eventTimestamp) }}</span>
            <div class="hero-date-meta">
              <span class="hero-month-time">{{ monthDayTime(event.eventTimestamp) }}</span>
            </div>
          </div>
          <StatusBadge :status="event.status" />
          <h1 class="hero-title">{{ event.name }}</h1>
        </div>

        <!-- Info rows with marker highlights on labels and highlighted values -->
        <div class="sk-panel info-panel">
          <div class="info-row">
            <span class="info-label">Date &amp; Time</span>
            <div class="info-icon-row">
              <ion-icon :icon="calendarOutline"></ion-icon>
              <span class="info-value">{{ formatDate(event.eventTimestamp) }}</span>
            </div>
          </div>
          <div class="info-divider"></div>
          <div class="info-row">
            <span class="info-label marker">Venue</span>
            <div class="info-icon-row">
              <ion-icon :icon="locationOutline"></ion-icon>
              <span class="info-value" v-html="markText(event.venue, event.venue)"></span>
            </div>
          </div>
          <div v-if="event.description" class="info-divider"></div>
          <div v-if="event.description" class="info-row">
            <span class="info-label">Description</span>
            <div class="info-icon-row desc-row">
              <span class="info-value" v-html="highlightDesc(event.description, event.venue)"></span>
            </div>
          </div>
        </div>

        <!-- Pill action buttons -->
        <div class="actions">
          <ion-button
            expand="block"
            class="sk-pill-btn"
            :router-link="`/event/${event.id}/edit`"
          >
            <ion-icon slot="start" :icon="createOutline"></ion-icon>
            Edit Event
          </ion-button>
          <ion-button
            expand="block"
            color="danger"
            class="sk-pill-btn danger"
            @click="onConfirmDelete"
          >
            <ion-icon slot="start" :icon="trashOutline"></ion-icon>
            Delete Event
          </ion-button>
        </div>
      </div>

      <div v-else class="empty-state">
        <p class="sk-title">Event not found</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  alertController,
} from '@ionic/vue';
import { calendarOutline, createOutline, locationOutline, trashOutline } from 'ionicons/icons';
import type { EventItem } from '@/types/event';
import { deleteEvent, getEvent } from '@/services/eventService';
import { formatDate } from '@/utils/format';
import StatusBadge from '@/components/StatusBadge.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const event = ref<EventItem | null>(null);

function dayNum(timestamp: number): number {
  return new Date(timestamp).getDate();
}

function monthDayTime(timestamp: number): string {
  const d = new Date(timestamp);
  const month = d.toLocaleString(undefined, { month: 'long' });
  const time = d.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${month} \u00B7 ${time}`;
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

async function loadEvent() {
  loading.value = true;
  try {
    event.value = await getEvent(String(route.params.id));
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
          if (event.value) await deleteEvent(event.value.id);
          router.replace('/tabs/home');
        },
      },
    ],
  });
  await alert.present();
}

onMounted(loadEvent);
</script>

<style scoped>
.loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.empty-state {
  text-align: center;
  color: var(--sk-text-muted);
  margin-top: 4rem;
}

.detail-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
}

/* Hero: mixed-weight date header */
.hero-card {
  padding: 20px 18px 18px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.hero-date-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.hero-day {
  font-size: 3rem;
  font-weight: 800;
  color: var(--sk-text);
  line-height: 1;
}

.hero-date-meta {
  display: flex;
  flex-direction: column;
}

.hero-month-time {
  font-size: 1rem;
  font-weight: 300;
  color: var(--sk-text-light);
}

.hero-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--sk-text);
  word-break: break-word;
}

/* Info panel */
.info-panel {
  padding: 8px 16px;
}

.info-row {
  padding: 12px 0;
}

.info-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sk-text-muted);
  margin-bottom: 6px;
  padding: 2px 8px;
}

.info-label.marker {
  background: var(--sk-marker);
  border-radius: 4px;
  display: inline-block;
}

.info-icon-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--sk-text);
}

.info-icon-row ion-icon {
  font-size: 1.15rem;
  color: var(--sk-accent);
  flex-shrink: 0;
}

.desc-row {
  padding-left: 0;
}

.info-value {
  word-break: break-word;
  line-height: 1.5;
}

.info-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--sk-glass-border), transparent);
}

/* Marker highlight in text */
:deep(.sk-mark) {
  background: var(--sk-marker);
  border-radius: 3px;
  padding: 0 3px;
  color: inherit;
}

/* Pill action buttons */
.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0 10px;
}

.sk-pill-btn {
  --border-radius: var(--sk-radius-pill);
  --box-shadow: var(--sk-raised-soft);
  font-weight: 700;
  height: 50px;
  margin: 0;
}
</style>
