import type {Dua} from '../data/duas.ts';
import type {OrganizerData,ScheduledDua} from '../data/organizer.ts';
import {validDay} from '../utils/schedules.ts';
export const storageKey='ijabah.collection.v1'; // Extend the same store; preserve existing data.
export const emptyData=():OrganizerData=>({version:2,ids:[],personal:[],days:{},savedAt:{},collections:[],memberships:[],schedules:[]});
export function migrateOrganizer(raw:unknown,duas:Dua[]):OrganizerData{
  const data=emptyData();if(!raw||typeof raw!=='object')return data;
  const s=raw as Partial<OrganizerData>;
  data.personal=Array.isArray(s.personal)?s.personal.filter(d=>d&&typeof d.id==='string'&&typeof d.title==='string'&&typeof d.translation==='string'&&d.personal===true):[];
  const available=new Set([...duas,...data.personal].map(d=>d.id));
  data.ids=Array.isArray(s.ids)?[...new Set(s.ids.filter(id=>typeof id==='string'&&available.has(id)))]:[];
  if(s.days&&typeof s.days==='object')for(const [date,ids] of Object.entries(s.days))if(validDay(date)&&Array.isArray(ids))data.days[date]=[...new Set(ids.filter(id=>available.has(id)))];
  if(s.savedAt&&typeof s.savedAt==='object')for(const [id,value] of Object.entries(s.savedAt))if(available.has(id)&&typeof value==='string'&&Number.isFinite(Date.parse(value)))data.savedAt[id]=value;
  const groupIds=new Set<string>();
  if(Array.isArray(s.collections))data.collections=s.collections.filter(g=>{
    if(!g||typeof g.id!=='string'||typeof g.name!=='string'||!g.name.trim()||groupIds.has(g.id))return false;
    groupIds.add(g.id);return true;
  });
  const members=new Set<string>();
  if(Array.isArray(s.memberships))data.memberships=s.memberships.filter(m=>{
    if(!m||!groupIds.has(m.collectionId)||!available.has(m.duaId))return false;
    const key=JSON.stringify([m.collectionId,m.duaId]);if(members.has(key))return false;members.add(key);return true;
  });
  const scheduleIds=new Set<string>();
  if(Array.isArray(s.schedules))data.schedules=s.schedules.filter((r):r is ScheduledDua=>{
    if(!r||typeof r.id!=='string'||scheduleIds.has(r.id)||!r.target||!(r.target.kind==='dua'?available.has(r.target.id):r.target.kind==='collection'&&groupIds.has(r.target.id))||!validDay(r.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time)||!r.recurrence||!['once','daily','weekdays','weekly','monthly'].includes(r.recurrence.frequency)||!Array.isArray(r.recurrence.weekdays)||!r.recurrence.weekdays.every(n=>Number.isInteger(n)&&n>=0&&n<=6)||r.recurrence.frequency==='weekdays'&&!r.recurrence.weekdays.length||typeof r.note!=='string'||typeof r.paused!=='boolean')return false;
    scheduleIds.add(r.id);return true;
  });
  return data;
}
export function deleteCollection(data:OrganizerData,id:string):OrganizerData{
  return {...data,collections:data.collections.filter(g=>g.id!==id),memberships:data.memberships.filter(m=>m.collectionId!==id),schedules:data.schedules.filter(s=>s.target.kind!=='collection'||s.target.id!==id)};
}
