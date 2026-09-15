import {
  child,
  get,
  onValue,
  push,
  ref,
  remove as dbRemove,
  set,
  update,
} from 'firebase/database';
import type { Ref } from 'vue';
import { ref as vueRef } from 'vue';
import { database, isFirebaseConfigured } from '@/firebase';
import type { EventItem, NewEvent } from '@/types/event';

const EVENTS_NODE = 'events';

export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const code = (err as { code?: unknown }).code;
    if (code === 'database/permission-denied') {
      return 'The database rules are blocking access. The app signs in anonymously: enable it under Firebase Authentication > Sign-in method > Anonymous, then allow reads/writes in Realtime Database > Rules (e.g. ".read": "auth != null", ".write": "auth != null", or public test mode).';
    }
    if (
      typeof code === 'string' &&
      (code.includes('unavailable') ||
        code.includes('network') ||
        code === 'database/disconnected')
    ) {
      return 'Cannot reach Firebase. Check your internet connection and try again.';
    }
    if (code === 'database/invalid-path' || code === 'database/invalid-data') {
      return 'The event data is invalid. Review the details and try again.';
    }
  }
  return err instanceof Error && err.message
    ? err.message
    : 'Something went wrong. Please try again.';
}

function snapshotToEvents(snapshot: { forEach: (cb: (child: { key: string | null; val: () => unknown }) => void) => void }): EventItem[] {
  const events: EventItem[] = [];
  snapshot.forEach((child) => {
    const id = child.key;
    const data = child.val() as Omit<EventItem, 'id'>;
    if (id) events.push({ id, ...data });
  });
  return events;
}

/* ------------------------------------------------------------------ */
/* Realtime store: the events node is observed, so the UI updates      */
/* automatically whenever the database changes (from any device).      */
/* ------------------------------------------------------------------ */

export const liveEvents: Ref<EventItem[]> = vueRef([]);
export const liveEventsError: Ref<string> = vueRef('');
export const eventsLoaded: Ref<boolean> = vueRef(false);

let eventsListenerStarted = false;

export function startEventsListening(): void {
  if (!isFirebaseConfigured || !database) {
    liveEvents.value = [];
    liveEventsError.value = '';
    eventsLoaded.value = true;
    return;
  }
  if (eventsListenerStarted) return;
  eventsListenerStarted = true;
  onValue(
    ref(database, EVENTS_NODE),
    (snapshot) => {
      liveEvents.value = snapshot.exists() ? snapshotToEvents(snapshot) : [];
      liveEventsError.value = '';
      eventsLoaded.value = true;
    },
    (err) => {
      liveEventsError.value = getErrorMessage(err);
      eventsLoaded.value = true;
    }
  );
}

export async function refreshNow(): Promise<void> {
  try {
    liveEvents.value = await getEvents();
    liveEventsError.value = '';
    eventsLoaded.value = true;
  } catch (err) {
    liveEventsError.value = getErrorMessage(err);
  }
}

export async function getEvents(): Promise<EventItem[]> {
  if (!isFirebaseConfigured || !database) return [];
  const snapshot = await get(child(ref(database), EVENTS_NODE));
  if (!snapshot.exists()) return [];
  return snapshotToEvents(snapshot);
}

export async function getEvent(id: string): Promise<EventItem | null> {
  if (!isFirebaseConfigured || !database) return null;
  const snapshot = await get(child(ref(database), `${EVENTS_NODE}/${id}`));
  if (!snapshot.exists()) return null;
  return { id, ...(snapshot.val() as Omit<EventItem, 'id'>) };
}

export async function createEvent(data: NewEvent): Promise<EventItem> {
  if (!isFirebaseConfigured || !database) {
    throw new Error('Firebase Realtime Database is not configured.');
  }
  const newRef = push(ref(database, EVENTS_NODE));
  await set(newRef, data);
  return { id: newRef.key ?? '', ...data };
}

export async function updateEvent(id: string, data: NewEvent): Promise<void> {
  if (!isFirebaseConfigured || !database) {
    throw new Error('Firebase Realtime Database is not configured.');
  }
  await update(ref(database, `${EVENTS_NODE}/${id}`), data);
}

export async function deleteEvent(id: string): Promise<void> {
  if (!isFirebaseConfigured || !database) {
    throw new Error('Firebase Realtime Database is not configured.');
  }
  await dbRemove(ref(database, `${EVENTS_NODE}/${id}`));
}