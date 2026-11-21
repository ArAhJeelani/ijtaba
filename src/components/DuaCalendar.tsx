import {useState} from 'react';
import {CalendarDays,ChevronLeft,ChevronRight,Plus} from 'lucide-react';
import {Link,useSearchParams} from 'react-router-dom';
import {motion,useReducedMotion} from 'motion/react';
import {useCollection} from '../state/Collection';
import type {ScheduledDua} from '../data/organizer';
import {calendarDate,collectionDate,dateKey,fullDate} from '../utils/calendar';
import {addDays,nextOccurrence,occursOn} from '../utils/schedules';
import {DuaCard} from './DuaCard';
import {ScheduleDialog} from './ScheduleDialog';
import {ScheduleEntry} from './ScheduleEntry';
import './dua-calendar.css';
const monthLabel=new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'});
const weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export function DuaCalendar(){
  const [params,setParams]=useSearchParams(),c=useCollection(),reduced=useReducedMotion();
  const [view,setView]=useState<'month'|'week'>('month'),[editing,setEditing]=useState<ScheduledDua|null>(null),[adding,setAdding]=useState(false);
  const selected=collectionDate(params.get('date')),day=dateKey(selected),today=dateKey(new Date()),year=selected.getFullYear(),month=selected.getMonth();
  const select=(date:string)=>setParams({date},{replace:true});
  const leading=calendarDate(year,month,1).getDay(),length=calendarDate(year,month+1,0).getDate();
  const dates=view==='week'?Array.from({length:7},(_,i)=>addDays(day,i-selected.getDay())):Array.from({length},(_,i)=>dateKey(calendarDate(year,month,i+1)));
  const forDay=(date:string)=>c.calendarSchedules.filter(s=>occursOn(s,date)).sort((a,b)=>a.time.localeCompare(b.time));
  const scheduled=forDay(day),legacy=c.itemsForDay(day);
  const upcoming=c.calendarSchedules.map(s=>({s,date:nextOccurrence(s,today,new Date().toTimeString().slice(0,5))})).filter(x=>x.date).sort((a,b)=>(a.date!+a.s.time).localeCompare(b.date!+b.s.time)).slice(0,8);
  const rangeKey=view==='month'?`${year}-${month}`:dates[0];
  function navigate(delta:number){select(view==='week'?addDays(day,delta*7):dateKey(calendarDate(year,month+delta,1)))}
  return <main className="section page daily-page"><div className="section-heading"><span className="eyebrow">A GENTLE INVITATION TO RETURN</span><h2>My Du’a Calendar</h2><p>Your prayers, in your own time. Invitations to remember, never obligations.</p><p className="small">Local clock time · {Intl.DateTimeFormat().resolvedOptions().timeZone}. No notifications are sent.</p></div>
    <div className="calendar-toolbar"><div className="collection-tabs" aria-label="Calendar view">{(['month','week'] as const).map(v=><button key={v} aria-pressed={view===v} className={view===v?'selected':''} onClick={()=>setView(v)}>{v==='month'?'Month':'Week'}</button>)}</div><div className="calendar-schedule-actions"><Link className="underlined" to="/discover/profiles">Browse Du’a Profiles ↗</Link><button className="button" disabled={!c.items.length&&!c.data.collections.length} onClick={()=>setAdding(true)}><Plus size={16}/> Schedule du’a</button></div></div>
    {!c.items.length&&!c.data.collections.length&&<p className="small">Save a du’a to get started. <Link className="underlined" to="/discover">Browse the library ↗</Link></p>}
    <div className="daily-layout"><section className="daily-calendar" aria-label="Choose a date"><div className="daily-month"><button aria-label={view==='month'?'Previous month':'Previous week'} disabled={year<=1} onClick={()=>navigate(-1)}><ChevronLeft size={20}/></button><h3 aria-live="polite">{view==='month'?monthLabel.format(selected):`${new Date(dates[0]+'T12:00:00').toLocaleDateString()} – ${new Date(dates[6]+'T12:00:00').toLocaleDateString()}`}</h3><button aria-label={view==='month'?'Next month':'Next week'} disabled={year>=9998} onClick={()=>navigate(1)}><ChevronRight size={20}/></button></div>
      <motion.div className="daily-grid" key={rangeKey+view} initial={{opacity:reduced?1:0}} animate={{opacity:1}} transition={{duration:.18}}>{weekdays.map(w=><span className="daily-weekday" key={w}>{w}</span>)}{view==='month'&&Array.from({length:leading},(_,i)=><span key={'blank'+i} aria-hidden="true"/>)}{dates.map(key=>{const date=new Date(key+'T12:00:00'),count=forDay(key).length+(c.data.days[key]?.length||0);return <button type="button" id={`day-${key}`} className="daily-date" key={key} aria-pressed={key===day} aria-current={key===today?'date':undefined} aria-label={`${fullDate.format(date)}, ${count} scheduled or gathered items`} onClick={()=>select(key)} onKeyDown={e=>{const delta=({ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7} as Record<string,number>)[e.key];if(delta){e.preventDefault();const next=addDays(key,delta);select(next);requestAnimationFrame(()=>document.getElementById('day-'+next)?.focus())}}}>{date.getDate()}{count>0&&<small aria-hidden="true">{count}</small>}</button>})}</motion.div><button className="underlined" onClick={()=>select(today)}><CalendarDays size={16}/> Go to today</button>
    </section><section className="daily-selection" aria-label="Selected day’s du’as"><div className="daily-selection-header"><div><h3>{fullDate.format(selected)}</h3><p className="small">{scheduled.length} scheduled · {legacy.length} gathered for this day</p></div><button className="button" disabled={!c.items.length} onClick={()=>setAdding(true)}>Add to date ↗</button></div>{scheduled.map(s=><ScheduleEntry key={s.id} schedule={s} onEdit={setEditing}/>)}{!scheduled.length&&!legacy.length&&<div className="empty"><h3>A little space for your heart.</h3><p>No du’as planned for this day.</p><Link className="underlined" to={`/discover?date=${day}`}>Find a du’a to bring here ↗</Link></div>}{legacy.length>0&&<><p className="small">Gathered for this day · no specific time</p>{legacy.map(d=><DuaCard key={d.id} dua={d} day={day} dailyView/>)}</>}</section></div>
    <div className="calendar-agendas"><section><h3>Today’s du’as</h3>{forDay(today).map(s=><ScheduleEntry key={s.id} schedule={s} onEdit={setEditing}/>)}{!forDay(today).length&&<p className="small">No timed invitations today.</p>}{c.itemsForDay(today).length>0&&<button className="underlined" onClick={()=>select(today)}>View {c.itemsForDay(today).length} du’as gathered for today</button>}</section><section><h3>Upcoming</h3><p className="small">The next occurrence of each active schedule.</p>{upcoming.map(({s,date})=><ScheduleEntry key={s.id} schedule={s} date={date!} onEdit={setEditing}/>)}{!upcoming.length&&<p className="small">Your next invitation will appear here.</p>}</section></div>
    <details className="all-schedules"><summary>Manage all schedules ({c.data.schedules.length}), including paused and past</summary>{c.data.schedules.map(s=><ScheduleEntry key={s.id} schedule={s} date={s.date} onEdit={setEditing}/>)}{!c.data.schedules.length&&<p>No schedules yet.</p>}</details>
    {(adding||editing)&&<ScheduleDialog key={editing?.id||'new'} initial={editing||undefined} date={day} onClose={()=>{setAdding(false);setEditing(null)}}/>}
  </main>
}

