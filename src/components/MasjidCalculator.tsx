import { useEffect, useRef, useState } from "react";
import { searchMasjids } from "../utils/masjidSearch";
type Masjid = {
  id: string;
  name: string;
  city: string;
  source: string;
  available: boolean;
  note: string;
};
type Night = {
  masjid: Masjid;
  date: string;
  timeZone: string;
  maghrib: string;
  fajr: string;
  start: string;
  fetchedAt: string;
};
const format = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    timeZone: "America/Toronto",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function MasjidCalculator() {
  const [masjids, setMasjids] = useState<Masjid[]>([]),
    [selected, setSelected] = useState(() => {
      try {
        return localStorage.getItem("ijabah.masjid") || "";
      } catch {
        return "";
      }
    });
  const [query, setQuery] = useState(""),
    [searching, setSearching] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(today),
    [result, setResult] = useState<Night | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/masjids", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error();
        setMasjids(data);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(
            "Masjid lookup is unavailable. You can still enter times manually below.",
          );
      });
    return () => {
      controller.abort();
      request.current?.abort();
    };
  }, []);
  const masjid = masjids.find((m) => m.id === selected);
  const matches = searchMasjids(masjids, query);
  function choose(id: string) {
    reset();
    setSelected(id);
    setQuery("");
    setSearching(false);
    try {
      localStorage.setItem("ijabah.masjid", id);
    } catch {
      /* Saving is optional. */
    }
  }
  function reset() {
    request.current?.abort();
    setBusy(false);
    setResult(null);
    setError("");
  }
  async function calculate() {
    if (searching || !masjid?.available || !date) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch(
        `/api/tahajjud?masjid=${encodeURIComponent(selected)}&date=${date}`,
        { signal: controller.signal },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to load this timetable.");
      if (!controller.signal.aborted) setResult(data);
    } catch (e) {
      if (!controller.signal.aborted)
        setError(
          e instanceof Error ? e.message : "Unable to load this timetable.",
        );
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <section
      className="calculator masjid-calculator"
      aria-labelledby="masjid-heading"
    >
      <div>
        <span className="eyebrow">YOUR MASJID · GREATER TORONTO AREA</span>
        <h2 id="masjid-heading">A night close to home.</h2>
        <p>
          Find the last third of the night using your masjid’s published prayer
          start times.
        </p>
        <p className="small">
          We pair your evening’s Maghrib with the following morning’s Fajr. All
          times use Toronto’s timezone, including daylight saving changes.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void calculate();
        }}
      >
        {masjid && !searching ? (
          <div className="chosen-masjid">
            <span className="eyebrow">YOUR SAVED MASJID</span>
            <strong>{masjid.name}</strong>
            <span>
              {masjid.city} ·{" "}
              {masjid.available
                ? "Automatic times available"
                : "Automatic times not available yet"}
            </span>
            <button
              type="button"
              className="underlined"
              onClick={() => {
                reset();
                setSearching(true);
                setTimeout(() => searchInput.current?.focus(), 0);
              }}
            >
              Change masjid
            </button>
          </div>
        ) : (
          <div className="masjid-search">
            <label>
              Search GTA masjids
              <input
                ref={searchInput}
                type="search"
                maxLength={100}
                value={query}
                disabled={!masjids.length}
                placeholder="Try Quba, Adelaide, or Pickering"
                aria-describedby="masjid-search-help"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (matches.length === 1) choose(matches[0].id);
                  }
                }}
              />
            </label>
            <p id="masjid-search-help" className="small">
              Search our four listed GTA masjids by name or city. More locations
              will be added as their sources are verified.
            </p>
            {query.trim() && (
              <>
                <p className="small" role="status">
                  {matches.length
                    ? `${matches.length} ${matches.length === 1 ? "match" : "matches"} found. Choose your masjid below.`
                    : "No matching masjid yet. Try another spelling or city, or enter prayer times manually below."}
                </p>
                <ul className="masjid-search-results">
                  {matches.map((m) => (
                    <li key={m.id}>
                      <button type="button" onClick={() => choose(m.id)}>
                        <strong>{m.name}</strong>
                        <span>{m.city}</span>
                        <small>
                          {m.available
                            ? "Automatic times available"
                            : "Automatic times not available yet"}
                        </small>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {masjid && (
              <button
                type="button"
                className="underlined"
                onClick={() => {
                  setSearching(false);
                  setQuery("");
                }}
              >
                Keep {masjid.name}
              </button>
            )}
          </div>
        )}
        {masjid && (
          <p className="small">
            {masjid.note}{" "}
            <a
              className="timetable-source"
              href={masjid.source}
              target="_blank"
              rel="noreferrer"
            >
              View official timetable ↗
            </a>
          </p>
        )}
        <label>
          Night beginning on
          <input
            required
            type="date"
            value={date}
            onChange={(e) => {
              reset();
              setDate(e.target.value);
            }}
          />
        </label>
        <button
          className="button"
          type="submit"
          disabled={searching || !masjid?.available || busy || !date}
        >
          {busy ? "Checking the timetable…" : "Find my last third"}{" "}
          <span aria-hidden="true">↗</span>
        </button>
        {error && <p role="alert">{error}</p>}
        {result && (
          <div className="result" role="status">
            <span className="eyebrow">LAST THIRD · {result.masjid.name}</span>
            <h3>
              {format(result.start)}
              <br />
              to {format(result.fajr)}
            </h3>
            <p>
              Maghrib: {format(result.maghrib)}
              <br />
              Following Fajr: {format(result.fajr)}
            </p>
            <p className="small">
              Fetched {format(result.fetchedAt)}.{" "}
              <a
                className="timetable-source"
                href={result.masjid.source}
                target="_blank"
                rel="noreferrer"
              >
                Check source ↗
              </a>
            </p>
          </div>
        )}
      </form>
    </section>
  );
}
