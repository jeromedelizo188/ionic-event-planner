<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEdit ? 'Edit Event' : 'New Event' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="form-wrap">
        <div class="sk-panel form-panel">
          <label class="sk-field-label">Name</label>
          <div class="sk-inset sk-field">
            <ion-input
              v-model="form.name"
              type="text"
              placeholder="Event name"
              required
            ></ion-input>
          </div>

          <label class="sk-field-label">Date &amp; Time</label>
          <div class="sk-inset sk-field sk-date-field">
            <ion-datetime-button datetime="eventDatetime"></ion-datetime-button>
          </div>

          <label class="sk-field-label">Venue</label>
          <div class="sk-inset sk-field">
            <ion-input
              v-model="form.venue"
              type="text"
              placeholder="Venue"
            ></ion-input>
          </div>

          <label class="sk-field-label">Description</label>
          <div class="sk-inset sk-field">
            <ion-textarea
              v-model="form.description"
              :rows="4"
              placeholder="Event description"
            ></ion-textarea>
          </div>

          <label class="sk-field-label">Status</label>
          <div class="sk-inset sk-field">
            <ion-select v-model="form.status" interface="action-sheet">
              <ion-select-option v-for="status in EVENT_STATUSES" :key="status" :value="status">
                {{ status }}
              </ion-select-option>
            </ion-select>
          </div>
        </div>

        <ion-datetime
          id="eventDatetime"
          v-model="datetimeIso"
          presentation="date-time"
          collapse="true"
        ></ion-datetime>

        <div class="form-actions">
          <ion-button
            expand="block"
            class="sk-pill-btn"
            @click="onSubmit"
            :disabled="!form.name.trim()"
          >
            {{ isEdit ? 'Save Changes' : 'Create Event' }}
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonInput,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
  alertController,
} from '@ionic/vue';
import { EVENT_STATUSES, type EventItem } from '@/types/event';
import { createEvent, getErrorMessage, getEvent, updateEvent } from '@/services/eventService';

const route = useRoute();
const router = useRouter();

const editId = computed(() => (route.params.id ? String(route.params.id) : null));
const isEdit = computed(() => Boolean(editId.value));

const form = reactive({
  name: '',
  venue: '',
  description: '',
  status: 'upcoming',
});

const datetimeIso = ref(new Date().toISOString());

function toTimestamp(iso: string): number {
  return new Date(iso).getTime();
}

async function onMountedLoad() {
  if (editId.value) {
    const event: EventItem | null = await getEvent(editId.value);
    if (event) {
      form.name = event.name;
      form.venue = event.venue;
      form.description = event.description;
      form.status = event.status;
      datetimeIso.value = new Date(event.eventTimestamp).toISOString();
    }
  }
}

async function onSubmit() {
  const data = {
    name: form.name.trim(),
    venue: form.venue.trim(),
    description: form.description.trim(),
    status: form.status,
    eventTimestamp: toTimestamp(datetimeIso.value),
  };

  try {
    if (isEdit.value && editId.value) {
      await updateEvent(editId.value, data);
    } else {
      await createEvent(data);
    }
    router.replace('/tabs/home');
  } catch (err) {
    const alert = await alertController.create({
      header: 'Save Failed',
      message: getErrorMessage(err),
      buttons: ['OK'],
    });
    await alert.present();
  }
}

onMounted(onMountedLoad);
</script>

<style scoped>
.form-wrap {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-panel {
  padding: 18px 16px;
}

.sk-field-label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--sk-text-muted);
  margin: 14px 4px 6px;
}

.sk-field-label:first-child {
  margin-top: 0;
}

.sk-field {
  --background: transparent;
  --border-color: transparent;
  --padding-start: 14px;
  --padding-end: 14px;
  --highlight-color-focused: var(--sk-accent);
  min-height: 46px;
  color: var(--sk-text);
}

.sk-field::part(native) {
  background: transparent;
}

.sk-date-field {
  padding: 8px 14px;
}

.sk-date-field ion-datetime-button::part(native) {
  --background: var(--sk-glass-level-2);
  --box-shadow: var(--sk-raised-soft);
  border-radius: var(--sk-radius-pill);
  font-weight: 700;
  color: var(--sk-text);
}

.form-actions {
  padding: 0;
}

.sk-pill-btn {
  --border-radius: var(--sk-radius-pill);
  --box-shadow: var(--sk-raised-soft);
  font-weight: 700;
  height: 52px;
  margin: 0;
}
</style>
