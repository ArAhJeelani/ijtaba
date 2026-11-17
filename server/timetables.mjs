// Each adapter reads an allowlisted, official source. Never accept arbitrary URLs.
export const masjids = [
  {
    id: "quba-ajax",
    name: "Masjid Quba",
    city: "Ajax",
    source: "https://www.ajaxmasjid.ca/",
    available: false,
    note: "Daily start times found. A dated next-day feed still needs verification.",
  },
  {
    id: "toronto-adelaide",
    name: "Masjid Toronto · Adelaide",
    city: "Toronto",
    source:
      "https://centres.macnet.ca/masjidtoronto/prayer-times-mac-masjid-toronto/",
    available: true,
    note: "Official timetable shared by Dundas and Adelaide.",
  },
  {
    id: "aqsaa-ajax",
    name: "Masjid al Aqsaa",
    city: "Ajax",
    source: "https://masjidalaqsaa.com/",
    available: false,
    note: "A provider timetable was found; its official linkage is awaiting verification.",
  },
  {
    id: "usman-pickering",
    name: "Masjid Usman · Pickering Islamic Centre",
    city: "Pickering",
    source: "https://masjid.ca/",
    available: false,
    note: "Connection pending — a Masjidal server API key from the masjid administrator is required.",
  },
];
export const zone = "America/Toronto";
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const clean = (s) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
export function dateKey(value) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value + "T12:00:00Z")) ||
    new Date(value + "T12:00:00Z").toISOString().slice(0, 10) !== value
  )
    throw new Error("Choose a valid evening date.");
  return value;
}
export function nextDate(value) {
  return new Date(Date.parse(dateKey(value) + "T12:00:00Z") + 86400000)
    .toISOString()
    .slice(0, 10);
}
export function localInstant(date, time) {
  dateKey(date);
  const match = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(time);
  if (!match || +match[1] < 1 || +match[1] > 12 || +match[2] > 59)
    throw new Error("Invalid time from the masjid.");
  const hour = (+match[1] % 12) + (match[3].toLowerCase() === "pm" ? 12 : 0);
  const wall = Date.parse(
    `${date}T${String(hour).padStart(2, "0")}:${match[2]}:00Z`,
  );
  // Determine the offset for this date, independently of the visitor/server zone.
  let instant = wall;
  for (let i = 0; i < 3; i++) {
    const offset = new Intl.DateTimeFormat("en", {
      timeZone: zone,
      timeZoneName: "longOffset",
    })
      .formatToParts(new Date(instant))
      .find((p) => p.type === "timeZoneName").value;
    const m = /GMT([+-])(\d{2}):(\d{2})/.exec(offset);
    if (!m) throw new Error("Unable to resolve Toronto timezone.");
    instant = wall - (m[1] === "-" ? -1 : 1) * (+m[2] * 60 + +m[3]) * 60000;
  }
  return new Date(instant).toISOString();
}
export function parseToronto(html) {
  const heads = [...html.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map((m) =>
    clean(m[1]),
  );
  const expected = [
    "Date",
    "Day",
    "Adhan",
    "Iqamah",
    "Sunrise",
    "Adhan",
    "Iqamah",
    "Adhan",
    "Iqamah",
    "Adhan",
    "Iqamah",
    "Adhan",
    "Iqamah",
  ];
  if (
    JSON.stringify(heads.slice(-13)) !== JSON.stringify(expected) ||
    !heads.includes("Fajr") ||
    !heads.includes("Maghrib")
  )
    throw new Error(
      "The masjid timetable format changed. Please use manual entry.",
    );
  const rows = new Map();
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (m) => clean(m[1]),
    );
    if (!cells.length) continue;
    const d = /^(\w+) (\d{1,2}), (\d{4})$/.exec(cells[0]);
    if (cells.length !== 13 || !d || !months.includes(d[1]))
      throw new Error("The masjid timetable could not be validated.");
    const key = dateKey(
      `${d[3]}-${String(months.indexOf(d[1]) + 1).padStart(2, "0")}-${d[2].padStart(2, "0")}`,
    );
    if (rows.has(key)) throw new Error("Duplicate timetable date.");
    rows.set(key, {
      fajr: localInstant(key, cells[2]),
      maghrib: localInstant(key, cells[9]),
    });
  }
  if (!rows.size) throw new Error("The masjid has not supplied a timetable.");
  return rows;
}
const cache = new Map(),
  pending = new Map();
async function monthTable(month) {
  const key = String(month),
    cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < 3600000) return cached;
  if (pending.has(key)) return pending.get(key);
  const request = (async () => {
    const url = `https://centres.macnet.ca/masjidtoronto/wp-admin/admin-ajax.php?action=get_monthly_timetable&month=${month}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "Ijabah/0.1 prayer timetable reader" },
    });
    if (!response.ok)
      throw new Error(
        "The masjid timetable is temporarily unavailable. Please use manual entry.",
      );
    const html = await response.text();
    if (html.length > 1000000)
      throw new Error("Unexpected timetable response.");
    const value = { rows: parseToronto(html), fetchedAt: Date.now() };
    cache.set(key, value);
    return value;
  })();
  pending.set(key, request);
  try {
    return await request;
  } finally {
    pending.delete(key);
  }
}
export async function getNight(id, date) {
  const masjid = masjids.find((m) => m.id === id);
  if (!masjid) throw new Error("Choose a supported GTA masjid.");
  if (!masjid.available) throw new Error(masjid.note);
  dateKey(date);
  const next = nextDate(date);
  const [evening, morning] = await Promise.all([
    monthTable(+date.slice(5, 7)),
    monthTable(+next.slice(5, 7)),
  ]);
  const maghrib = evening.rows.get(date)?.maghrib,
    fajr = morning.rows.get(next)?.fajr;
  if (!maghrib || !fajr)
    throw new Error(
      "Both dated prayer times are not published for this night. Please use manual entry.",
    );
  const duration = Date.parse(fajr) - Date.parse(maghrib);
  if (duration <= 0 || duration > 86400000)
    throw new Error("The published night duration could not be validated.");
  return {
    masjid,
    date,
    timeZone: zone,
    maghrib,
    fajr,
    start: new Date(Date.parse(fajr) - duration / 3).toISOString(),
    fetchedAt: new Date(
      Math.min(evening.fetchedAt, morning.fetchedAt),
    ).toISOString(),
  };
}
export async function timetableMiddleware(req, res, next) {
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
    if (url.pathname === "/api/masjids") {
      res.end(JSON.stringify(masjids));
      return;
    }
    if (url.pathname !== "/api/tahajjud") {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "Not found." }));
      return;
    }
    res.end(
      JSON.stringify(
        await getNight(
          url.searchParams.get("masjid") || "",
          url.searchParams.get("date") || "",
        ),
      ),
    );
  } catch (error) {
    res.statusCode = 422;
    res.end(
      JSON.stringify({
        error:
          error.name === "TimeoutError"
            ? "The masjid took too long to respond. Please try again or enter times manually."
            : error.message === "fetch failed"
              ? "Could not reach the masjid timetable. Please try again or enter times manually."
              : error.message,
      }),
    );
  }
}
