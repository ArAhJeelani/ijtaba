import type {Dua} from '../data/duas.ts';
import type {OrganizerData} from '../data/organizer.ts';
import {emptyData,migrateOrganizer,storageKey} from './organizerStorage.ts';

const backupFormat='ijabah-organizer';
const backupVersion=1;
export const maximumBackupBytes=10*1024*1024;

const record=(value:unknown):value is Record<string,unknown>=>
  value!==null && typeof value==='object' && !Array.isArray(value);
const nonempty=(value:unknown):value is string=>typeof value==='string' && !!value.trim();
const id=(value:unknown):value is string=>nonempty(value) && !Object.hasOwn(Object.prototype,value);
const timestamp=(value:unknown):value is string=>typeof value==='string' && Number.isFinite(Date.parse(value));

function personalEntry(value:unknown):boolean{
  if(!record(value) || !id(value.id) || value.personal!==true)return false;
  return ['title','translation','category','reference','context'].every(key=>typeof value[key]==='string') &&
    ['prophet','prophetGroup','arabic','translationAttribution','transliteration'].every(key=>
      !Object.hasOwn(value,key) || typeof value[key]==='string') &&
    (!Object.hasOwn(value,'categories') || Array.isArray(value.categories) && value.categories.every(item=>typeof item==='string')) &&
    (!Object.hasOwn(value,'url') || typeof value.url==='string' && /^https?:\/\//i.test(value.url));
}

function validateOrganizer(value:unknown,catalog:Dua[],allowLegacy=false):OrganizerData{
  if(!record(value))throw new Error('Organizer data must be a JSON object.');
  const legacy=allowLegacy && (!Object.hasOwn(value,'version') || value.version===1);
  if(value.version!==2 && !legacy)throw new Error('This organizer data version is unsupported.');
  const source=legacy?{...emptyData(),...value}:value;
  const {ids,personal,days,savedAt,collections,memberships,schedules,followedProfiles}=source;
  if(!Array.isArray(value.ids) || !Array.isArray(value.personal) ||
    !Array.isArray(ids) || !Array.isArray(personal) || !record(days) || !record(savedAt) ||
    !Array.isArray(collections) || !Array.isArray(memberships) || !Array.isArray(schedules) ||
    !Array.isArray(followedProfiles)){
    throw new Error('Organizer data is missing a required section or contains an invalid section.');
  }

  const duaIds=new Set(catalog.map(dua=>dua.id));
  for(const entry of personal){
    if(!personalEntry(entry))throw new Error('A personal du’a has invalid or missing fields.');
    if(duaIds.has(entry.id))throw new Error('Organizer data contains duplicate du’a IDs.');
    duaIds.add(entry.id);
  }
  if(!collections.every(group=>record(group) && id(group.id) && nonempty(group.name) && timestamp(group.createdAt))){
    throw new Error('A collection has invalid or missing fields.');
  }
  if(!schedules.every(schedule=>record(schedule) && id(schedule.id) && timestamp(schedule.createdAt) &&
    record(schedule.target) && id(schedule.target.id) && record(schedule.recurrence) &&
    typeof schedule.date==='string' && typeof schedule.time==='string')){
    throw new Error('A schedule has invalid or missing fields.');
  }
  if(!memberships.every(membership=>record(membership) && id(membership.collectionId) && id(membership.duaId))){
    throw new Error('A collection membership has invalid or missing fields.');
  }

  // Migration may discard invalid references or duplicates. Reject any such loss.
  const migrated=migrateOrganizer(source,catalog);
  const sections={ids,personal,days,savedAt,collections,memberships,schedules,followedProfiles};
  for(const key of Object.keys(sections) as (keyof typeof sections)[]){
    if(JSON.stringify(sections[key])!==JSON.stringify(migrated[key])){
      throw new Error(`Organizer data contains invalid entries, duplicates, or broken references in ${key}.`);
    }
  }
  return migrated;
}

export function exportOrganizerBackup(data:OrganizerData,now=new Date()):string{
  return JSON.stringify({format:backupFormat,version:backupVersion,exportedAt:now.toISOString(),data},null,2);
}

export function parseOrganizerBackup(text:string,catalog:Dua[]):OrganizerData{
  if(text.length>maximumBackupBytes || new TextEncoder().encode(text).byteLength>maximumBackupBytes){
    throw new Error('Backups must be 10 MB or smaller.');
  }
  let value:unknown;
  try{value=JSON.parse(text)}catch{throw new Error('This file is not valid JSON.')}
  if(!record(value) || value.format!==backupFormat)throw new Error('Choose an Ijabah backup file.');
  if(value.version!==backupVersion)throw new Error('This backup version is missing or unsupported.');
  if(!timestamp(value.exportedAt))throw new Error('The backup has an invalid or missing export timestamp.');
  return validateOrganizer(value.data,catalog);
}

type StorageAccess=()=>Pick<Storage,'getItem'|'setItem'>;
export type OrganizerStorageSnapshot=
  | {status:'ready';raw:string|null;data:OrganizerData}
  | {status:'corrupt';raw:string;data:OrganizerData}
  | {status:'unavailable';data:OrganizerData};

export function readOrganizerStorage(access:StorageAccess,catalog:Dua[]):OrganizerStorageSnapshot{
  let raw:string|null;
  try{raw=access().getItem(storageKey)}catch{return {status:'unavailable',data:emptyData()}}
  if(raw===null)return {status:'ready',raw,data:emptyData()};
  try{
    return {status:'ready',raw,data:validateOrganizer(JSON.parse(raw),catalog,true)};
  }catch{
    return {status:'corrupt',raw,data:emptyData()};
  }
}

export function commitOrganizerStorage(access:StorageAccess,expected:string|null,data:OrganizerData){
  try{
    const storage=access();
    if(storage.getItem(storageKey)!==expected)return {status:'changed'} as const;
    const raw=JSON.stringify(data);
    if(raw!==expected)storage.setItem(storageKey,raw);
    return {status:'ready',raw,data} as const;
  }catch{
    return {status:'unavailable'} as const;
  }
}
