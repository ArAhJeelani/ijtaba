import {useState} from 'react';
import {Link} from 'react-router-dom';
import type {ScheduledDua} from '../data/organizer';
import {useCollection} from '../state/Collection';
import {repeatLabels} from '../utils/schedules';
import {DuaReader} from './DuaReader';
export function ScheduleEntry({schedule,date,onEdit}:{schedule:ScheduledDua;date?:string;onEdit:(s:ScheduledDua)=>void}){
  const c=useCollection(),[reading,setReading]=useState(false),items=c.targetItems(schedule.target);
  const isProfile = schedule.target.kind === 'profile';
  const unavailable = isProfile && !items.length;
  const profileUrl = isProfile && !unavailable ? `/discover/profiles/${schedule.target.id}` : undefined;
  const title = c.targetName(schedule.target);
  return <article className="schedule-entry">
    <div className="schedule-entry-heading"><span className="schedule-clock">{schedule.time}</span><div>
      <h3>{profileUrl ? <Link className="underlined" to={profileUrl}>{title}</Link> : title}</h3>
      <p className="small">{date&&`${new Date(date+'T12:00:00').toLocaleDateString()} · `}{repeatLabels[schedule.recurrence.frequency]}{schedule.paused?' · Paused':''}{schedule.target.kind==='collection'?` · ${items.length} du’as`:''}</p>
    </div></div>
    {schedule.note&&<p className="schedule-note">{schedule.note}</p>}
    {!items.length && <p className="small">{unavailable
      ? 'This profile is currently unavailable. The schedule is saved but won’t appear on the calendar while the profile is unavailable.'
      : 'This collection is empty. Add du’as in My Du’as.'}</p>}
    <div className="organizer-actions">
      {!unavailable && <>
        {profileUrl
          ? <Link className="underlined" to={profileUrl}>Open profile ↗</Link>
          : <button className="underlined" disabled={!items.length} onClick={()=>setReading(true)}>Read du’a{items.length>1?'s':''}</button>}
        <button className="underlined" onClick={()=>onEdit(schedule)}>Edit schedule</button>
        <button className="underlined" onClick={()=>c.pauseSchedule(schedule.id)}>{schedule.paused?'Resume':'Pause'}</button>
      </>}
      <button className="underlined" onClick={()=>c.deleteSchedule(schedule.id)}>Remove schedule</button>
    </div>
    {reading&&<DuaReader items={items} onClose={()=>setReading(false)}/>}
  </article>
}
