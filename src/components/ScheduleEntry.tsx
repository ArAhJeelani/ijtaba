import {useState} from 'react';
import type {ScheduledDua} from '../data/organizer';
import {useCollection} from '../state/Collection';
import {repeatLabels} from '../utils/schedules';
import {DuaReader} from './DuaReader';
export function ScheduleEntry({schedule,date,onEdit}:{schedule:ScheduledDua;date?:string;onEdit:(s:ScheduledDua)=>void}){
  const c=useCollection(),[reading,setReading]=useState(false),items=c.targetItems(schedule.target);
  return <article className="schedule-entry"><div className="schedule-entry-heading"><span className="schedule-clock">{schedule.time}</span><div><h3>{c.targetName(schedule.target)}</h3><p className="small">{date&&`${new Date(date+'T12:00:00').toLocaleDateString()} · `}{repeatLabels[schedule.recurrence.frequency]}{schedule.paused?' · Paused':''}{schedule.target.kind==='collection'?` · ${items.length} du’as`:''}</p></div></div>{schedule.note&&<p className="schedule-note">{schedule.note}</p>}{!items.length&&<p className="small">This collection is empty. Add du’as in My Du’as.</p>}<div className="organizer-actions"><button className="underlined" disabled={!items.length} onClick={()=>setReading(true)}>Read du’a{items.length>1?'s':''}</button><button className="underlined" onClick={()=>onEdit(schedule)}>Edit schedule</button><button className="underlined" onClick={()=>c.pauseSchedule(schedule.id)}>{schedule.paused?'Resume':'Pause'}</button><button className="underlined" onClick={()=>c.deleteSchedule(schedule.id)}>Remove schedule</button></div>{reading&&<DuaReader items={items} onClose={()=>setReading(false)}/>}</article>
}
