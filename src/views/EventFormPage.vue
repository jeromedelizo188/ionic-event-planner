<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <div class="form-topbar">
          <button class="icon-btn" @click="router.back()" aria-label="Back">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <span class="tb-name">{{ isEdit ? 'Edit Event' : 'New Event' }}</span>
          <ThemeToggle />
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="form-wrap">
        <div class="sk-panel form-panel">
          <label class="sk-field-label">Name</label>
          <div class="sk-inset sk-field">
            <i class="fa-solid fa-heading fld-icon"></i>
            <ion-input
              v-model="form.name"
              type="text"
              placeholder="Event name"
              required
            ></ion-input>
          </div>

          <label class="sk-field-label">Date &amp; Time</label>
          <div class="sk-inset sk-field sk-date-field">
            <i class="fa-solid fa-calendar-days fld-icon"></i>
            <ion-datetime-button datetime="eventDatetime"></ion-datetime-button>
          </div>

          <label class="sk-field-label">Venue</label>
          <div class="sk-inset sk-field">
            <i class="fa-solid fa-location-dot fld-icon"></i>
            <ion-input
              v-model="form.venue"
              type="text"
              placeholder="Venue"
            ></ion-input>
          </div>

          <label class="sk-field-label">Description</label>
          <div class="sk-inset sk-field sk-textarea-field">
            <i class="fa-solid fa-note-sticky fld-icon"></i>
            <ion-textarea
              v-model="form.description"
              :rows="4"
              placeholder="Event description"
            ></ion-textarea>
          </div>

          <label class="sk-field-label">Status</label>
          <div class="sk-inset sk-field">
            <i class="fa-solid fa-tag fld-icon"></i>
            <ion-select v-model="form.status" interface="action-sheet" placeholder="Select status">
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
            <i class="fa-solid fa-check" slot="start"></i>
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
  IonButton,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonInput,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonToolbar,
  alertController,
} from '@ionic/vue';
import { EVENT_STATUSES, type EventItem } from '@/types/event';
import { createEvent, getErrorMessage, getEvent, updateEvent } from '@/services/eventService';
import ThemeToggle from '@/components/ThemeToggle.vue';

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
.form-topbar {
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

.form-wrap {
  padding: 6px 14px 30px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-panel {
  padding: 12px 15px 16px;
}

.sk-field-label {
  display: block;
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--sk-text-muted);
  margin: 12px 2px 7px;
}

.sk-field-label:first-child {
  margin-top: 0;
}

.sk-field {
  display: flex;
  align-items: center;
  gap: 10px;
  --background: transparent;
  --border-color: transparent;
  --padding-start: 0;
  --padding-end: 0;
  --highlight-color-focused: var(--sk-accent);
  min-height: 42px;
  color: var(--sk-text);
  padding: 0 13px;
}

.sk-field::part(native) {
  background: transparent;
}

.fld-icon {
  font-size: 14px;
  color: var(--sk-text-muted);
  flex-shrink: 0;
}

.sk-textarea-field {
  align-items: flex-start;
  padding-top: 10px;
}

.sk-field ion-input,
.sk-field ion-textarea,
.sk-field ion-select {
  font-size: 0.92rem;
  font-weight: 500;
}

.sk-date-field {
  padding: 4px 13px;
}

.sk-date-field ion-datetime-button::part(native) {
  --background: transparent;
  border-radius: var(--sk-radius-pill);
  font-weight: 700;
  color: var(--sk-text);
  padding-left: 2px;
}

.form-actions {
  padding: 0;
}

.sk-pill-btn {
  --border-radius: var(--sk-radius-pill);
  --box-shadow: var(--sk-raised-soft);
  --background: linear-gradient(135deg, var(--sk-lime-deep) 0%, var(--sk-amber-deep) 100%);
  font-weight: 800;
  height: 48px;
  margin: 0;
}
</style>