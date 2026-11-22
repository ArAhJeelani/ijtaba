import { useEffect, useRef, useState } from "react";
import { useOnline } from "../state/useOnline";
type City = { id: string; name: string };
type Night = {
  city: string;
  date: string;
  maghrib: string;
  fajr: string;
  start: string;
  method: string;
  source: string;
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
export function CityCalculator() {
  const online = useOnline();
  const [cities, setCities] = useState<City[]>([]),
    [city, setCity] = useState(() => {
      try {
        return localStorage.getItem("ijabah.city") || "toronto";
      } catch {
        return "toronto";
      }
    });
  const [date, setDate] = useState(() =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()),
  );
  const [result, setResult] = useState<Night | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    setResult(null);
    setBusy(false);
    setError("");
    setCities([]);
    if (!online) return;

    const controller = new AbortController();
    fetch("/api/cities", { signal: controller.signal, cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const data = await r.json();
        if (!Array.isArray(data)) throw new Error();
        setCities(data);
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(
            "City lookup is unavailable. You can still enter times manually below.",
          );
      });
    return () => {
      controller.abort();
      request.current?.abort();
    };
  }, [online]);
  function reset() {
    request.current?.abort();
    setBusy(false);
    setResult(null);
    setError("");
  }
  async function calculate() {
    if (!online || !cities.some((c) => c.id === city) || !date) return;
    reset();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    try {
      const response = await fetch(
        `/api/tahajjud?city=${encodeURIComponent(city)}&date=${encodeURIComponent(date)}`,
        { signal: controller.signal, cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (!controller.signal.aborted) setResult(data);
    } catch (e) {
      if (!controller.signal.aborted)
        setError(
          e instanceof Error ? e.message : "Unable to load prayer times.",
        );
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <section
      className="calculator masjid-calculator"
      aria-labelledby="city-heading"
    >
      <div>
        <span className="eyebrow">YOUR CITY · GREATER TORONTO AREA</span>
        <h2 id="city-heading">Find your quiet hour.</h2>
        <p>
          Choose your city to find the last third of the night, from evening
          Maghrib to the following morning’s Fajr.
        </p>
        <p className="small">
          Calculated for the city centre using the ISNA method via AlAdhan.
          Times may differ from your masjid’s timetable. Toronto timezone and
          daylight saving are handled automatically.
        </p>
        <a className="underlined" href="#manual-times">
          Prefer your own times? Enter them below ↓
        </a>
      </div>
      {!online ? <p role="status">City prayer times need an internet connection. Enter your times manually below.</p> : <form
        onSubmit={(e) => {
          e.preventDefault();
          void calculate();
        }}
      >
        <label>
          Your GTA city
          <select
            value={city}
            disabled={!cities.length}
            onChange={(e) => {
              reset();
              setCity(e.target.value);
              try {
                localStorage.setItem("ijabah.city", e.target.value);
              } catch {
                /* Optional preference. */
              }
            }}
          >
            {!cities.length && <option>{error ? "City lookup unavailable" : "Loading cities…"}</option>}
            {cities.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Night beginning on
          <input
            type="date"
            required
            value={date}
            onChange={(e) => {
              reset();
              setDate(e.target.value);
            }}
          />
        </label>
        <button
          type="submit"
          className="button"
          disabled={busy || !cities.some((c) => c.id === city) || !date}
        >
          {busy ? "Calculating…" : "Find my last third"}{" "}
          <span aria-hidden="true">↗</span>
        </button>
        {error && <p role="alert">{error}</p>}
        {result && (
          <div className="result" role="status">
            <span className="eyebrow">CALCULATED TIMES · {result.city}</span>
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
              Method: {result.method}
              <br />
              <a
                className="timetable-source"
                href={result.source}
                target="_blank"
                rel="noreferrer"
              >
                Source: AlAdhan ↗
              </a>
            </p>
          </div>
        )}
      </form>}
    </section>
  );
}
