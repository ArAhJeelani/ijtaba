import assert from 'node:assert/strict';
import {test} from 'node:test';
import {duas} from '../data/duas.ts';
import type {OrganizerData} from '../data/organizer.ts';
import {commitOrganizerStorage,exportOrganizerBackup,maximumBackupBytes,parseOrganizerBackup,readOrganizerStorage} from './organizerBackup.ts';
import {emptyData,storageKey} from './organizerStorage.ts';

const exportedAt='2026-11-20T20:00:00.000Z';

function fixture():OrganizerData{
  return {
    ...emptyData(),
    ids:['knowledge','personal-id'],
    personal:[{
      id:'personal-id',personal:true,title:'A private prayer',translation:'Private words',
      category:'Personal prayer',reference:'Personal prayer',context:'In my own words',
    }],
    days:{'2026-11-20':['personal-id','knowledge']},
    savedAt:{'personal-id':exportedAt},
    collections:[{id:'collection-id',name:'My collection',createdAt:exportedAt}],
    memberships:[{collectionId:'collection-id',duaId:'personal-id'}],
    schedules:[{
      id:'schedule-id',target:{kind:'collection',id:'collection-id'},date:'2026-11-21',
      time:'20:00',recurrence:{frequency:'weekly',weekdays:[]},
      note:'Private note',paused:false,createdAt:exportedAt,
    }],
    followedProfiles:['students'],
  };
}

function memoryStorage(raw:string|null){
  let value=raw;
  let writes=0;
  let rejectWrite=false;
  const access=()=>({
    getItem(key:string){assert.equal(key,storageKey);return value},
    setItem(key:string,next:string){
      assert.equal(key,storageKey);
      writes++;
      if(rejectWrite)throw new Error('Quota exceeded');
      value=next;
    },
  });
  return {access,value:()=>value,writes:()=>writes,failWrites:()=>{rejectWrite=true}};
}

test('exports all organizer sections and round-trips with local-only file operations',()=>{
  const data=fixture();
  const backup=exportOrganizerBackup(data,new Date(exportedAt));
  const wrapper=JSON.parse(backup);
  assert.deepEqual(wrapper,{format:'ijabah-organizer',version:1,exportedAt,data});
  assert.deepEqual(parseOrganizerBackup(backup,duas),data);
});

test('invalid or oversized input leaves browser storage untouched',()=>{
  const raw=JSON.stringify(fixture());
  const storage=memoryStorage(raw);
  assert.throws(()=>parseOrganizerBackup('{',duas),/valid JSON/);
  assert.throws(()=>parseOrganizerBackup('{"format":"another-app"}',duas),/Ijabah backup/);
  assert.throws(()=>parseOrganizerBackup('أ'.repeat(maximumBackupBytes/2+1),duas),/10 MB/);
  assert.equal(storage.writes(),0);
  assert.equal(storage.value(),raw);
});

test('rejects unsupported or missing backup versions and required properties',()=>{
  const backup=JSON.parse(exportOrganizerBackup(fixture()));
  for(const version of [undefined,0,2,'1']){
    assert.throws(()=>parseOrganizerBackup(JSON.stringify({...backup,version}),duas),/backup version/);
  }
  assert.throws(()=>parseOrganizerBackup(JSON.stringify({...backup,exportedAt:null}),duas),/timestamp/);
  assert.throws(()=>parseOrganizerBackup(JSON.stringify({...backup,data:{...backup.data,version:3}}),duas),/organizer data version/);
  for(const key of Object.keys(backup.data)){
    if(key==='version')continue;
    const data={...backup.data};
    delete data[key];
    assert.throws(()=>parseOrganizerBackup(JSON.stringify({...backup,data}),duas),/required section/);
  }
  const data=fixture();
  assert.throws(()=>parseOrganizerBackup(exportOrganizerBackup({
    ...data,collections:[{...data.collections[0],createdAt:''}],
  }),duas),/collection has invalid/);
});

