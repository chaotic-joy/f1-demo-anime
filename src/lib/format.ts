export function formatPoints(points: string): string {
  const value = Number(points);
  if (!Number.isFinite(value)) return points;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

export function formatUpdated(iso: string): string {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return iso;
  return formatWith(instant, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function formatWhen(instant: Date): string {
  return formatWith(instant, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatWith(instant: Date, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(undefined, options).format(instant);
  } catch {
    return instant.toISOString();
  }
}

export function formatRaceDay(date: string, time: string | null): string {
  const instant = time ? new Date(`${date}T${time.endsWith("Z") ? time : `${time}Z`}`) : new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(instant.getTime())) return date;
  if (!time) {
    return formatWith(instant, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  return formatWith(instant, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "your local time";
}

export function padTime(value: number): string {
  return String(value).padStart(2, "0");
}
