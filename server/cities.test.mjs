import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDay, nightResult, validDate, getCityNight } from "./cities.mjs";
const fixture = {
  code: 200,
  data: {
    date: { gregorian: { date: "17-11-2026" } },
    meta: { timezone: "America/Toronto", method: { id: 2 } },
    timings: {
      Maghrib: "2026-11-17T16:50:00-05:00",
      Fajr: "2026-11-17T05:51:00-05:00",
    },
  },
};
test("validates source date, timezone, method, and offset-bearing times", () => {
  assert.equal(
    parseDay(fixture, "2026-11-17").Maghrib,
    fixture.data.timings.Maghrib,
  );
  assert.throws(() => parseDay(fixture, "2026-11-18"));
  for (const mutate of [
    (f) => (f.data.meta.method.id = 3),
    (f) => (f.data.meta.timezone = "UTC"),
    (f) => (f.data.timings.Fajr = "05:51"),
  ]) {
    const f = structuredClone(fixture);
    mutate(f);
    assert.throws(() => parseDay(f, "2026-11-17"));
  }
});
test("calculates using following Fajr, not provider last-third value", () => {
  const n = nightResult(
    { name: "Toronto" },
    "2026-11-17",
    { Maghrib: "2026-11-17T18:00:00-05:00", fetchedAt: 0 },
    { Fajr: "2026-11-18T06:00:00-05:00", fetchedAt: 0 },
  );
  assert.equal(n.start, "2026-11-18T07:00:00.000Z");
});
test("handles DST offset change in night duration", () => {
  const n = nightResult(
    { name: "Toronto" },
    "2026-10-31",
    { Maghrib: "2026-10-31T18:00:00-04:00", fetchedAt: 0 },
    { Fajr: "2026-11-01T06:00:00-05:00", fetchedAt: 0 },
  );
  assert.equal(n.start, "2026-11-01T06:40:00.000Z");
});
test("rejects invalid dates and unknown cities before network access", async () => {
  assert.throws(() => validDate("2026-02-30"));
  await assert.rejects(getCityNight("unknown", "2026-11-17"));
});
