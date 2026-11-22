import type { Board } from "../lib/schedule.ts";
import { formatPoints } from "../lib/format.ts";

export function ChampionRibbon({ season, board }: { season: number; board: Board }) {
  if (!board.showingNextSeason) return null;
  const driver = board.championDriver;
  const constructor = board.championConstructor;
  return (
    <aside className="ribbon" aria-label={`${season} champions`}>
      <p>
        <span className="ribbon-kicker">Season complete</span>
        {driver ? (
          <>
            {" "}
            {season} drivers' champion <strong>{`${driver.givenName} ${driver.familyName}`}</strong>
            {" · "}
            {formatPoints(driver.points)} pts · {formatPoints(driver.wins)} wins.
          </>
        ) : (
          <> The {season} drivers' title is still unconfirmed.</>
        )}
        {constructor ? (
          <>
            {" "}
            Constructors' champion <strong>{constructor.name}</strong>
            {" · "}
            {formatPoints(constructor.points)} pts.
          </>
        ) : null}{" "}
        The {board.featured?.season} calendar is up next.
      </p>
    </aside>
  );
}
