import type {ScheduledDua} from '../data/organizer.ts';
import {dateKey} from './calendar.ts';
export function validDay(value:string){
  return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(new Date(value+'T12:00:00').getTime())&&dateKey(new Date(value+'T12:00:00'))===value;
}
export function addDays(day:string,amount:number){const date=new Date(day+'T12:00:00');date.setDate(date.getDate()+amount);return dateKey(date)}
export function occursOn(schedule:ScheduledDua,day:string){
  if(schedule.paused||!validDay(day)||day<schedule.date)return false;
  const date=new Date(day+'T12:00:00'),start=new Date(schedule.date+'T12:00:00');
  switch(schedule.recurrence.frequency){
    case 'once':return day===schedule.date;
    case 'daily':return true;
    case 'weekdays':return schedule.recurrence.weekdays.includes(date.getDay());
    case 'weekly':return date.getDay()===start.getDay();
    case 'monthly':return date.getDate()===start.getDate(); // Skip months without that date.
  }
}
export function nextOccurrence(schedule:ScheduledDua,from:string,afterTime=''){
  const first=schedule.date>from?schedule.date:from;
  for(let i=0;i<=370;i++){const day=addDays(first,i);if(occursOn(schedule,day)&&(day>from||!afterTime||schedule.time>=afterTime))return day}
  // One-off schedules can be further away than the bounded recurring search.
  if(!schedule.paused&&schedule.recurrence.frequency==='once'&&schedule.date>from)return schedule.date;
  return null;
}
export const repeatLabels={once:'Once',daily:'Every day',weekdays:'Selected weekdays',weekly:'Every week',monthly:'Every month'};
