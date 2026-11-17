export const cities = [
  { id: "toronto", name: "Toronto", latitude: 43.6532, longitude: -79.3832 },
  {
    id: "mississauga",
    name: "Mississauga",
    latitude: 43.589,
    longitude: -79.6441,
  },
  { id: "brampton", name: "Brampton", latitude: 43.7315, longitude: -79.7624 },
  { id: "markham", name: "Markham", latitude: 43.8561, longitude: -79.337 },
  {
    id: "pickering",
    name: "Pickering",
    latitude: 43.8384,
    longitude: -79.0868,
  },
  { id: "ajax", name: "Ajax", latitude: 43.8509, longitude: -79.0204 },
  { id: "oshawa", name: "Oshawa", latitude: 43.8971, longitude: -78.8658 },
];
const zone = "America/Toronto";
export function validDate(date) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date + "T12:00:00Z")) ||
    new Date(date + "T12:00:00Z").toISOString().slice(0, 10) !== date
  )
    throw new Error("Choose a valid evening date.");
  return date;
}
export function parseDay(body, date) {
  const data = body?.data;
  if (
    body?.code !== 200 ||
    data?.date?.gregorian?.date !== date.split("-").reverse().join("-") ||
    data?.meta?.timezone !== zone ||
    data?.meta?.method?.id !== 2
  )
    throw new Error(
      "Prayer-time response could not be verified. Please enter your times manually.",
    );
  const result = {};
  for (const prayer of ["Maghrib", "Fajr"]) {
    const value = data.timings?.[prayer];
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(value) ||
      !value.startsWith(date + "T") ||
      !Number.isFinite(Date.parse(value))
    )
      throw new Error(
        "Invalid prayer time received. Please enter your times manually.",
      );
    result[prayer] = value;
  }
  return result;
}
const cache = new Map(),
  pending = new Map();
async function day(city, date) {
  const key = city.id + date,
    existing = cache.get(key);
  if (existing && Date.now() - existing.fetchedAt < 3600000) return existing;
  if (pending.has(key)) return pending.get(key);
  const promise = (async () => {
    const params = new URLSearchParams({
      latitude: String(city.latitude),
      longitude: String(city.longitude),
      method: "2",
      timezonestring: zone,
      iso8601: "true",
    });
    const response = await fetch(
      `https://api.aladhan.com/v1/timings/${date.split("-").reverse().join("-")}?${params}`,
      { signal: AbortSignal.timeout(12000) },
    );
    if (!response.ok)
      throw new Error(
        "Prayer times are temporarily unavailable. Please enter your times manually.",
      );
    const value = {
      ...parseDay(await response.json(), date),
      fetchedAt: Date.now(),
    };
    if (cache.size >= 250) cache.delete(cache.keys().next().value);
    cache.set(key, value);
    return value;
  })();
  pending.set(key, promise);
  try {
    return await promise;
  } finally {
    pending.delete(key);
  }
}
export function nightResult(city, date, evening, morning) {
  const maghrib = evening.Maghrib,
    fajr = morning.Fajr,
    duration = Date.parse(fajr) - Date.parse(maghrib);
  if (!Number.isFinite(duration) || duration <= 0 || duration >= 86400000)
    throw new Error(
      "Invalid night duration. Please enter your times manually.",
    );
  return {
    city: city.name,
    date,
    maghrib,
    fajr,
    start: new Date(Date.parse(fajr) - duration / 3).toISOString(),
    timeZone: zone,
    method: "Islamic Society of North America (ISNA)",
    source: "https://aladhan.com/prayer-times-api",
    fetchedAt: new Date(
      Math.min(evening.fetchedAt, morning.fetchedAt),
    ).toISOString(),
  };
}
export async function getCityNight(id, date) {
  const city = cities.find((c) => c.id === id);
  if (!city) throw new Error("Choose a listed GTA city.");
  validDate(date);
  const next = new Date(Date.parse(date + "T12:00:00Z") + 86400000)
    .toISOString()
    .slice(0, 10);
  const [evening, morning] = await Promise.all([
    day(city, date),
    day(city, next),
  ]);
  return nightResult(city, date, evening, morning);
}
export async function cityMiddleware(req, res, next) {
  const url = new URL(req.url, "http://localhost");
  if (!url.pathname.startsWith("/api/")) return next();
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "GET requests only." }));
    return;
  }
  try {
    if (url.pathname === "/api/cities") {
      res.end(JSON.stringify(cities.map(({ id, name }) => ({ id, name }))));
      return;
    }
    if (url.pathname !== "/api/tahajjud") {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "Not found." }));
      return;
    }
    res.end(
      JSON.stringify(
        await getCityNight(
          url.searchParams.get("city") || "",
          url.searchParams.get("date") || "",
        ),
      ),
    );
  } catch (e) {
    res.statusCode = 422;
    res.end(
      JSON.stringify({
        error:
          e.name === "TimeoutError" || e.message === "fetch failed"
            ? "Could not reach prayer times. Try again or use manual entry below."
            : e.message,
      }),
    );
  }
}
