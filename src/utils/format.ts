export function formatDate(timestamp: number, withTime = true): string {
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: withTime ? 'numeric' : undefined,
    minute: withTime ? '2-digit' : undefined,
  });
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  started: boolean;
}

export function getCountdown(target: number, now: number): Countdown {
  const diff = Math.max(0, target - now);
  const started = now >= target;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
    started,
  };
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function dateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;