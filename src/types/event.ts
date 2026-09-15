export interface EventItem {
  id: string;
  name: string;
  eventTimestamp: number;
  venue: string;
  description: string;
  status: string;
}

export type NewEvent = Omit<EventItem, 'id'>;

export const EVENT_STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'] as const;