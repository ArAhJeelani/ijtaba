import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

const alice = "10000000-0000-4000-8000-000000000001";
const bob = "10000000-0000-4000-8000-000000000002";
const first = "20000000-0000-4000-8000-000000000001";
const second = "20000000-0000-4000-8000-000000000002";

test("organizer migration isolates owners and guards concurrent writes in PostgreSQL", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated;
      insert into auth.users values ('${alice}'), ('${bob}');
    `);
    await db.exec(await readFile(new URL("../supabase/migrations/20261124000100_organizers.sql", import.meta.url), "utf8"));
    const authenticate = async (id) => {
      await db.exec("reset role; set role authenticated");
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
    };
    const insert = (id, payload) => db.query(
      "insert into organizers (owner_id, mutation_id, payload) values ($1, $2, $3)",
      [id, first, JSON.stringify(payload)],
    );
    const read = () => db.query("select owner_id, revision, payload, mutation_id from organizers");
    const save = (id, revision, payload) => db.query(
      "update organizers set revision = $2 + 1, mutation_id = $3, payload = $4 where owner_id = $1 and revision = $2 returning revision",
      [id, revision, second, JSON.stringify(payload)],
    );
    const privateData = {
      version: 2,
      personal: [{ id: "p1", translation: "Private test prayer" }],
      collections: [{ id: "c1" }],
      memberships: [{ collectionId: "c1", duaId: "p1" }],
      schedules: [{ target: { kind: "collection", id: "c1" } }],
    };
    await authenticate(alice);
    await insert(alice, privateData);
    await assert.rejects(() => insert(alice, privateData), { code: "23505" });
    await assert.rejects(() => insert(bob, { version: 2 }), { code: "42501" });
    await assert.rejects(() => db.query("update organizers set owner_id = $1", [bob]), { code: "42501" });
    assert.deepEqual((await read()).rows[0].payload, privateData);
    const revisionFromFirstSession = (await read()).rows[0].revision;

    await authenticate(bob);
    assert.deepEqual((await read()).rows, []);
    assert.deepEqual((await save(alice, 1, { version: 2 })).rows, []);
    assert.equal((await db.query("delete from organizers where owner_id = $1", [alice])).affectedRows, 0);
    await insert(bob, { version: 2 });
    assert.deepEqual((await read()).rows.map(row => row.owner_id), [bob]);
    await db.exec("reset role; set role anon");
    await assert.rejects(read, { code: "42501" });

    await authenticate(alice);
    await assert.rejects(() => db.query("update organizers set revision = 9"), { code: "P0001" });
    assert.deepEqual((await save(alice, 1, { ...privateData, days: { "2026-11-24": ["p1"] } })).rows, [{ revision: 2 }]);
    assert.deepEqual((await save(alice, revisionFromFirstSession, { version: 2 })).rows, []);
    assert.equal((await read()).rows[0].mutation_id, second);
    assert.deepEqual((await read()).rows[0].payload.days, { "2026-11-24": ["p1"] });
    assert.equal((await db.query("delete from organizers where owner_id = $1", [alice])).affectedRows, 1);
    await assert.rejects(() => insert(alice, { version: 1 }), { code: "23514" });
    await db.exec("reset role");
    await db.query("delete from auth.users where id = $1", [bob]);
    assert.deepEqual((await read()).rows, []);
  } finally {
    await db.close();
  }
});