test('rejects duplicate IDs and broken references without dropping otherwise valid data',()=>{
  const data=fixture();
  const [personal]=data.personal;
  const [collection]=data.collections;
  const [schedule]=data.schedules;
  const [membership]=data.memberships;
  for(const changes of [
    {ids:['knowledge','knowledge']},
    {ids:['missing']},
    {personal:[personal,personal]},
    {personal:[{...personal,id:'knowledge'}]},
    {collections:[collection,collection]},
    {memberships:[membership,membership]},
    {memberships:[{...membership,collectionId:'missing'}]},
    {memberships:[{...membership,duaId:'missing'}]},
    {schedules:[schedule,schedule]},
    {schedules:[{...schedule,target:{kind:'collection',id:'missing'}}]},
    {schedules:[{...schedule,target:{kind:'dua',id:'missing'}}]},
    {days:{'2026-11-20':['missing']}},
    {savedAt:{missing:exportedAt}},
    {followedProfiles:['students','students']},
  ] satisfies Partial<OrganizerData>[]){
    assert.throws(()=>parseOrganizerBackup(exportOrganizerBackup({...data,...changes}),duas),/duplicate|broken references/);
  }
  assert.deepEqual(parseOrganizerBackup(exportOrganizerBackup(data),duas),data);
});

test('backups preserve unavailable profile schedules and follows',()=>{
  const data=fixture();
  const profileIds=['career','students','missing'];
  const saved: OrganizerData={
    ...data,
    followedProfiles:profileIds,
    schedules:[...data.schedules,...profileIds.map(id=>({
      ...data.schedules[0],id:`profile-${id}`,target:{kind:'profile' as const,id},
    }))],
  };
  assert.deepEqual(parseOrganizerBackup(exportOrganizerBackup(saved),duas),saved);
});

test('a validated backup changes storage only when committed and reloads with all relationships',()=>{
  const old=JSON.stringify(emptyData());
  const storage=memoryStorage(old);
  const parsed=parseOrganizerBackup(exportOrganizerBackup(fixture()),duas);
  assert.equal(storage.value(),old);
  assert.equal(commitOrganizerStorage(storage.access,old,parsed).status,'ready');
  const reloaded=readOrganizerStorage(storage.access,duas);
  assert.equal(reloaded.status,'ready');
  assert.deepEqual(reloaded.data,fixture());
  assert.equal(storage.writes(),1);
});

test('storage failures and stale replacements leave the previous stored value untouched',()=>{
  const old=JSON.stringify(fixture());
  const storage=memoryStorage(old);
  storage.failWrites();
  assert.equal(commitOrganizerStorage(storage.access,null,emptyData()).status,'changed');
  assert.equal(storage.writes(),0);
  assert.equal(commitOrganizerStorage(storage.access,old,emptyData()).status,'unavailable');
  assert.equal(storage.value(),old);
  assert.equal(readOrganizerStorage(()=>{throw new Error('Access denied')},duas).status,'unavailable');
});

test('corrupt storage is read-only until replacement succeeds and the original can be recovered verbatim',()=>{
  for(const raw of ['{ "private": "incomplete','', 'null','{}',JSON.stringify({...fixture(),ids:['missing']})]){
    const storage=memoryStorage(raw);
    const snapshot=readOrganizerStorage(storage.access,duas);
    assert.equal(snapshot.status,'corrupt');
    assert.equal(snapshot.raw,raw);
    assert.equal(storage.writes(),0);
    assert.equal(storage.value(),raw);
    assert.equal(commitOrganizerStorage(storage.access,snapshot.raw,fixture()).status,'ready');
    assert.deepEqual(readOrganizerStorage(storage.access,duas).data,fixture());
  }
  const raw='{"unfinished":';
  const storage=memoryStorage(raw);
  const snapshot=readOrganizerStorage(storage.access,duas);
  assert.equal(snapshot.status,'corrupt');
  storage.failWrites();
  assert.equal(commitOrganizerStorage(storage.access,snapshot.raw,fixture()).status,'unavailable');
  assert.equal(storage.value(),raw);
});

test('legacy saved and personal data load without rewriting the original storage',()=>{
  const {ids,personal,days}=fixture();
  for(const fields of [{ids,personal},{ids,personal,days},{version:1,ids,personal,days}]){
    const raw=JSON.stringify(fields);
    const storage=memoryStorage(raw);
    const snapshot=readOrganizerStorage(storage.access,duas);
    assert.equal(snapshot.status,'ready');
    assert.deepEqual(snapshot.data,{...emptyData(),ids,personal,days:'days' in fields?days:{}});
    assert.equal(storage.value(),raw);
    assert.equal(storage.writes(),0);
  }
});
