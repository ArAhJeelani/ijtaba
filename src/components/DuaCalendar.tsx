import { CalendarDays, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useCollection } from "../state/Collection";
import { calendarDate, collectionDate, dateKey, fullDate } from "../utils/calendar";
import { DuaCard } from "./DuaCard";
import "./dua-calendar.css";

const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short" });

export function DuaCalendar() {
  const [params, setParams] = useSearchParams();
  const collection = useCollection();
  const selected = collectionDate(params.get("date"));
  const day = dateKey(selected);
  const today = dateKey(new Date());
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const leading = calendarDate(year, month, 1).getDay();
  const length = calendarDate(year, month + 1, 0).getDate();
  const items = collection.itemsForDay(day);
  const select = (date: Date) => setParams({ date: dateKey(date) }, { replace: true });

  return (
    <main className="section page daily-page">
      <div className="section-heading">
        <span className="eyebrow">YOUR DAILY COLLECTIONS</span>
        <h2>Du’a Calendar</h2>
        <p>Pick a date and gather the du’as you want to return to that day.</p>
      </div>
      <div className="daily-layout">
        <section className="daily-calendar" aria-label="Choose a collection date">
          <div className="daily-month">
            <button type="button" aria-label="Previous month" disabled={year === 0 && month === 0} onClick={() => select(calendarDate(year, month - 1, 1))}>
              <ChevronLeft size={20} />
            </button>
            <h3 aria-live="polite">{monthLabel.format(selected)}</h3>
            <button type="button" aria-label="Next month" disabled={year === 9999 && month === 11} onClick={() => select(calendarDate(year, month + 1, 1))}>
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="daily-grid">
            {Array.from({ length: 7 }, (_, i) => (
              <span className="daily-weekday" key={i}>{weekday.format(new Date(2024, 0, 7 + i))}</span>
            ))}
            {Array.from({ length: leading }, (_, i) => <span key={`blank-${i}`} aria-hidden="true" />)}
            {Array.from({ length }, (_, i) => {
              const date = calendarDate(year, month, i + 1);
              const key = dateKey(date);
              const count = collection.data.days[key]?.length ?? 0;
              return (
                <button
                  type="button"
                  className="daily-date"
                  key={key}
                  aria-pressed={key === day}
                  aria-current={key === today ? "date" : undefined}
                  aria-label={`${fullDate.format(date)}, ${count} ${count === 1 ? "du’a" : "du’as"}`}
                  onClick={() => select(date)}
                >
                  {i + 1}
                  {count > 0 && <small aria-hidden="true">{count}</small>}
                </button>
              );
            })}
          </div>
          <button type="button" className="underlined" onClick={() => select(new Date())}>
            <CalendarDays size={16} /> Go to today
          </button>
        </section>
        <section className="daily-selection" aria-label="Selected day’s collection">
          <div className="daily-selection-header">
            <div>
              <h3>{fullDate.format(selected)}</h3>
              <p className="small" aria-live="polite">{items.length} {items.length === 1 ? "du’a" : "du’as"} in this collection</p>
            </div>
            <Link className="button" to={`/discover?date=${day}`}>
              <ShoppingBag size={17} /> Browse du’as
            </Link>
          </div>
          {items.length ? items.map((dua) => (
            <DuaCard key={dua.id} dua={dua} day={day} dailyView />
          )) : <div className="empty"><p>No du’as collected for this day yet.</p></div>}
        </section>
      </div>
    </main>
  );
}
