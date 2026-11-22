import { formatRaceDay } from "../lib/format.ts";
import type { Board } from "../lib/schedule.ts";

export function Calendar({ board }: { board: Board }) {
  if (board.phase !== "calendar") return null;
  const season = board.featured?.season;

  return (
    <section className="block" id="calendar" aria-labelledby="calendar-title">
      <div className="section-heading">
        <h2 id="calendar-title">
          <span className="panel-no">02</span>
          Remaining calendar
        </h2>
        {season ? <p>Rounds after the featured Grand Prix · {season}</p> : null}
      </div>
      {board.remaining.length === 0 ? (
        <p className="empty-note">This is the last round on the published calendar.</p>
      ) : (
        <ul className="calendar">
          {board.remaining.map((race) => (
            <li key={`${race.season}-${race.round}`} className="race-card">
              <p className="round-flag">R{String(race.round).padStart(2, "0")}</p>
              <h3>{race.raceName}</h3>
              <p>
                {race.locality}, {race.country}
              </p>
              <p className="when">{formatRaceDay(race.date, race.time)}</p>
              {!race.time ? <p className="when-note">Start time not published. Date shown in UTC.</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
