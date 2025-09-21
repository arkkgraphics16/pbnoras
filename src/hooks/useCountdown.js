import { useEffect, useMemo, useState } from 'react';

function normalizeDeadline(deadline) {
  if (!deadline) return null;
  if (deadline instanceof Date) {
    return Number.isNaN(deadline.getTime()) ? null : deadline;
  }

  if (typeof deadline === 'number' || typeof deadline === 'string') {
    const asDate = new Date(deadline);
    return Number.isNaN(asDate.getTime()) ? null : asDate;
  }

  if (typeof deadline.toDate === 'function') {
    try {
      const fromTimestamp = deadline.toDate();
      return Number.isNaN(fromTimestamp.getTime()) ? null : fromTimestamp;
    } catch (error) {
      return null;
    }
  }

  return null;
}

function createCountdown(targetDate, referenceDate) {
  if (!targetDate) {
    return null;
  }

  const diffMs = targetDate.getTime() - referenceDate.getTime();
  const clampedDiff = Math.max(diffMs, 0);
  const totalSeconds = Math.floor(clampedDiff / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: days > 0 ? days : null,
    hours,
    minutes,
    seconds,
    totalSeconds,
    isExpired: diffMs <= 0,
  };
}

export default function useCountdown(deadline) {
  const targetDate = useMemo(() => normalizeDeadline(deadline), [deadline]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!targetDate) return undefined;

    setNow(new Date());
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [targetDate]);

  return useMemo(() => createCountdown(targetDate, now), [targetDate, now]);
}

export function formatCountdown(countdown) {
  if (!countdown) return '';

  const { days, hours, minutes, seconds } = countdown;
  const parts = [];

  if (days != null) {
    parts.push(`${days}d`);
  }

  const pad = (value) => String(value).padStart(2, '0');

  parts.push(`${pad(hours)}h`);
  parts.push(`${pad(minutes)}m`);
  parts.push(`${pad(seconds)}s`);

  return parts.join(' ');
}
