import { formatWhen, localTimeZone, padTime } from "../lib/format.ts";
import { countdownParts, countdownPhrase, parseInstant, sessionViews, type Board } from "../lib/schedule.ts";
import { SpeedLines } from "./SpeedLines.tsx";

const STATE_LABEL = {
  done: "Done",
  "up-next": "Up next",
  later: "Later",
  tbd: "Time later",
  underway: "Underway",
} as const;

export function Hero({ board, now }: { board: Board; now: Date }) {
  const race = board.featured;
  if (!race) return null;

  const start = parseInstant(race.date, race.time);
  const parts = start ? countdownParts(start, now) : null;
  const sessions = sessionViews(race, now);
  const upNext = sessions.find((session) => session.state === "up-next");
  const zone = localTimeZone();

  return (
    <section className="hero" id="next-race" aria-labelledby="next-race-title">
      <SpeedLines />
      <p className="spine" lang="ja" aria-hidden="true">
        次のグランプリ
      </p>
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="panel-no">01</span>
          Next Grand Prix
          {board.roundCount > 0 ? ` · Round ${race.round} / ${board.roundCount}` : ` · Round ${race.round}`}
          {board.showingNextSeason ? ` · ${race.season}` : ""}
        </p>
        <h2 id="next-race-title" className="race-name">
          {race.raceName}
        </h2>
        <p className="circuit">{race.circuitName}</p>
        <p className="place">
          {race.locality}, {race.country}
        </p>
        <p className="sr-only" aria-live="polite">
          {countdownPhrase(race.raceName, start, now)}
        </p>
        <div aria-hidden="true">
          {parts && !parts.elapsed ? (
            <>
              <p className="countdown-caption">Countdown to the race start</p>
              <div className="ticks">
                <Tick value={padTime(parts.days)} label="Days" />
                <Tick value={padTime(parts.hours)} label="Hours" />
                <Tick value={padTime(parts.minutes)} label="Min" />
                <Tick value={padTime(parts.seconds)} label="Sec" />
              </div>
            </>
          ) : null}
          {parts?.elapsed ? <p className="underway-banner">Race window is open</p> : null}
          {!start ? <p className="tbd">Start time has not been published yet. Race day {race.date} UTC.</p> : null}
        </div>
        {upNext && upNext.id !== "race" && upNext.start ? (
          <p className="up-next-line">
            Up next: {upNext.label} · {formatWhen(upNext.start)}
          </p>
        ) : null}
      </div>
      <div className="session-panel">
        <h3>Weekend schedule</h3>
        <ol className="sessions">
          {sessions.map((session) => (
            <li key={session.id} className={`session state-${session.state}`}>
              <div className="session-top">
                <span className="session-name">{session.label}</span>
                <span className={`tag tag-${session.state}`}>{STATE_LABEL[session.state]}</span>
              </div>
              <p className="session-time">
                {session.start ? formatWhen(session.start) : `${session.date} · time not published`}
              </p>
            </li>
          ))}
        </ol>
        <p className="zone">Times in your local zone · {zone}</p>
      </div>
    </section>
  );
}

function Tick({ value, label }: { value: string; label: string }) {
  return (
    <div className="tick">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
