import type {Dua} from '../data/duas.ts';
import type {OrganizerData,ScheduledDua} from '../data/organizer.ts';
import {personalDuaLimits} from '../data/organizer.ts';
import {validDay} from '../utils/schedules.ts';
import {findDuaProfile} from '../data/duaProfiles.ts';
export const storageKey='ijabah.collection.v1'; // Extend the same store; preserve existing data.
export const emptyData=():OrganizerData=>({version:2,ids:[],personal:[],days:{},savedAt:{},collections:[],memberships:[],schedules:[],followedProfiles:[]});
export function upsertSchedule(schedules: ScheduledDua[], schedule: ScheduledDua): ScheduledDua[] {
  const match = schedules.find(existing => existing.id === schedule.id ||
    (schedule.target.kind === 'profile' && existing.target.kind === 'profile' &&
      existing.target.id === schedule.target.id));
  if (!match) return [...schedules, schedule];
  return schedules.map(existing => existing.id === match.id
    ? { ...schedule, id: match.id, createdAt: match.createdAt }
    : existing);
}
export function migrateOrganizer(raw:unknown,duas:Dua[]):OrganizerData{
  const data=emptyData();if(!raw||typeof raw!=='object')return data;
  const s=raw as Partial<OrganizerData>;
  if(Array.isArray(s.followedProfiles))data.followedProfiles=[...new Set(s.followedProfiles.filter(id=>typeof id==='string'&&findDuaProfile(id)))];
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
  const scheduleIds=new Set<string>(), scheduledProfiles=new Set<string>();
  if(Array.isArray(s.schedules))data.schedules=s.schedules.filter((r):r is ScheduledDua=>{
    if(!r||typeof r.id!=='string'||scheduleIds.has(r.id)||!r.target||!validDay(r.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time)||!r.recurrence||!['once','daily','weekdays','weekly','monthly'].includes(r.recurrence.frequency)||!Array.isArray(r.recurrence.weekdays)||!r.recurrence.weekdays.every(n=>Number.isInteger(n)&&n>=0&&n<=6)||r.recurrence.frequency==='weekdays'&&!r.recurrence.weekdays.length||typeof r.note!=='string'||typeof r.paused!=='boolean')return false;
    const { kind, id } = r.target;
    if (kind === 'profile') {
      if (!findDuaProfile(id) || scheduledProfiles.has(id)) return false;
      scheduledProfiles.add(id);
    } else if (!(kind === 'dua' ? available.has(id) : kind === 'collection' && groupIds.has(id))) return false;
    scheduleIds.add(r.id);return true;
  });
  return data;
}
export function deleteCollection(data:OrganizerData,id:string):OrganizerData{
  return {...data,collections:data.collections.filter(g=>g.id!==id),memberships:data.memberships.filter(m=>m.collectionId!==id),schedules:data.schedules.filter(s=>s.target.kind!=='collection'||s.target.id!==id)};
}

export function editPersonalDua(data:OrganizerData,id:string,title:string,translation:string):OrganizerData{
  const existing=data.personal.find(dua=>dua.id===id && dua.personal===true);
  if(!existing)return data;
  title=title.trim();
  translation=translation.trim();
  if(!title || !translation || title.length>personalDuaLimits.title || translation.length>personalDuaLimits.prayer)return data;
  if(existing.title===title && existing.translation===translation)return data;
  return {...data,personal:data.personal.map(dua=>dua===existing?{...dua,title,translation}:dua)};
}

export function deletePersonalDua(data:OrganizerData,id:string):OrganizerData{
  if(!data.personal.some(dua=>dua.id===id && dua.personal===true))return data;
  const savedAt={...data.savedAt};
  delete savedAt[id];
  const days={...data.days};
  for(const [date,ids] of Object.entries(days)){
    if(ids.includes(id))days[date]=ids.filter(duaId=>duaId!==id);
  }
  return {
    ...data,
    personal:data.personal.filter(dua=>dua.id!==id),
    ids:data.ids.filter(duaId=>duaId!==id),
    days,
    savedAt,
    memberships:data.memberships.filter(membership=>membership.duaId!==id),
    schedules:data.schedules.filter(({target})=>target.kind!=='dua' || target.id!==id),
  };
}
