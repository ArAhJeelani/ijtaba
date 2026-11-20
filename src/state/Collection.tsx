import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {duas,type Dua} from '../data/duas';
import {findDuaProfile} from '../data/duaProfiles';
import type {ScheduledDua,ScheduleTarget} from '../data/organizer';
import {deleteCollection,emptyData,migrateOrganizer,storageKey,upsertSchedule} from './organizerStorage';
function load(){try{return migrateOrganizer(JSON.parse(localStorage.getItem(storageKey)||'null'),duas)}catch{return emptyData()}}
function useCollectionState(){
  const [data,set]=useState(load),[read,setRead]=useState<string[]>([]),[storageError,setError]=useState('');
  const [notice,setNotice]=useState('');
  useEffect(()=>{
    const sync=(event:StorageEvent)=>{
      if(event.key!==storageKey)return;
      try{const restored=migrateOrganizer(JSON.parse(event.newValue||'null'),duas);set(current=>JSON.stringify(current)===JSON.stringify(restored)?current:restored)}catch{/* Ignore malformed changes from another tab. */}
    };
    window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
  },[]);
  useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify(data));setError('')}catch{setError('Your browser could not save changes. Keep this page open to retain this collection.')}},[data]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3200);return()=>clearTimeout(timer)},[notice]);
  const library=[...duas,...data.personal];
  const resolve=(ids:string[])=>ids.flatMap(id=>{const d=library.find(d=>d.id===id);return d?[d]:[]});
  const targetIds = ({kind,id}: ScheduleTarget) => {
    if (kind === 'dua') return [id];
    if (kind === 'profile') return findDuaProfile(id)?.duaIds ?? [];
    return data.memberships.filter(m => m.collectionId === id).map(m => m.duaId);
  };
  const ensure=(ids:string[],id:string)=>ids.includes(id)?ids:[...ids,id];
  const save=(id:string)=>set(s=>({...s,ids:ensure(s.ids,id),savedAt:{...s.savedAt,[id]:s.savedAt[id]||new Date().toISOString()}}));
  return {
    data,read,storageError,notice,library,save,items:resolve(data.ids),
    announce:setNotice,
    itemsForDay:(date:string)=>resolve(data.days[date]??[]),
    collectionItems:(id:string)=>resolve(data.memberships.filter(m=>m.collectionId===id).map(m=>m.duaId)),
    targetItems:(target:ScheduleTarget)=>resolve(targetIds(target)),
    targetName:({kind,id}:ScheduleTarget)=>{
      if (kind === 'dua') return library.find(d=>d.id===id)?.title || 'Du’a';
      if (kind === 'profile') return findDuaProfile(id)?.title || 'Du’a profile';
      return data.collections.find(g=>g.id===id)?.name || 'Collection';
    },
    schedulesFor:(id:string)=>data.schedules.filter(s=>targetIds(s.target).includes(id)),
    toggleProfile:(id:string)=>set(s=>({...s,followedProfiles:s.followedProfiles.includes(id)
      ? s.followedProfiles.filter(profileId=>profileId!==id) : [...s.followedProfiles,id]})),
    toggleDay:(date:string,id:string)=>set(s=>{const current=s.days[date]??[],removing=current.includes(id);return {...s,days:{...s.days,[date]:removing?current.filter(x=>x!==id):[...current,id]},ids:removing?s.ids:ensure(s.ids,id),savedAt:removing?s.savedAt:{...s.savedAt,[id]:s.savedAt[id]||new Date().toISOString()}}}),
    toggle:(id:string)=>{setNotice(data.ids.includes(id)?'Removed from saved list. Schedules and collections are kept.':'Added to your collection.');set(s=>({...s,ids:s.ids.includes(id)?s.ids.filter(x=>x!==id):[...s.ids,id],savedAt:s.ids.includes(id)?s.savedAt:{...s.savedAt,[id]:new Date().toISOString()}}))},
    move:(id:string,delta:number)=>set(s=>{const ids=[...s.ids],i=ids.indexOf(id),j=i+delta;if(i>=0&&j>=0&&j<ids.length)[ids[i],ids[j]]=[ids[j],ids[i]];return {...s,ids}}),
    mark:(id:string)=>setRead(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]),reset:()=>setRead([]),
    addPersonal:(title:string,translation:string)=>{const d:Dua={id:crypto.randomUUID(),title,translation,category:'Personal prayer',reference:'Personal prayer · not a sourced supplication',context:'In your own words.',personal:true};set(s=>({...s,ids:[...s.ids,d.id],personal:[...s.personal,d],savedAt:{...s.savedAt,[d.id]:new Date().toISOString()}}));setNotice('Your personal du’a has been saved in this browser.')},
    createCollection:(name:string)=>{const id=crypto.randomUUID();set(s=>({...s,collections:[...s.collections,{id,name:name.trim(),createdAt:new Date().toISOString()}]}));return id},
    renameCollection:(id:string,name:string)=>set(s=>({...s,collections:s.collections.map(g=>g.id===id?{...g,name:name.trim()}:g)})),
    deleteCollection:(id:string)=>set(s=>deleteCollection(s,id)),
    toggleMembership:(collectionId:string,duaId:string)=>set(s=>{const exists=s.memberships.some(m=>m.collectionId===collectionId&&m.duaId===duaId);return {...s,ids:ensure(s.ids,duaId),savedAt:{...s.savedAt,[duaId]:s.savedAt[duaId]||new Date().toISOString()},memberships:exists?s.memberships.filter(m=>m.collectionId!==collectionId||m.duaId!==duaId):[...s.memberships,{collectionId,duaId}]}}),
    saveSchedule:(schedule:ScheduledDua)=>{set(s=>({...s,schedules:upsertSchedule(s.schedules,schedule),ids:schedule.target.kind==='dua'?ensure(s.ids,schedule.target.id):s.ids,savedAt:schedule.target.kind==='dua'?{...s.savedAt,[schedule.target.id]:s.savedAt[schedule.target.id]||new Date().toISOString()}:s.savedAt}));setNotice('Schedule saved. A gentle invitation to return.')},
    pauseSchedule:(id:string)=>set(s=>({...s,schedules:s.schedules.map(r=>r.id===id?{...r,paused:!r.paused}:r)})),
    deleteSchedule:(id:string)=>{set(s=>({...s,schedules:s.schedules.filter(r=>r.id!==id)}));setNotice('Schedule removed.')},
  };
}
const Context=createContext<ReturnType<typeof useCollectionState>|null>(null);
export function CollectionProvider({children}:{children:ReactNode}){return <Context.Provider value={useCollectionState()}>{children}</Context.Provider>}
export function useCollection(){return useContext(Context)!}
