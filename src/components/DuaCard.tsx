import {useState} from 'react';
import {Check,Plus,CalendarDays,BookOpen,FolderHeart,X} from 'lucide-react';
import {motion,useReducedMotion} from 'motion/react';
import type {Dua} from '../data/duas';
import {useCollection} from '../state/Collection';
import {dateKey} from '../utils/calendar';
import {nextOccurrence} from '../utils/schedules';
import {ScheduleDialog} from './ScheduleDialog';
import {DuaReader} from './DuaReader';
import {CollectionMembershipDialog} from './CollectionMembershipDialog';
export function SaveDuaButton({id}:{id:string}){const c=useCollection(),saved=c.data.ids.includes(id),reduced=useReducedMotion();return <motion.button type="button" className={'save '+(saved?'saved':'')} aria-pressed={saved} whileTap={reduced?undefined:{scale:.96}} onClick={()=>c.toggle(id)}>{saved?<Check size={16}/>:<Plus size={16}/>} {saved?'Saved · remove':'Add to My Du’as'}</motion.button>}
export function DuaCard({dua,transliteration=false,day,dailyView=false}:{dua:Dua;transliteration?:boolean;day?:string;dailyView?:boolean}){
  const c=useCollection(),reduced=useReducedMotion(),[modal,setModal]=useState<'schedule'|'read'|'collections'|null>(null);
  const added=day&&c.data.days[day]?.includes(dua.id),saved=c.data.ids.includes(dua.id);
  const schedules=c.schedulesFor(dua.id).filter(s=>!s.paused);
  const next=schedules.map(s=>({s,date:nextOccurrence(s,dateKey(new Date()),new Date().toTimeString().slice(0,5))})).filter(x=>x.date).sort((a,b)=>(a.date!+a.s.time).localeCompare(b.date!+b.s.time))[0];
  return <><motion.article className="dua-card" initial={{opacity:reduced?1:0,y:reduced?0:8}} animate={{opacity:1,y:0}} transition={{duration:.22}}>
    <div className="eyebrow">{dua.category}{next&&<span className="scheduled-indicator"><CalendarDays size={14}/> Scheduled</span>}</div><h3>{dua.title}</h3>
    {dua.arabic&&<p className="arabic" lang="ar" dir="rtl">{dua.arabic}</p>}{transliteration&&dua.transliteration&&<p className="transliteration">{dua.transliteration}</p>}
    {dua.translation ? <p className="translation">{dua.translation}</p> : <p className="small">English translation unavailable.</p>}
    {dua.translationAttribution && <p className="small">{dua.translationAttribution}</p>}
    <p className="context">{dua.context}</p>
    {saved&&<p className="small card-saved-date">{c.data.savedAt[dua.id]?`Saved ${new Date(c.data.savedAt[dua.id]).toLocaleDateString()}`:'Saved before date tracking'}{next&&<> · Next: {new Date(next.date+'T12:00:00').toLocaleDateString()} at {next.s.time}</>}</p>}
    <div className="card-bottom">{dua.url?<a href={dua.url} target="_blank" rel="noreferrer">{dua.reference} ↗</a>:<span>{dua.reference}</span>}<SaveDuaButton id={dua.id}/></div>
    <div className="dua-organizer-actions"><button type="button" onClick={()=>setModal('read')}><BookOpen size={16}/> Read du’a</button><button type="button" onClick={()=>setModal('schedule')}><CalendarDays size={16}/> Schedule du’a</button>{saved&&<button type="button" onClick={()=>setModal('collections')}><FolderHeart size={16}/> Collections</button>}
      {day&&<button type="button" aria-pressed={!!added} onClick={()=>c.toggleDay(day,dua.id)}>{added?<X size={16}/>:<Plus size={16}/>} {added?'Remove from day':'Add to this day'}</button>}
    </div>
  </motion.article>{modal==='schedule'&&<ScheduleDialog target={{kind:'dua',id:dua.id}} date={day} onClose={()=>setModal(null)}/>} {modal==='read'&&<DuaReader items={[dua]} onClose={()=>setModal(null)}/>} {modal==='collections'&&<CollectionMembershipDialog dua={dua} onClose={()=>setModal(null)}/>}</>
}

