import { existsSync } from "node:fs";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const USER_AGENT = "f1-demo-anime/1.0.0";
const DEFAULT_API_ROOT = "https://api.jolpi.ca/ergast/f1";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_SNAPSHOT = path.resolve(HERE, "../src/data/snapshot.json");

const SESSION_FIELDS = [
  ["FirstPractice", "fp1", "Practice 1"],
  ["SecondPractice", "fp2", "Practice 2"],
  ["ThirdPractice", "fp3", "Practice 3"],
  ["SprintQualifying", "sprintQualifying", "Sprint Qualifying"],
  ["Sprint", "sprint", "Sprint"],
  ["Qualifying", "qualifying", "Qualifying"],
];

function apiRootFrom(options) {
  return (options.apiRoot ?? process.env.F1_API_BASE ?? DEFAULT_API_ROOT).replace(/\/$/, "");
}

function snapshotPathFrom(options) {
  return options.snapshotPath ?? process.env.F1_SNAPSHOT_PATH ?? DEFAULT_SNAPSHOT;
}

function sessionSortKey(date, time) {
  if (time) {
    const normalized = time.endsWith("Z") ? time : `${time}Z`;
    const value = Date.parse(`${date}T${normalized}`);
    if (!Number.isNaN(value)) return value;
  }
  const fallback = Date.parse(`${date}T23:59:59Z`);
  return Number.isNaN(fallback) ? 0 : fallback;
}

export function mapRace(race) {
  const sessions = [];
  for (const [field, id, label] of SESSION_FIELDS) {
    const value = race?.[field];
    if (value?.date) {
      sessions.push({
        id,
        label,
        date: value.date,
        time: value.time || null,
      });
    }
  }
  if (race?.date) {
    sessions.push({
      id: "race",
      label: "Race",
      date: race.date,
      time: race.time || null,
    });
  }
  sessions.sort((a, b) => sessionSortKey(a.date, a.time) - sessionSortKey(b.date, b.time));

  const location = race?.Circuit?.Location ?? {};
  return {
    season: Number(race?.season),
    round: Number(race?.round),
    raceName: race?.raceName ?? "Grand Prix",
    circuitId: race?.Circuit?.circuitId ?? "",
    circuitName: race?.Circuit?.circuitName ?? "",
    locality: location.locality ?? "",
    country: location.country ?? "",
    date: race?.date ?? "",
    time: race?.time || null,
    sessions,
  };
}

function positionRank(position) {
  const value = Number(position);
  return Number.isFinite(value) ? value : 1000;
}

function mapDriver(row) {
  const driver = row?.Driver ?? {};
  const constructor = row?.Constructors?.[0] ?? {};
  const code = driver.code || String(driver.familyName || "DRV").slice(0, 3).toUpperCase();
  return {
    position: String(row?.positionText || row?.position || ""),
    code,
    number: driver.permanentNumber ? String(driver.permanentNumber) : "",
    givenName: driver.givenName ?? "",
    familyName: driver.familyName ?? "",
    driverId: driver.driverId ?? code,
    nationality: driver.nationality ?? "",
    constructorId: constructor.constructorId ?? "",
    constructorName: constructor.name ?? "",
    points: String(row?.points ?? "0"),
    wins: String(row?.wins ?? "0"),
  };
}

function mapConstructor(row) {
  const constructor = row?.Constructor ?? {};
  return {
    position: String(row?.positionText || row?.position || ""),
    constructorId: constructor.constructorId ?? "",
    name: constructor.name ?? "Constructor",
    nationality: constructor.nationality ?? "",
    points: String(row?.points ?? "0"),
    wins: String(row?.wins ?? "0"),
  };
}

function mapRecent(race) {
  const results = Array.isArray(race?.Results) ? race.Results.slice(0, 3) : [];
  if (results.length === 0) return null;
  const location = race?.Circuit?.Location ?? {};
  return {
    season: Number(race.season),
    round: Number(race.round),
    raceName: race.raceName ?? "Grand Prix",
    date: race.date ?? "",
    time: race.time || null,
    locality: location.locality ?? "",
    country: location.country ?? "",
    podium: results.map((result) => ({
      position: String(result.positionText || result.position || ""),
      code: result.Driver?.code ?? "",
      givenName: result.Driver?.givenName ?? "",
      familyName: result.Driver?.familyName ?? "",
      constructorId: result.Constructor?.constructorId ?? "",
      constructorName: result.Constructor?.name ?? "",
      time: result.Time?.time ?? null,
      status: result.status ?? "",
    })),
  };
}

