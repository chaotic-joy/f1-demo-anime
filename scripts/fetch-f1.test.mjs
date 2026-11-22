import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { mapRace, refreshSnapshot } from "./fetch-f1.mjs";

test("mapRace orders a sprint weekend by session time", () => {
  const race = mapRace({
    season: "2026",
    round: "2",
    raceName: "Chinese Grand Prix",
    date: "2026-03-15",
    time: "07:00:00Z",
    Circuit: {
      circuitId: "shanghai",
      circuitName: "Shanghai International Circuit",
      Location: { locality: "Shanghai", country: "China" },
    },
    FirstPractice: { date: "2026-03-13", time: "03:30:00Z" },
    SprintQualifying: { date: "2026-03-13", time: "07:30:00Z" },
    Sprint: { date: "2026-03-14", time: "03:00:00Z" },
    Qualifying: { date: "2026-03-14", time: "07:00:00Z" },
  });

  assert.deepEqual(
    race.sessions.map((session) => session.id),
    ["fp1", "sprintQualifying", "sprint", "qualifying", "race"],
  );
  assert.equal(race.locality, "Shanghai");
  assert.equal(race.time, "07:00:00Z");
});

test("mapRace keeps a missing session time as null", () => {
  const race = mapRace({
    season: "2027",
    round: "1",
    raceName: "Australian Grand Prix",
    date: "2027-03-07",
    Circuit: { circuitId: "albert_park", circuitName: "Albert Park", Location: { locality: "Melbourne", country: "Australia" } },
    Qualifying: { date: "2027-03-06" },
  });
  assert.equal(race.time, null);
  assert.equal(race.sessions.at(-1)?.id, "race");
  assert.equal(race.sessions.find((session) => session.id === "qualifying")?.time, null);
});

test("a failed fetch keeps the committed snapshot", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "f1-snap-"));
  const snapshotPath = path.join(dir, "snapshot.json");
  const original = `${JSON.stringify({ fetchedAt: "keep-me" }, null, 2)}\n`;
  await writeFile(snapshotPath, original);

  const result = await refreshSnapshot({
    snapshotPath,
    apiRoot: "http://127.0.0.1:9",
  });

  assert.equal(result.ok, false);
  assert.equal(result.fatal, false);
  assert.equal(await readFile(snapshotPath, "utf8"), original);
});

test("a failed fetch with no snapshot is fatal", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "f1-empty-"));
  const result = await refreshSnapshot({
    snapshotPath: path.join(dir, "missing.json"),
    apiRoot: "http://127.0.0.1:9",
  });
  assert.equal(result.ok, false);
  assert.equal(result.fatal, true);
});
