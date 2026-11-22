import type { CSSProperties } from "react";
import type { Snapshot } from "../data/types.ts";
import { formatPoints } from "../lib/format.ts";
import type { Board } from "../lib/schedule.ts";
import { teamColor } from "../lib/teams.ts";
import { SpeedLines } from "./SpeedLines.tsx";

export function SeasonComplete({ snapshot, board }: { snapshot: Snapshot; board: Board }) {
  const driver = board.championDriver;
  const constructor = board.championConstructor;
  const nextSeason = snapshot.nextSeason?.season ?? snapshot.season + 1;

  return (
    <section className="hero season-complete" id="next-race" aria-labelledby="complete-title">
      <SpeedLines />
      <div className="hero-copy complete-copy">
        <p className="eyebrow">
          <span className="panel-no">01</span>
          {snapshot.season} checkered flag
        </p>
        <h2 id="complete-title" className="race-name">
          Season complete
        </h2>
        <p className="place">The {nextSeason} calendar has not been published yet.</p>
        <div className="champ-grid">
          <article className="champ-card" style={{ "--team": teamColor(driver?.constructorId ?? "") } as CSSProperties}>
            <p>Drivers' champion</p>
            {driver ? (
              <>
                <h3>
                  {driver.givenName} {driver.familyName}
                </h3>
                <p>{driver.constructorName}</p>
                <p className="champ-stats">
                  <strong>{formatPoints(driver.points)}</strong> points · <strong>{formatPoints(driver.wins)}</strong> wins
                </p>
              </>
            ) : (
              <h3>Title pending</h3>
            )}
          </article>
          <article
            className="champ-card"
            style={{ "--team": teamColor(constructor?.constructorId ?? "") } as CSSProperties}
          >
            <p>Constructors' champion</p>
            {constructor ? (
              <>
                <h3>{constructor.name}</h3>
                <p>{constructor.nationality}</p>
                <p className="champ-stats">
                  <strong>{formatPoints(constructor.points)}</strong> points · <strong>{formatPoints(constructor.wins)}</strong>{" "}
                  wins
                </p>
              </>
            ) : (
              <h3>Title pending</h3>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
