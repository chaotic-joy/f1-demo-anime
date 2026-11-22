import { useEffect, useState } from "react";
import { Calendar } from "./components/Calendar.tsx";
import { ChampionRibbon } from "./components/ChampionRibbon.tsx";
import { Checker } from "./components/Checker.tsx";
import { Hero } from "./components/Hero.tsx";
import { Masthead } from "./components/Masthead.tsx";
import { RecentResults } from "./components/RecentResults.tsx";
import { SeasonComplete } from "./components/SeasonComplete.tsx";
import { Standings } from "./components/Standings.tsx";
import { snapshot } from "./data/load.ts";
import { formatUpdated, localTimeZone } from "./lib/format.ts";
import { resolveBoard } from "./lib/schedule.ts";

export function App() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const board = resolveBoard(snapshot, now);
  const featuredKey = board.featured ? `${board.featured.season}-${board.featured.round}` : "complete";

  useEffect(() => {
    const featured = board.featured;
    document.title = featured
      ? `${featured.raceName} — Full Throttle`
      : `${snapshot.season} season complete — Full Throttle`;
  }, [featuredKey, board.featured, snapshot.season]);

  const finalStandings = board.showingNextSeason || board.phase === "season-complete";

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="topbar">
        <span>Full Throttle</span>
        <span>Formula 1 desk</span>
        <span>Daily snapshot</span>
      </div>
      <Checker />
      <div className="wrap">
        <Masthead snapshot={snapshot} board={board} />
        <main id="main">
          <ChampionRibbon season={snapshot.season} board={board} />
          {board.phase === "season-complete" ? (
            <SeasonComplete snapshot={snapshot} board={board} />
          ) : (
            <Hero board={board} now={now} />
          )}
          <Calendar board={board} />
          <Standings snapshot={snapshot} finalStandings={finalStandings} />
          <RecentResults results={snapshot.recentResults} />
        </main>
        <footer className="colophon">
          <p>
            Last updated <time dateTime={snapshot.fetchedAt}>{formatUpdated(snapshot.fetchedAt)}</time>
          </p>
          <p>
            Standings, the calendar, and recent podiums come from{" "}
            <a href="https://api.jolpi.ca/ergast/f1/">Jolpica-F1</a> at build time and are baked into this page. A
            daily redeploy refreshes them. Session times use your device time zone ({localTimeZone()}).
          </p>
        </footer>
      </div>
    </>
  );
}
