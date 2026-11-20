import {useState,type FormEvent} from 'react';
import {findDuaProfile} from '../data/duaProfiles';
import type {Repeat,ScheduledDua,ScheduleTarget} from '../data/organizer';
import {useCollection} from '../state/Collection';
import {dateKey} from '../utils/calendar';
import {addDays,repeatLabels,validDay} from '../utils/schedules';
import {OrganizerDialog} from './OrganizerDialog';
const weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export function ScheduleDialog({onClose,target,initial,date:initialDate}:{onClose:()=>void;target?:ScheduleTarget;initial?:ScheduledDua;date?:string}){
  const c=useCollection(),today=dateKey(new Date());
  const [choice,setChoice]=useState<ScheduleTarget|undefined>(initial?.target||target);
  const [date,setDate]=useState(initial?.date||initialDate||addDays(today,1)),[time,setTime]=useState(initial?.time||'21:00');
  const [frequency,setFrequency]=useState<Repeat>(initial?.recurrence.frequency||'once'),[days,setDays]=useState<number[]>(initial?.recurrence.weekdays||[5]);
  const [note,setNote]=useState(initial?.note||''),[error,setError]=useState('');
  const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
  const profile = choice?.kind === 'profile' ? findDuaProfile(choice.id) : undefined;
  const canSchedule = !!profile || !!(choice && c.targetItems(choice).length);
  const optionalStart = !!profile && frequency !== 'once';
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!choice || !canSchedule) {
      setError('Choose a du’a or a collection with at least one du’a.');
      return;
    }
    const start = optionalStart && !date ? today : date;
    if (!validDay(start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      setError('Choose a valid date and time.');
      return;
    }
    if (frequency === 'weekdays' && !days.length) {
      setError('Select at least one weekday.');
      return;
    }
    c.saveSchedule({
      id: initial?.id ?? crypto.randomUUID(), target: choice, date: start, time,
      recurrence: { frequency, weekdays: days }, note: note.trim(),
      paused: initial?.paused ?? false, createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
    onClose();
  }
  return <OrganizerDialog title={profile ? 'Schedule a du’a profile' : 'When would you like to revisit this du’a?'} onClose={onClose}><form className="organizer-form" onSubmit={submit}>
    {target||initial?<p className="schedule-subject">{choice&&c.targetName(choice)}</p>:<label>Du’a or collection<select required value={choice?`${choice.kind}:${choice.id}`:''} onChange={e=>{const [kind,...id]=e.target.value.split(':');setChoice({kind:kind as 'dua'|'collection',id:id.join(':')})}}><option value="">Choose from My Du’as…</option><optgroup label="Saved du’as">{c.items.map(d=><option value={`dua:${d.id}`} key={d.id}>{d.title}</option>)}</optgroup><optgroup label="Collections">{c.data.collections.map(g=><option value={`collection:${g.id}`} key={g.id}>{g.name}</option>)}</optgroup></select></label>}
    <div className="schedule-presets" aria-label="Quick schedule choices"><button type="button" onClick={()=>{setDate(addDays(today,1));setTime('21:00');setFrequency('once')}}>Tomorrow · 9 PM</button><button type="button" onClick={()=>{const dow=new Date(today+'T12:00:00').getDay();setDate(addDays(today,(5-dow+7)%7));setFrequency('weekly');setTime('21:00')}}>Every Friday</button><button type="button" onClick={()=>{setDate(today);setFrequency('daily');setTime('22:00')}}>Every night · 10 PM</button></div>
    <div className="organizer-two"><label>{optionalStart ? 'Start date (optional)' : frequency==='once' ? 'Date' : 'First date'}<input required={!optionalStart} type="date" value={date} onInput={e=>setDate(e.currentTarget.value)}/></label><label>Time<input required type="time" value={time} onInput={e=>setTime(e.currentTarget.value)}/></label></div>
    {optionalStart && <p className="small">Leave the start date blank to start today.</p>}
    <label>Repeat<select value={frequency} onChange={e=>setFrequency(e.target.value as Repeat)}>{Object.entries(repeatLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
    {frequency==='weekdays'&&<fieldset className="weekday-options"><legend>Choose weekdays</legend>{weekdays.map((name,i)=><label key={name}><input type="checkbox" checked={days.includes(i)} onChange={()=>setDays(s=>s.includes(i)?s.filter(n=>n!==i):[...s,i])}/>{name}</label>)}</fieldset>}
    {frequency==='monthly'&&<p className="small">Repeats on day {new Date(date+'T12:00:00').getDate()||'…'} of the month. Months without that date are skipped.</p>}
    <label>Personal note (optional)<textarea maxLength={1000} rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="What would you like to bring to this moment?"/></label>
    <p className="small">Local clock time · {zone}. Schedules follow your device’s timezone when you travel. These are invitations, not obligations. No notifications are sent.</p>
    {initial&&<p className="small">Editing updates this entire repeating schedule.{initial.paused?' This schedule will remain paused.':''}</p>}
    {choice&&!canSchedule&&<p role="status">This collection is empty. Add a du’a to it before scheduling.</p>}
    {error&&<p role="alert">{error}</p>}<button className="button" type="submit" disabled={!canSchedule}>Save schedule ↗</button>
  </form></OrganizerDialog>
}