function raceStartMs(race) {
  if (race.time) {
    const normalized = race.time.endsWith("Z") ? race.time : `${race.time}Z`;
    const value = Date.parse(`${race.date}T${normalized}`);
    if (!Number.isNaN(value)) return value;
  }
  const end = Date.parse(`${race.date}T23:59:59Z`);
  return Number.isNaN(end) ? 0 : end;
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url.pathname}`);
  }
  return response.json();
}

async function getLimited(apiRoot, pathname) {
  const url = new URL(`${apiRoot}/${pathname}.json`);
  url.searchParams.set("limit", "100");
  const json = await getJson(url);
  const total = Number(json?.MRData?.total ?? 0);
  if (total > 100) {
    throw new Error(`${pathname} returned ${total} rows, above the snapshot page size`);
  }
  return json;
}

function standingsBlock(json, key) {
  const table = json?.MRData?.StandingsTable ?? {};
  const list = Array.isArray(table.StandingsLists) ? table.StandingsLists[0] : null;
  const rows = list && Array.isArray(list[key]) ? list[key] : [];
  return {
    season: list?.season ?? table.season ?? null,
    round: list?.round ?? table.round ?? null,
    rows,
  };
}

async function readPrevious(snapshotPath) {
  if (!existsSync(snapshotPath)) return null;
  try {
    return JSON.parse(await readFile(snapshotPath, "utf8"));
  } catch {
    return null;
  }
}

async function loadSnapshot(apiRoot, previous) {
  const [driverJson, constructorJson, scheduleJson] = await Promise.all([
    getLimited(apiRoot, "current/driverstandings"),
    getLimited(apiRoot, "current/constructorstandings"),
    getLimited(apiRoot, "current"),
  ]);

  const driverBlock = standingsBlock(driverJson, "DriverStandings");
  const constructorBlock = standingsBlock(constructorJson, "ConstructorStandings");
  const scheduleSeason = scheduleJson?.MRData?.RaceTable?.season ?? null;
  const races = (scheduleJson?.MRData?.RaceTable?.Races ?? []).map(mapRace);
  races.sort((a, b) => a.round - b.round);

  const drivers = driverBlock.rows.map(mapDriver).sort((a, b) => positionRank(a.position) - positionRank(b.position));
  const constructors = constructorBlock.rows
    .map(mapConstructor)
    .sort((a, b) => positionRank(a.position) - positionRank(b.position));

  if (races.length === 0 && drivers.length === 0) {
    throw new Error("Jolpica returned no races and no standings");
  }
  if (previous && Number(previous.season) === Number(driverBlock.season || constructorBlock.season || scheduleSeason)) {
    if ((previous.drivers?.length ?? 0) > 0 && drivers.length === 0) {
      throw new Error("Driver standings came back empty for the current season");
    }
    if ((previous.races?.length ?? 0) > 0 && races.length === 0) {
      throw new Error("Race calendar came back empty for the current season");
    }
  }

  const season = Number(driverBlock.season || constructorBlock.season || scheduleSeason);
  if (!Number.isFinite(season)) {
    throw new Error("Jolpica response did not include a season");
  }

  const now = Date.now();
  const past = races.filter((race) => raceStartMs(race) < now);
  const recentRounds = past.slice(-3).reverse();
  const recentPayloads = await Promise.all(
    recentRounds.map(async (race) => {
      try {
        const json = await getLimited(apiRoot, `${race.season}/${race.round}/results`);
        const first = json?.MRData?.RaceTable?.Races?.[0];
        return mapRecent(first);
      } catch {
        return null;
      }
    }),
  );
  const recentResults = recentPayloads.filter(Boolean);

  let nextSeason = null;
  try {
    const nextJson = await getLimited(apiRoot, String(season + 1));
    const nextRaces = (nextJson?.MRData?.RaceTable?.Races ?? []).map(mapRace);
    nextRaces.sort((a, b) => a.round - b.round);
    nextSeason = { season: season + 1, races: nextRaces };
  } catch (error) {
    if (previous?.nextSeason?.season === season + 1) {
      nextSeason = previous.nextSeason;
    } else {
      console.warn(`[f1] Next season calendar unavailable: ${error.message}`);
    }
  }

  const round = Number(driverBlock.round ?? constructorBlock.round);
  return {
    fetchedAt: new Date().toISOString(),
    source: `${DEFAULT_API_ROOT}/`,
    sourceName: "Jolpica-F1",
    season,
    standingsRound: Number.isFinite(round) ? round : null,
    drivers,
    constructors,
    races,
    recentResults,
    nextSeason,
  };
}

export async function refreshSnapshot(options = {}) {
  const snapshotPath = snapshotPathFrom(options);
  const apiRoot = apiRootFrom(options);
  const previous = await readPrevious(snapshotPath);

  try {
    const snapshot = await loadSnapshot(apiRoot, previous);
    const tmpPath = `${snapshotPath}.tmp`;
    await writeFile(tmpPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    await rename(tmpPath, snapshotPath);
    return {
      ok: true,
      fatal: false,
      error: "",
      summary: `${snapshot.season}: ${snapshot.drivers.length} drivers, ${snapshot.constructors.length} constructors, ${snapshot.races.length} races, ${snapshot.recentResults.length} recent results`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (previous) {
      return {
        ok: false,
        fatal: false,
        error: `Could not refresh Formula 1 data (${message}).`,
        summary: "",
      };
    }
    return {
      ok: false,
      fatal: true,
      error: `Could not refresh Formula 1 data (${message}) and no snapshot exists yet.`,
      summary: "",
    };
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = await refreshSnapshot();
  if (result.ok) {
    console.log(result.summary);
  } else {
    console.warn(result.error);
    process.exit(result.fatal ? 1 : 0);
  }
}
