import {
  format,
  formatDistanceToNowStrict,
  isThisYear,
  isToday,
  isTomorrow,
  isYesterday
} from 'date-fns';

export function toDate(value: string | number | Date) {
  return value instanceof Date ? value : new Date(value);
}

/** "2m ago", "3h ago", "Nov 3". */
export function relativeTime(value: string | number | Date) {
  const date = toDate(value);
  const diff = Date.now() - date.getTime();
  if (diff < 45_000 && diff > -45_000) return 'just now';
  if (Math.abs(diff) < 7 * 24 * 3600_000) {
    const text = formatDistanceToNowStrict(date, { roundingMethod: 'floor' })
      .replace(/ seconds?/, 's')
      .replace(/ minutes?/, 'm')
      .replace(/ hours?/, 'h')
      .replace(/ days?/, 'd');
    return diff >= 0 ? `${text} ago` : `in ${text}`;
  }
  return shortDate(date);
}

export function shortDate(value: string | number | Date) {
  const date = toDate(value);
  return format(date, isThisYear(date) ? 'MMM d' : 'MMM d, yyyy');
}

/** "Today, 4:30 PM", "Tomorrow, 9:00 AM", "Mon, Nov 3, 9:00 AM". */
export function dateTime(value: string | number | Date) {
  const date = toDate(value);
  const time = format(date, 'h:mm a');
  if (isToday(date)) return `Today, ${time}`;
  if (isTomorrow(date)) return `Tomorrow, ${time}`;
  if (isYesterday(date)) return `Yesterday, ${time}`;
  return format(
    date,
    isThisYear(date) ? 'EEE, MMM d, h:mm a' : 'MMM d, yyyy, h:mm a'
  );
}

/** 83_400 → "1:23", 3_723_000 → "1:02:03". */
export function duration(ms: number | null | undefined) {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return '–';
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Timecode with tenths, for the editor: "0:12.4". */
export function timecode(ms: number) {
  const safe = Math.max(0, ms);
  const m = Math.floor(safe / 60_000);
  const s = Math.floor((safe % 60_000) / 1000);
  const tenths = Math.floor((safe % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${tenths}`;
}

export function compactNumber(n: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(n);
}

export function bytes(n: number | null | undefined) {
  if (!n) return '–';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = n;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}

export function money(amount: number) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);
}

export function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

export function hostname(url: string | null | undefined) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
