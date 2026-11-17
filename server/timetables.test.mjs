import { test } from "node:test";
import assert from "node:assert/strict";
import {
  localInstant,
  nextDate,
  dateKey,
  parseToronto,
  getNight,
} from "./timetables.mjs";
test("uses Toronto timezone independently of machine timezone", () => {
  assert.equal(
    localInstant("2026-11-17", "4:51 pm"),
    "2026-11-17T21:51:00.000Z",
  );
  assert.equal(
    localInstant("2026-07-17", "4:51 pm"),
    "2026-07-17T20:51:00.000Z",
  );
});
test("DST night measures real elapsed hours", () => {
  const start = localInstant("2026-10-31", "6:00 pm"),
    end = localInstant("2026-11-01", "6:00 am");
  assert.equal(Date.parse(end) - Date.parse(start), 13 * 3600000);
});
test("next morning crosses month, year and leap boundaries", () => {
  assert.equal(nextDate("2026-11-30"), "2026-12-01");
  assert.equal(nextDate("2026-12-31"), "2027-01-01");
  assert.equal(nextDate("2028-02-28"), "2028-02-29");
  assert.throws(() => dateKey("2026-02-30"));
});
const headers = [
  "November",
  "Fajr",
  "Zuhr",
  "Asr",
  "Maghrib",
  "Isha",
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
const row = [
  "November 17, 2026",
  "Tuesday",
  "5:53 am",
  "6:15 am",
  "7:14 am",
  "12:03 pm",
  "12:30 pm",
  "2:30 pm",
  "3:00 pm",
  "4:51 pm",
  "4:55 pm",
  "6:11 pm",
  "7:00 pm",
];
const fixture =
  headers.map((h) => `<th>${h}</th>`).join("") +
  "<tr>" +
  row.map((t) => `<td>${t}</td>`).join("") +
  "</tr>";
test("reads start column rather than iqamah and rejects layout changes", () => {
  const day = parseToronto(fixture).get("2026-11-17");
  assert.equal(day.fajr, "2026-11-17T10:53:00.000Z");
  assert.equal(day.maghrib, "2026-11-17T21:51:00.000Z");
  assert.throws(() =>
    parseToronto(fixture.replace("<th>Adhan</th>", "<th>Iqamah</th>")),
  );
  assert.throws(() => parseToronto(fixture.replace("5:53 am", "99:99 am")));
});
test("unverified and unknown masjids cannot silently fall back to estimates", async () => {
  await assert.rejects(getNight("usman-pickering", "2026-11-17"), /API key/);
  await assert.rejects(getNight("made-up", "2026-11-17"), /supported/);
});
