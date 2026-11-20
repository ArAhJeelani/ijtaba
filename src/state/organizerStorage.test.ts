import {test} from 'node:test';
import assert from 'node:assert/strict';
import {duas} from '../data/duas.ts';
import type {ScheduledDua} from '../data/organizer.ts';
import {occursOn} from '../utils/schedules.ts';
import {deleteCollection,migrateOrganizer,upsertSchedule} from './organizerStorage.ts';
test('migrates legacy saved prayers and daily collections without invented dates',()=>{
  const raw={ids:['knowledge','knowledge','gone'],personal:[],days:{'2026-11-19':['knowledge'],'2026-02-30':['knowledge']}};
  const data=migrateOrganizer(raw,duas);
  assert.deepEqual(data.ids,['knowledge']);assert.deepEqual(data.days,{'2026-11-19':['knowledge']});assert.deepEqual(data.savedAt,{});
});
test('round-trip persists personal text, memberships, time edits and recurrence',()=>{
  const personal={id:'private',title:'My family',translation:'Personal words',personal:true,category:'Personal prayer',context:'My words',reference:'Personal prayer'};
  const data=migrateOrganizer({ids:['private','knowledge'],personal:[personal],collections:[{id:'g',name:'Parents',createdAt:'2026-11-18'}],memberships:[{collectionId:'g',duaId:'private'}],schedules:[{id:'s',target:{kind:'dua',id:'private'},date:'2026-11-19',time:'22:30',recurrence:{frequency:'weekly',weekdays:[]},paused:false,note:'Private note',createdAt:'2026-11-18'}]},duas);
  const restored=migrateOrganizer(JSON.parse(JSON.stringify(data)),duas);
  assert.deepEqual(restored,data);assert.equal(restored.schedules[0].time,'22:30');assert.equal(restored.personal[0].translation,'Personal words');
});
test('deleting a collection keeps shared content and individual schedules',()=>{
  const data=migrateOrganizer({ids:['knowledge'],personal:[],collections:[{id:'a',name:'First'},{id:'b',name:'Second'}],memberships:[{collectionId:'a',duaId:'knowledge'},{collectionId:'b',duaId:'knowledge'}]},duas);
  const base={date:'2026-11-19',time:'21:00',recurrence:{frequency:'once' as const,weekdays:[]},paused:false,note:'',createdAt:'2026-11-18'};
  data.schedules=[{...base,id:'group',target:{kind:'collection',id:'a'}},{...base,id:'single',target:{kind:'dua',id:'knowledge'}}];
  const result=deleteCollection(data,'a');assert.deepEqual(result.ids,['knowledge']);assert.equal(result.memberships[0].collectionId,'b');assert.equal(result.schedules[0].id,'single');
});
test('invalid and dangling schedules are not loaded',()=>{
  const data=migrateOrganizer({ids:['knowledge'],personal:[],schedules:[{id:'broken',target:{kind:'dua',id:'missing'}}]},duas);
  assert.equal(data.schedules.length,0);
});

test('empty profiles keep independent recurring schedules and follows across reloads', () => {
  const students: ScheduledDua = {
    id: 'student-schedule', target: {kind: 'profile', id: 'students'},
    date: '2026-11-20', time: '20:00', recurrence: {frequency: 'daily', weekdays: []},
    paused: false, note: '', createdAt: '2026-11-20',
  };
  const parents: ScheduledDua = {
    ...students, id: 'parent-schedule', target: {kind: 'profile', id: 'parents'},
    recurrence: {frequency: 'weekdays', weekdays: [1, 3]},
  };
  const edited = upsertSchedule([students, parents], {...students, id: 'duplicate', time: '19:30'});
  const stored = {
    followedProfiles: ['students', 'students', 'missing'],
    schedules: [...edited, {...students, id: 'another-duplicate'}, {
      ...students, id: 'missing', target: {kind: 'profile', id: 'missing'},
    }],
  };
  const restored = migrateOrganizer(JSON.parse(JSON.stringify(stored)), duas);
  assert.deepEqual(restored.followedProfiles, ['students']);
  assert.deepEqual(restored.schedules.map(({id, time}) => [id, time]), [
    ['student-schedule', '19:30'], ['parent-schedule', '20:00'],
  ]);
  assert.equal(occursOn(restored.schedules[0], '2026-11-22'), true);
  assert.equal(occursOn(restored.schedules[1], '2026-11-22'), false);
  assert.equal(occursOn(restored.schedules[1], '2026-11-23'), true);
  assert.deepEqual(restored.ids, []);
});
