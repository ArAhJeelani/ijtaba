import { test } from "node:test";
import assert from "node:assert/strict";
import { searchMasjids } from "./masjidSearch.ts";
const data = [
  { id: "quba-ajax", name: "Masjid Quba", city: "Ajax" },
  { id: "aqsaa-ajax", name: "Masjid al Aqsaa", city: "Ajax" },
  {
    id: "toronto-adelaide",
    name: "Masjid Toronto · Adelaide",
    city: "Toronto",
  },
  { id: "usman-pickering", name: "Masjid Usman", city: "Pickering" },
];
test("searches cities, names, aliases and small spelling mistakes", () => {
  for (const query of [" AQSA ", "alaqsa", "aqsaa ajax"])
    assert.equal(searchMasjids(data, query)[0]?.id, "aqsaa-ajax");
  assert.equal(searchMasjids(data, "masjud quba")[0]?.id, "quba-ajax");
  assert.equal(searchMasjids(data, "pickering")[0]?.id, "usman-pickering");
  assert.equal(searchMasjids(data, "adelaid")[0]?.id, "toronto-adelaide");
  assert.equal(searchMasjids(data, "ajax").length, 2);
});
test("requires all words to match and never invents a masjid", () => {
  for (const query of ["", "   ", "quba pickering", "london", "z".repeat(80)])
    assert.deepEqual(searchMasjids(data, query), []);
});
