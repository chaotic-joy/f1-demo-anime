import type { CSSProperties } from "react";
import type { RecentResult } from "../data/types.ts";
import { formatRaceDay } from "../lib/format.ts";
import { teamColor } from "../lib/teams.ts";

export function RecentResults({ results }: { results: RecentResult[] }) {
  return (
    <section className="block" id="results" aria-labelledby="results-title">
      <div className="section-heading">
        <h2 id="results-title">
          <span className="panel-no">04</span>
          Recent results
        </h2>
        <p>Podiums from the latest classified races in this snapshot.</p>
      </div>
      {results.length === 0 ? (
        <p className="empty-note">No classified races in this snapshot yet.</p>
      ) : (
        <ul className="results">
          {results.map((race) => (
            <li key={`${race.season}-${race.round}`} className="result-card">
              <p className="round-flag">R{String(race.round).padStart(2, "0")}</p>
              <h3>{race.raceName}</h3>
              <p className="when">{formatRaceDay(race.date, race.time)}</p>
              <p>
                {race.locality}, {race.country}
              </p>
              <ul className="podium">
                {race.podium.map((entry) => (
                  <li key={`${entry.position}-${entry.code}`} style={{ "--team": teamColor(entry.constructorId) } as CSSProperties}>
                    <span className="pos">{entry.position}</span>
                    <span>
                      <span className="name">
                        {entry.code ? `${entry.code} ` : ""}
                        {entry.familyName}
                      </span>
                      <span className="meta">{entry.constructorName}</span>
                    </span>
                    <span className="result-time">{entry.time ?? entry.status}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
