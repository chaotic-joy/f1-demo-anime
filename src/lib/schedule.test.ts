import assert from "node:assert/strict";
import test from "node:test";
import type { Race, Snapshot } from "../data/types.ts";
import {
  countdownParts,
  countdownPhrase,
  isStillCurrent,
  resolveBoard,
  sessionViews,
} from "./schedule.ts";

function race(overrides: Partial<Race> = {}): Race {
  return {
    season: 2026,
    round: 1,
    raceName: "Test Grand Prix",
    circuitId: "test",
    circuitName: "Test Circuit",
    locality: "Test City",
    country: "Testland",
    date: "2026-06-01",
    time: "12:00:00Z",
    sessions: [
      { id: "fp1", label: "Practice 1", date: "2026-05-30", time: "10:00:00Z" },
      { id: "qualifying", label: "Qualifying", date: "2026-05-31", time: "14:00:00Z" },
      { id: "race", label: "Race", date: "2026-06-01", time: "12:00:00Z" },
    ],
    ...overrides,
  };
}

function snapshot(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    fetchedAt: "2026-06-01T00:00:00.000Z",
    source: "https://api.jolpi.ca/ergast/f1/",
    sourceName: "Jolpica-F1",
    season: 2026,
    standingsRound: 8,
    drivers: [
      {
        position: "1",
        code: "ANT",
        number: "12",
        givenName: "Andrea Kimi",
        familyName: "Antonelli",
        driverId: "antonelli",
        nationality: "Italian",
        constructorId: "mercedes",
        constructorName: "Mercedes",
        points: "200",
        wins: "4",
      },
    ],
    constructors: [
      {
        position: "1",
        constructorId: "mercedes",
        name: "Mercedes",
        nationality: "German",
        points: "320",
        wins: "6",
      },
    ],
    races: [race({ round: 1, date: "2026-03-08", time: "04:00:00Z" }), race({ round: 2 })],
    recentResults: [],
    nextSeason: { season: 2027, races: [] },
    ...overrides,
  };
}

test("a race stays current through the race window", () => {
  const upcoming = race();
  assert.equal(isStillCurrent(upcoming, new Date("2026-06-01T11:00:00Z")), true);
  assert.equal(isStillCurrent(upcoming, new Date("2026-06-01T14:30:00Z")), true);
  assert.equal(isStillCurrent(upcoming, new Date("2026-06-01T15:00:00Z")), false);
});

test("a date-only race stays current through that UTC day", () => {
  const dated = race({ time: null, date: "2027-03-07" });
  assert.equal(isStillCurrent(dated, new Date("2027-03-07T18:00:00Z")), true);
  assert.equal(isStillCurrent(dated, new Date("2027-03-08T00:00:00Z")), false);
});

test("in season the next race is featured and later rounds remain", () => {
  const board = resolveBoard(snapshot(), new Date("2026-05-01T00:00:00Z"));
  assert.equal(board.phase, "calendar");
  assert.equal(board.showingNextSeason, false);
  assert.equal(board.featured?.round, 2);
  assert.equal(board.remaining.length, 0);
  assert.equal(board.championDriver, null);
});

test("after the finale, a published next calendar leads and the champion is named", () => {
  const board = resolveBoard(
    snapshot({
      nextSeason: { season: 2027, races: [race({ season: 2027, round: 1, date: "2027-03-07", time: "04:00:00Z" })] },
    }),
    new Date("2026-12-20T00:00:00Z"),
  );
  assert.equal(board.showingNextSeason, true);
  assert.equal(board.featured?.season, 2027);
  assert.equal(board.championDriver?.familyName, "Antonelli");
  assert.equal(board.championConstructor?.name, "Mercedes");
});

test("after the finale with no next calendar, the season is complete", () => {
  const board = resolveBoard(snapshot({ nextSeason: { season: 2027, races: [] } }), new Date("2026-12-20T00:00:00Z"));
  assert.equal(board.phase, "season-complete");
  assert.equal(board.featured, null);
  assert.equal(board.championDriver?.code, "ANT");
});

test("a scoreless table does not invent a champion", () => {
  const data = snapshot({
    drivers: [{ ...snapshot().drivers[0], points: "0", wins: "0" }],
    constructors: [{ ...snapshot().constructors[0], points: "0", wins: "0" }],
    nextSeason: null,
  });
  const board = resolveBoard(data, new Date("2026-12-20T00:00:00Z"));
  assert.equal(board.phase, "season-complete");
  assert.equal(board.championDriver, null);
  assert.equal(board.championConstructor, null);
});

test("session states mark the next future session and an open race", () => {
  const views = sessionViews(race(), new Date("2026-05-31T12:00:00Z"));
  assert.deepEqual(
    views.map((session) => [session.id, session.state]),
    [
      ["fp1", "done"],
      ["qualifying", "up-next"],
      ["race", "later"],
    ],
  );

  const live = sessionViews(race(), new Date("2026-06-01T12:30:00Z"));
  assert.equal(live.find((session) => session.id === "race")?.state, "underway");
  assert.equal(live.find((session) => session.id === "qualifying")?.state, "done");
});

test("countdown phrase stays coarse enough for a polite live region", () => {
  const target = new Date("2026-11-22T04:00:00Z");
  const now = new Date("2026-11-22T00:45:00Z");
  const parts = countdownParts(target, now);
  assert.equal(parts.elapsed, false);
  assert.equal(parts.hours, 3);
  assert.equal(parts.minutes, 15);
  assert.equal(countdownPhrase("Las Vegas Grand Prix", target, now), "Las Vegas Grand Prix starts in 3 hours 15 minutes.");
  assert.match(countdownPhrase("Las Vegas Grand Prix", target, new Date("2026-11-22T05:00:00Z")), /race window is open/);
  assert.match(countdownPhrase("Australian Grand Prix", null, now), /has not been published/);
});
