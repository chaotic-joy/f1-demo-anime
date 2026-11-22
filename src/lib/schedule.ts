import type { ConstructorStanding, DriverStanding, Race, Session, Snapshot } from "../data/types.ts";

export const RACE_WINDOW_MS = 3 * 60 * 60 * 1000;

export function parseInstant(date: string, time: string | null): Date | null {
  if (!time) return null;
  const normalized = time.endsWith("Z") ? time : `${time}Z`;
  const instant = new Date(`${date}T${normalized}`);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

export function isStillCurrent(race: Race, now: Date): boolean {
  const start = parseInstant(race.date, race.time);
  if (start) return start.getTime() + RACE_WINDOW_MS > now.getTime();
  const endOfDay = new Date(`${race.date}T23:59:59Z`);
  return !Number.isNaN(endOfDay.getTime()) && endOfDay.getTime() >= now.getTime();
}

export interface SessionView extends Session {
  start: Date | null;
  state: "done" | "up-next" | "later" | "tbd" | "underway";
}

export function sessionViews(race: Race, now: Date): SessionView[] {
  const nextIndex = race.sessions.findIndex((session) => {
    const start = parseInstant(session.date, session.time);
    return start !== null && start.getTime() > now.getTime();
  });

  return race.sessions.map((session, index) => {
    const start = parseInstant(session.date, session.time);
    let state: SessionView["state"] = "later";
    if (!start) {
      state = "tbd";
    } else if (
      session.id === "race" &&
      start.getTime() <= now.getTime() &&
      start.getTime() + RACE_WINDOW_MS > now.getTime()
    ) {
      state = "underway";
    } else if (nextIndex === -1) {
      state = "done";
    } else if (index === nextIndex) {
      state = "up-next";
    } else if (index < nextIndex) {
      state = "done";
    }
    return { ...session, start, state };
  });
}

export interface Board {
  phase: "calendar" | "season-complete";
  showingNextSeason: boolean;
  featured: Race | null;
  remaining: Race[];
  roundCount: number;
  championDriver: DriverStanding | null;
  championConstructor: ConstructorStanding | null;
}

function crowned<T extends { points: string }>(rows: T[]): T | null {
  const leader = rows[0];
  if (!leader) return null;
  const points = Number(leader.points);
  if (!Number.isFinite(points) || points <= 0) return null;
  return leader;
}

export function resolveBoard(snapshot: Snapshot, now: Date): Board {
  const currentUpcoming = snapshot.races.filter((race) => isStillCurrent(race, now));
  const seasonOver = currentUpcoming.length === 0;
  const championDriver = seasonOver ? crowned(snapshot.drivers) : null;
  const championConstructor = seasonOver ? crowned(snapshot.constructors) : null;

  if (!seasonOver) {
    return {
      phase: "calendar",
      showingNextSeason: false,
      featured: currentUpcoming[0] ?? null,
      remaining: currentUpcoming.slice(1),
      roundCount: snapshot.races.length,
      championDriver: null,
      championConstructor: null,
    };
  }

  const nextRaces = snapshot.nextSeason?.races ?? [];
  const nextUpcoming = nextRaces.filter((race) => isStillCurrent(race, now));
  if (nextUpcoming.length > 0) {
    return {
      phase: "calendar",
      showingNextSeason: true,
      featured: nextUpcoming[0] ?? null,
      remaining: nextUpcoming.slice(1),
      roundCount: nextRaces.length,
      championDriver,
      championConstructor,
    };
  }

  return {
    phase: "season-complete",
    showingNextSeason: false,
    featured: null,
    remaining: [],
    roundCount: snapshot.races.length,
    championDriver,
    championConstructor,
  };
}

export function countdownParts(target: Date, now: Date) {
  const remainingMs = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(remainingMs / 1000);
  return {
    elapsed: target.getTime() <= now.getTime(),
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function countdownPhrase(raceName: string, target: Date | null, now: Date): string {
  if (!target) return `${raceName} start time has not been published yet.`;
  if (target.getTime() <= now.getTime()) return `${raceName} race window is open.`;
  const { days, hours, minutes } = countdownParts(target, now);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`);
  if (hours > 0 || days > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  return `${raceName} starts in ${parts.join(" ")}.`;
}
