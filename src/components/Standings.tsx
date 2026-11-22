import type { CSSProperties } from "react";
import type { ConstructorStanding, Snapshot } from "../data/types.ts";
import { formatPoints } from "../lib/format.ts";
import { teamColor } from "../lib/teams.ts";

export function Standings({ snapshot, finalStandings }: { snapshot: Snapshot; finalStandings: boolean }) {
  const roundLabel = snapshot.standingsRound ? `Standings round ${snapshot.standingsRound}` : "Current order";
  const note = finalStandings ? `Final ${snapshot.season} order · ${roundLabel}` : `${snapshot.season} · ${roundLabel}`;

  return (
    <section className="block" id="standings" aria-labelledby="standings-title">
      <div className="section-heading">
        <h2 id="standings-title">
          <span className="panel-no">03</span>
          Championship
        </h2>
        <p>{note}</p>
      </div>
      <div className="standings-grid">
        <Board
          title="Drivers' Championship"
          empty="Driver standings publish after the first classified race."
          rows={snapshot.drivers.map((driver) => ({
            key: driver.driverId,
            position: driver.position,
            code: driver.code,
            name: `${driver.givenName} ${driver.familyName}`,
            meta: driver.constructorName,
            points: driver.points,
            wins: driver.wins,
            color: teamColor(driver.constructorId),
          }))}
        />
        <Board
          title="Constructors' Championship"
          empty="Constructor standings publish after the first classified race."
          rows={snapshot.constructors.map((team) => ({
            key: team.constructorId,
            position: team.position,
            code: teamCode(team),
            name: team.name,
            meta: team.nationality,
            points: team.points,
            wins: team.wins,
            color: teamColor(team.constructorId),
          }))}
        />
      </div>
    </section>
  );
}

function teamCode(team: ConstructorStanding): string {
  const known: Record<string, string> = {
    mercedes: "MER",
    ferrari: "FER",
    red_bull: "RBR",
    mclaren: "MCL",
    rb: "RB",
    alpine: "ALP",
    haas: "HAA",
    audi: "AUD",
    williams: "WIL",
    aston_martin: "AMR",
    cadillac: "CAD",
  };
  return known[team.constructorId] ?? team.name.slice(0, 3).toUpperCase();
}

interface Row {
  key: string;
  position: string;
  code: string;
  name: string;
  meta: string;
  points: string;
  wins: string;
  color: string;
}

function Board({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  const headingId = title.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <article className="panel" aria-labelledby={headingId}>
      <header className="panel-head">
        <h3 id={headingId}>{title}</h3>
        <p>{rows.length} entries</p>
      </header>
      {rows.length === 0 ? (
        <p className="empty-note">{empty}</p>
      ) : (
        <ul className="board">
          {rows.map((row) => (
            <li key={row.key} className={`pos-${row.position}`} style={{ "--team": row.color } as CSSProperties}>
              <span className="pos">
                <span className="sr-only">Position </span>
                {row.position}
              </span>
              <span className="identity">
                <span className="who-line">
                  <span className="code">{row.code}</span>
                  <span className="name">{row.name}</span>
                </span>
                <span className="meta">
                  <span className="swatch" style={{ background: row.color }} aria-hidden="true" />
                  {row.meta}
                </span>
              </span>
              <span className="stats">
                <span className="points">
                  <strong>{formatPoints(row.points)}</strong>
                  <span className="unit"> pts</span>
                </span>
                <span className="wins">{winLabel(row.wins)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function winLabel(wins: string): string {
  const value = Number(wins);
  if (!Number.isFinite(value)) return `${wins} wins`;
  return `${formatPoints(wins)} ${value === 1 ? "win" : "wins"}`;
}
