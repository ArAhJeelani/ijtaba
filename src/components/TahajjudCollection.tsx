import {useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {useCollection} from '../state/Collection';
import {ScheduleDialog} from './ScheduleDialog';
export function TahajjudCollection(){
  const c=useCollection(),navigate=useNavigate(),[scheduling,setScheduling]=useState(false);
  const group=c.data.collections.find(g=>g.name==='My Tahajjud Du’as');
  return <section className="tahajjud-collection"><span className="eyebrow">BRING YOUR INTENTIONS INTO THE NIGHT</span><h2>My Tahajjud Du’as</h2><p>Gather your night prayers in a collection. Use the calculator above to check your chosen night, then set a time to revisit them.</p><p className="small">For now, this is a custom clock-time schedule. It does not move automatically with changing prayer times. If calculated times are unavailable, use a trusted timetable and the manual calculator.</p><div className="organizer-actions">{group?<Link className="button" to={`/my-duas?collection=${group.id}`}>Open collection ↗</Link>:<button className="button" onClick={()=>{const id=c.createCollection('My Tahajjud Du’as');navigate(`/my-duas?collection=${id}`)}}>Create my Tahajjud collection</button>}{group&&<button className="underlined" disabled={!c.collectionItems(group.id).length} onClick={()=>setScheduling(true)}>Schedule a time</button>}</div>{scheduling&&group&&<ScheduleDialog target={{kind:'collection',id:group.id}} onClose={()=>setScheduling(false)}/>}</section>
}
