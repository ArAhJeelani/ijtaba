import assert from "node:assert/strict";
import test from "node:test";
import { duaMoments, visibleDuaMoments } from "../data/duaMoments.ts";

test("the du’a moments preview excludes entries awaiting source review", () => {
  const pending = duaMoments.filter((moment) => moment.reviewStatus === "pending");
  assert.ok(pending.length > 0);
  for (const moment of pending) {
    assert.ok(!visibleDuaMoments.some(({ id }) => id === moment.id));
  }
  for (const moment of visibleDuaMoments) {
    assert.ok(moment.summary.trim());
    assert.ok(moment.context.trim());
    assert.ok(moment.sources.length);
    for (const source of moment.sources) {
      assert.ok(source.label.trim());
      assert.equal(new URL(source.url).protocol, "https:");
    }
  }
});

test("the last-third feature links to the existing Tahajjud calculator", () => {
  const night = visibleDuaMoments.find((moment) => moment.group === "night");
  assert.equal(night?.action?.to, "/tahajjud#calculator");
});
