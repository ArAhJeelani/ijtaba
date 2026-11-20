import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {ScheduledDua,Repeat} from '../data/organizer.ts';
import {occursOn,nextOccurrence,addDays,validDay} from './schedules.ts';
const schedule=(frequency:Repeat,date='2026-11-18'):ScheduledDua=>({id:'s1',target:{kind:'dua',id:'knowledge'},date,time:'21:00',note:'Private note',paused:false,createdAt:'2026-11-18T12:00:00Z',recurrence:{frequency,weekdays:[1,5]}});
test('once, daily, weekly and selected weekdays respect first date',()=>{
  assert.equal(occursOn(schedule('once'),'2026-11-18'),true);
  assert.equal(occursOn(schedule('once'),'2026-11-19'),false);
  assert.equal(occursOn(schedule('daily'),'2026-11-17'),false);
  assert.equal(occursOn(schedule('daily'),'2026-12-01'),true);
  assert.equal(occursOn(schedule('weekly'),'2026-11-25'),true);
  assert.equal(occursOn(schedule('weekly'),'2026-11-26'),false);
  assert.equal(occursOn(schedule('weekdays'),'2026-11-20'),true);
  assert.equal(occursOn(schedule('weekdays'),'2026-11-21'),false);
});
test('monthly skips nonexistent dates and handles leap day',()=>{
  const s=schedule('monthly','2026-01-31');
  assert.equal(occursOn(s,'2026-02-28'),false);
  assert.equal(nextOccurrence(s,'2026-02-01'),'2026-03-31');
  assert.equal(occursOn(schedule('monthly','2028-01-29'),'2028-02-29'),true);
  assert.equal(validDay('2026-02-29'),false);
});
test('pause, edit and future start dates produce correct next occurrences',()=>{
  const s=schedule('daily');
  assert.equal(nextOccurrence({...s,paused:true},'2026-11-18'),null);
  assert.equal(nextOccurrence(s,'2026-11-18','22:00'),'2026-11-19');
  assert.equal(nextOccurrence({...s,time:'23:00'},'2026-11-18','22:00'),'2026-11-18');
  assert.equal(nextOccurrence(schedule('weekly','2029-01-01'),'2026-11-18'),'2029-01-01');
});
test('calendar increments across DST, month and year boundaries',()=>{
  assert.equal(addDays('2026-10-31',1),'2026-11-01');
  assert.equal(addDays('2026-11-01',1),'2026-11-02');
  assert.equal(addDays('2026-12-31',1),'2027-01-01');
  assert.equal(addDays('2028-02-28',1),'2028-02-29');
});
