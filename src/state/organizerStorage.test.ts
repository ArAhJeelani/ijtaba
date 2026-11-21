import {test} from 'node:test';
import assert from 'node:assert/strict';
import {duas} from '../data/duas.ts';
import type {ScheduledDua} from '../data/organizer.ts';
import {occursOn} from '../utils/schedules.ts';
import {deleteCollection,deletePersonalDua,editPersonalDua,migrateOrganizer,upsertSchedule} from './organizerStorage.ts';
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

function personalManagementFixture(){
  const personal={
    id:'private',title:'My family',translation:'Personal words',personal:true,
    category:'Personal prayer',context:'My words',reference:'Personal prayer',
  };
  const savedAt='2026-11-19T22:30:00.000Z';
  const schedule={
    date:'2026-11-19',time:'22:30',recurrence:{frequency:'weekly',weekdays:[]},
    paused:false,note:'',createdAt:savedAt,
  };
  return migrateOrganizer({
    ids:['private','knowledge'],
    personal:[personal,{...personal,id:'unsaved',title:'Another prayer'}],
    days:{'2026-11-19':['private','knowledge'],'2026-11-20':['private']},
    savedAt:{private:savedAt,knowledge:savedAt},
    collections:[{id:'private',name:'Parents',createdAt:savedAt}],
    memberships:[
      {collectionId:'private',duaId:'private'},
      {collectionId:'private',duaId:'knowledge'},
    ],
    schedules:[
      {...schedule,id:'direct',target:{kind:'dua',id:'private'}},
      {...schedule,id:'sourced',target:{kind:'dua',id:'knowledge'}},
      {...schedule,id:'group',target:{kind:'collection',id:'private'}},
    ],
  },duas);
}

test('editing a personal title preserves identity, order, saved date, memberships and schedules',()=>{
  const data=personalManagementFixture();
  const edited=editPersonalDua(data,'private','  For my family  ','Personal words');
  assert.deepEqual(edited,{
    ...data,personal:[{...data.personal[0],title:'For my family'},data.personal[1]],
  });
  assert.equal(data.personal[0].title,'My family');
  assert.equal(edited.personal[0].id,'private');
  assert.deepEqual(migrateOrganizer(JSON.parse(JSON.stringify(edited)),duas),edited);
});

test('editing an unsaved personal prayer updates its text without saving or duplicating it',()=>{
  const data=personalManagementFixture();
  const edited=editPersonalDua(data,'unsaved','Another prayer','  Updated words  ');
  assert.deepEqual(edited,{
    ...data,personal:[data.personal[0],{...data.personal[1],translation:'Updated words'}],
  });
});

test('personal editing rejects invalid fields and accepts the existing character limits',()=>{
  const data=personalManagementFixture();
  assert.equal(editPersonalDua(data,'private','   ','Personal words'),data);
  assert.equal(editPersonalDua(data,'private','My family','   '),data);
  assert.equal(editPersonalDua(data,'private','x'.repeat(121),'Personal words'),data);
  assert.equal(editPersonalDua(data,'private','My family','x'.repeat(4001)),data);
  assert.equal(editPersonalDua(data,'private','My family','Personal words'),data);
  const edited=editPersonalDua(data,'private','x'.repeat(120),'y'.repeat(4000));
  assert.equal(edited.personal[0].title.length,120);
  assert.equal(edited.personal[0].translation.length,4000);
});

test('permanent deletion clears personal references and preserves other entries and schedules on reload',()=>{
  const data=personalManagementFixture();
  const deleted=deletePersonalDua(data,'private');
  assert.deepEqual(deleted,{
    ...data,
    ids:['knowledge'],
    personal:[data.personal[1]],
    days:{'2026-11-19':['knowledge'],'2026-11-20':[]},
    savedAt:{knowledge:data.savedAt.knowledge},
    memberships:[data.memberships[1]],
    schedules:data.schedules.slice(1),
  });
  assert.equal(data.personal.length,2);
  assert.deepEqual(migrateOrganizer(JSON.parse(JSON.stringify(deleted)),duas),deleted);
  assert.equal(deletePersonalDua(deleted,'private'),deleted);
});

test('personal helpers protect sourced entries and can delete an unsaved entry',()=>{
  const data=personalManagementFixture();
  assert.equal(editPersonalDua(data,'knowledge','Changed title','Changed words'),data);
  assert.equal(deletePersonalDua(data,'knowledge'),data);
  assert.deepEqual(deletePersonalDua(data,'unsaved'),{...data,personal:[data.personal[0]]});
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
