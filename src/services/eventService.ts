import { child, get, push, ref, remove as dbRemove, set, update } from 'firebase/database';
import { database, isFirebaseConfigured } from '@/firebase';
import type { EventItem, NewEvent } from '@/types/event';

const EVENTS_NODE = 'events';

const mockEvents: EventItem[] = [
  {
    id: 'mock-1',
    name: 'Product Launch',
    eventTimestamp: new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
    venue: 'Manila Convention Center',
    description: 'Official launch of our new product line.',
    status: 'upcoming',
  },
  {
    id: 'mock-2',
    name: 'Team Building',
    eventTimestamp: new Date().getTime() - 2 * 24 * 60 * 60 * 1000,
    venue: 'Tagaytay Highlands',
    description: 'Annual team building activity for all departments.',
    status: 'completed',
  },
  {
    id: 'mock-3',
    name: 'Planning Sync',
    eventTimestamp: new Date().getTime() + 3 * 24 * 60 * 60 * 1000,
    venue: 'Office Boardroom 2',
    description: 'Quarterly planning sync with stakeholders.',
    status: 'ongoing',
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function snapshotToEvents(snapshot: { forEach: (cb: (child: { key: string | null; val: () => unknown }) => void) => void }): EventItem[] {
  const events: EventItem[] = [];
  snapshot.forEach((child) => {
    const id = child.key;
    const data = child.val() as Omit<EventItem, 'id'>;
    if (id) events.push({ id, ...data });
  });
  return events;
}

export async function getEvents(): Promise<EventItem[]> {
  if (!isFirebaseConfigured || !database) {
    await delay(400);
    return [...mockEvents];
  }
  const snapshot = await get(child(ref(database), EVENTS_NODE));
  if (!snapshot.exists()) return [];
  return snapshotToEvents(snapshot);
}

export async function getEvent(id: string): Promise<EventItem | null> {
  if (!isFirebaseConfigured || !database) {
    await delay(200);
    return mockEvents.find((event) => event.id === id) ?? null;
  }
  const snapshot = await get(child(ref(database), `${EVENTS_NODE}/${id}`));
  if (!snapshot.exists()) return null;
  return { id, ...(snapshot.val() as Omit<EventItem, 'id'>) };
}

export async function createEvent(data: NewEvent): Promise<EventItem> {
  if (!isFirebaseConfigured || !database) {
    await delay(300);
    const event: EventItem = { id: `mock-${mockEvents.length + 1}`, ...data };
    mockEvents.unshift(event);
    return event;
  }
  const newRef = push(ref(database, EVENTS_NODE));
  await set(newRef, data);
  return { id: newRef.key ?? '', ...data };
}

export async function updateEvent(id: string, data: NewEvent): Promise<void> {
  if (!isFirebaseConfigured || !database) {
    await delay(300);
    const index = mockEvents.findIndex((event) => event.id === id);
    if (index !== -1) mockEvents[index] = { id, ...data };
    return;
  }
  await update(ref(database, `${EVENTS_NODE}/${id}`), data);
}

export async function deleteEvent(id: string): Promise<void> {
  if (!isFirebaseConfigured || !database) {
    await delay(300);
    const index = mockEvents.findIndex((event) => event.id === id);
    if (index !== -1) mockEvents.splice(index, 1);
    return;
  }
  await dbRemove(ref(database, `${EVENTS_NODE}/${id}`));
}