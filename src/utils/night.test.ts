import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {calculateNight} from './night.ts';
test('last third crosses midnight',()=>{const n=calculateNight('2026-11-16T18:00:00-05:00','2026-11-17T06:00:00-05:00');assert.equal(n.start.toISOString(),'2026-11-17T07:00:00.000Z');assert.equal(n.third,4*3600000)});
test('DST follows elapsed time',()=>{const n=calculateNight('2026-10-31T18:00:00-04:00','2026-11-01T06:00:00-05:00');assert.equal(n.duration,13*3600000)});
test('rejects invalid order',()=>assert.throws(()=>calculateNight('2026-11-17T06:00','2026-11-16T18:00')));
