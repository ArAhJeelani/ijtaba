import {createContext,useContext,useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {useAuth} from './Auth';
import {useCloudOrganizer} from './useCloudOrganizer';
import {emptyData} from './organizerStorage';
import {duas,type Dua} from '../data/duas';
import {duaProfileTitle, resolveProfileItems} from '../data/duaProfiles';
import type {OrganizerData,ScheduledDua,ScheduleTarget} from '../data/organizer';
import {deleteCollection,deletePersonalDua,editPersonalDua,storageKey,upsertSchedule} from './organizerStorage';
import {commitOrganizerStorage,readOrganizerStorage,type OrganizerStorageSnapshot} from './organizerBackup';

const accessStorage=()=>window.localStorage;
const corruptMessage='Stored Ijabah data could not be read. Open My Du’as → Backup & recovery to download the original data or restore a backup.';
const unavailableMessage='Browser storage is unavailable. Export any changes from My Du’as before closing this page.';
const changedMessage='Stored data changed in another tab. Export any unsaved changes and reload this page before trying again.';

function useCollectionState(owner:string|undefined, restoring:boolean){
  const cloudState=useCloudOrganizer(owner);
  const cloud=owner?cloudState:null;
  const stored=useRef<OrganizerStorageSnapshot>(null!);
  if(!stored.current)stored.current=owner || restoring
    ? {status:'ready',raw:null,data:emptyData()}
    : readOrganizerStorage(accessStorage,duas);
  const initial=stored.current;
  const [guestData,setGuest]=useState(initial.data),[read,setRead]=useState<string[]>([]);
  const data=cloud?.data??guestData;
  const set=(update:(current:OrganizerData)=>OrganizerData)=>{
    if(cloud && cloud.update(update))return true;
    if(!cloud && !restoring){setGuest(update);return true;}
    setNotice('Account editing is paused. Check your sync status.');
    return false;
  };
  const [recoveryRaw,setRecoveryRaw]=useState(initial.status==='corrupt'?initial.raw:null);
  const [storageError,setError]=useState(initial.status==='ready'?'':initial.status==='corrupt'?corruptMessage:unavailableMessage);
  const [notice,setNotice]=useState('');
  const [addition,setAddition]=useState<{origin:DOMRect;key:number}|null>(null);
  useEffect(()=>{
    if(!addition)return;
    const timer=setTimeout(()=>setAddition(null),3200);
    return()=>clearTimeout(timer);
  },[addition]);
  useEffect(()=>{
    if(owner || restoring)return;
    const sync=(event:StorageEvent)=>{
      if(event.key!==storageKey && event.key!==null)return;
      const next=readOrganizerStorage(accessStorage,duas);
      const previous=stored.current;
      if(next.status==='unavailable'){
        setError(unavailableMessage);
        return;
      }
      if(previous.status!=='unavailable' && next.raw===previous.raw)return;
      if(next.status==='corrupt'){
        stored.current={...next,data:previous.data};
        setRecoveryRaw(next.raw);
        setError(corruptMessage);
        return;
      }
      if(data!==previous.data){
        setError(changedMessage);
        return;
      }
      stored.current=next;
      setGuest(next.data);
      setRead([]);
      setRecoveryRaw(null);
      setError('');
    };
    window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
  },[data,owner,restoring]);
  // Commit ordinary edits before another browser interaction can start a restore.
  useLayoutEffect(()=>{
    if(owner || restoring)return;
    const previous=stored.current;
    if(previous.status!=='ready' || data===previous.data)return;
    const result=commitOrganizerStorage(accessStorage,previous.raw,data);
    if(result.status==='ready'){
      stored.current=result;
      setError('');
    }else{
      setError(result.status==='changed'?changedMessage:unavailableMessage);
    }
  },[data,owner,restoring]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3200);return()=>clearTimeout(timer)},[notice]);
  const library=[...duas,...data.personal];
  const resolve=(ids:string[])=>ids.flatMap(id=>{const d=library.find(d=>d.id===id);return d?[d]:[]});
  const profileItems = (id: string) => resolveProfileItems(id, duas);
  const targetIds = ({kind,id}: ScheduleTarget) => {
    if (kind === 'dua') return [id];
    if (kind === 'profile') return profileItems(id).map(dua => dua.id);
    return data.memberships.filter(m => m.collectionId === id).map(m => m.duaId);
  };
  const targetItems = (target: ScheduleTarget) => target.kind === 'profile'
    ? profileItems(target.id)
    : resolve(targetIds(target));
  const ensure=(ids:string[],id:string)=>ids.includes(id)?ids:[...ids,id];
  const save=(id:string)=>set(s=>({...s,ids:ensure(s.ids,id),savedAt:{...s.savedAt,[id]:s.savedAt[id]||new Date().toISOString()}}));
  const replaceOrganizer=(next:OrganizerData,expectedData:OrganizerData,expectedRecovery:string|null)=>{
    if(data!==expectedData || recoveryRaw!==expectedRecovery){
      return 'Your organizer changed after you opened this preview. Cancel and review the backup again.';
    }
    if(restoring)return 'Wait for your session to finish loading.';
    if(cloud)return cloud.update(()=>next)?'':'Account editing is paused. Check your sync status.';
    const previous=stored.current;
    if(previous.status==='unavailable')return unavailableMessage;
    const result=commitOrganizerStorage(accessStorage,previous.raw,next);
    if(result.status==='changed')return changedMessage;
    if(result.status==='unavailable')return 'The replacement could not be saved. Your current organizer is still in place. Check available browser storage and try again.';
    stored.current=result;
    setGuest(next);
    setRead([]);
    setNotice('');
    setAddition(null);
    setRecoveryRaw(null);
    setError('');
    return '';
  };
  return {
    cloud,data,read,storageError,recoveryRaw,replaceOrganizer,notice,addition,library,save,items:resolve(data.ids),
    announce:setNotice,
    itemsForDay:(date:string)=>resolve(data.days[date]??[]),
    collectionItems:(id:string)=>resolve(data.memberships.filter(m=>m.collectionId===id).map(m=>m.duaId)),
    targetItems,
    calendarSchedules:data.schedules.filter(({target}) => target.kind !== 'profile' || profileItems(target.id).length > 0),
    targetName:({kind,id}:ScheduleTarget)=>{
      if (kind === 'dua') return library.find(d=>d.id===id)?.title || 'Du’a';
      if (kind === 'profile') return duaProfileTitle(id) || 'Du’a profile';
      return data.collections.find(g=>g.id===id)?.name || 'Collection';
    },
    schedulesFor:(id:string)=>data.schedules.filter(s=>targetIds(s.target).includes(id)),
    toggleProfile:(id:string)=>{
      if (!profileItems(id).length) return;
      set(s=>({...s,followedProfiles:s.followedProfiles.includes(id)
        ? s.followedProfiles.filter(profileId=>profileId!==id) : [...s.followedProfiles,id]}));
    },
    toggleDay:(date:string,id:string)=>set(s=>{const current=s.days[date]??[],removing=current.includes(id);return {...s,days:{...s.days,[date]:removing?current.filter(x=>x!==id):[...current,id]},ids:removing?s.ids:ensure(s.ids,id),savedAt:removing?s.savedAt:{...s.savedAt,[id]:s.savedAt[id]||new Date().toISOString()}}}),
    toggle:(id:string,origin:DOMRect)=>{
      const saved=data.ids.includes(id);
      if(!owner)setNotice(saved?'Removed from My Du’as.':'');
      if(!owner)setAddition(saved?null:{origin,key:performance.now()});
      set(s=>({...s,ids:s.ids.includes(id)?s.ids.filter(x=>x!==id):[...s.ids,id],savedAt:s.ids.includes(id)?s.savedAt:{...s.savedAt,[id]:new Date().toISOString()}}));
    },
    move:(id:string,delta:number)=>set(s=>{const ids=[...s.ids],i=ids.indexOf(id),j=i+delta;if(i>=0&&j>=0&&j<ids.length)[ids[i],ids[j]]=[ids[j],ids[i]];return {...s,ids}}),
    mark:(id:string)=>setRead(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]),reset:()=>setRead([]),
    editPersonal:(id:string,title:string,prayer:string)=>set(s=>editPersonalDua(s,id,title,prayer)),
    deletePersonal:(id:string)=>{
      if(!data.personal.some(dua=>dua.id===id && dua.personal===true))return;
      if(!set(s=>deletePersonalDua(s,id)))return false;
      setRead(ids=>ids.filter(duaId=>duaId!==id));
      if(!owner)setNotice('Personal du’a permanently deleted.');
      return true;
    },
    addPersonal:(title:string,translation:string)=>{const d:Dua={id:crypto.randomUUID(),title,translation,category:'Personal prayer',reference:'Personal prayer · not a sourced supplication',context:'In your own words.',personal:true};const accepted=set(s=>({...s,ids:[...s.ids,d.id],personal:[...s.personal,d],savedAt:{...s.savedAt,[d.id]:new Date().toISOString()}}));if(accepted && !owner)setNotice('Your personal du’a has been saved in this browser.');return accepted},
    createCollection:(name:string,duaId?:string)=>{
      const id=crypto.randomUUID();
      const now=new Date().toISOString();
      const accepted=set(s=>({
        ...s,
        collections:[...s.collections,{id,name:name.trim(),createdAt:now}],
        ids:duaId?ensure(s.ids,duaId):s.ids,
        savedAt:duaId?{...s.savedAt,[duaId]:s.savedAt[duaId]||now}:s.savedAt,
        memberships:duaId?[...s.memberships,{collectionId:id,duaId}]:s.memberships,
      }));
      return accepted?id:null;
    },
    renameCollection:(id:string,name:string)=>set(s=>({...s,collections:s.collections.map(g=>g.id===id?{...g,name:name.trim()}:g)})),
    deleteCollection:(id:string)=>set(s=>deleteCollection(s,id)),
    toggleMembership:(collectionId:string,duaId:string)=>set(s=>{const exists=s.memberships.some(m=>m.collectionId===collectionId&&m.duaId===duaId);return {...s,ids:ensure(s.ids,duaId),savedAt:{...s.savedAt,[duaId]:s.savedAt[duaId]||new Date().toISOString()},memberships:exists?s.memberships.filter(m=>m.collectionId!==collectionId||m.duaId!==duaId):[...s.memberships,{collectionId,duaId}]}}),
    saveSchedule:(schedule:ScheduledDua)=>{
      if (schedule.target.kind === 'profile' && !profileItems(schedule.target.id).length) return false;
      const accepted=set(s=>({...s,schedules:upsertSchedule(s.schedules,schedule,duas),ids:schedule.target.kind==='dua'?ensure(s.ids,schedule.target.id):s.ids,savedAt:schedule.target.kind==='dua'?{...s.savedAt,[schedule.target.id]:s.savedAt[schedule.target.id]||new Date().toISOString()}:s.savedAt}));
      if(accepted && !owner)setNotice('Schedule saved. A gentle invitation to return.');
      return accepted;
    },
    pauseSchedule:(id:string)=>set(s=>({...s,schedules:s.schedules.map(r=>r.id===id?{...r,paused:!r.paused}:r)})),
    deleteSchedule:(id:string)=>{set(s=>({...s,schedules:s.schedules.filter(r=>r.id!==id)}));if(!owner)setNotice('Schedule removed.')},
  };
}
const Context=createContext<ReturnType<typeof useCollectionState>|null>(null);
function CollectionScope({children,owner,restoring}:{children:ReactNode;owner?:string;restoring:boolean}){
  return <Context.Provider value={useCollectionState(owner,restoring)}>{children}</Context.Provider>;
}
export function CollectionProvider({children}:{children:ReactNode}){
  const {session,loading}=useAuth();
  const owner=session?.user.id;
  return <CollectionScope key={owner??(loading?'restoring':'guest')} owner={owner} restoring={loading}>{children}</CollectionScope>;
}
export function useCollection(){return useContext(Context)!}
