import type { Snapshot } from "../data/types.ts";
import { formatPoints, formatUpdated } from "../lib/format.ts";
import type { Board } from "../lib/schedule.ts";

export function Masthead({ snapshot, board }: { snapshot: Snapshot; board: Board }) {
  const leader = snapshot.drivers[0];
  const leaderTeam = snapshot.constructors[0];
  const roundsLeft = board.featured ? board.remaining.length + 1 : 0;
  const nextLabel = board.phase === "season-complete" ? "Champion" : "Next race";

  return (
    <header className="masthead">
      <div className="brand">
        <p className="brand-kicker" lang="ja">
          フルスロットル
        </p>
        <h1>Full Throttle</h1>
        <p className="brand-sub">Formula 1 standings, the next Grand Prix, and the road ahead.</p>
      </div>
      <p className="updated">
        <span>Last updated</span>
        <time dateTime={snapshot.fetchedAt}>{formatUpdated(snapshot.fetchedAt)}</time>
      </p>
      <nav className="jumps" aria-label="On this page">
        <a href="#next-race">{nextLabel}</a>
        {board.phase === "calendar" ? <a href="#calendar">Calendar</a> : null}
        <a href="#standings">Standings</a>
        <a href="#results">Results</a>
      </nav>
      <ul className="facts">
        <li>
          <span>Season</span>
          <strong>{snapshot.season}</strong>
        </li>
        <li>
          <span>Drivers' leader</span>
          <strong>{leader ? `${leader.code} · ${formatPoints(leader.points)}` : "Pending"}</strong>
        </li>
        <li>
          <span>Constructors' leader</span>
          <strong>{leaderTeam ? `${leaderTeam.name} · ${formatPoints(leaderTeam.points)}` : "Pending"}</strong>
        </li>
        <li>
          <span>{board.showingNextSeason ? "Next season rounds" : "Rounds still ahead"}</span>
          <strong>{roundsLeft}</strong>
        </li>
      </ul>
    </header>
  );
}
