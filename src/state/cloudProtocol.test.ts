import assert from "node:assert/strict";
import test from "node:test";
import { classifyWrite, hasOrganizerData } from "./cloudProtocol.ts";
import { emptyData } from "./organizerStorage.ts";
import { exportOrganizerBackup, parseOrganizerBackup } from "./organizerBackup.ts";

test("the cloud write can recognize a previously committed request after a lost response", () => {
  assert.equal(classifyWrite("same-id", "same-id"), "saved");
  assert.equal(classifyWrite("same-id", "another-id"), "conflict");
  assert.equal(classifyWrite("same-id", null), "conflict");
});

test("migration preserves personal IDs and relationships through the existing backup validator", () => {
  const catalog: [] = [];
  const data = emptyData();
  const id = "local-prayer";
  data.personal.push({ id, title: "Title", translation: "Prayer", reference: "Personal", category: "Personal", context: "", personal: true });
  data.collections.push({ id: "group", name: "My group", createdAt: "2026-11-24T00:00:00Z" });
  data.memberships.push({ collectionId: "group", duaId: id });
  data.days["2026-11-24"] = [id];
  assert.equal(hasOrganizerData(emptyData()), false);
  assert.equal(hasOrganizerData(data), true);
  const migrationCopy = parseOrganizerBackup(exportOrganizerBackup(data), catalog);
  assert.deepEqual(migrationCopy, data);
  assert.notEqual(migrationCopy, data);
});
