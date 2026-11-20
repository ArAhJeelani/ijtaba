import {useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {ArrowDown,ArrowUp,Check,Plus} from 'lucide-react';
import {useCollection} from '../state/Collection';
import {DuaCard} from './DuaCard';
import {DuaReader} from './DuaReader';
import {CollectionsPanel} from './CollectionsPanel';
export function MyDuasPage(){
  const c=useCollection(),[params,setParams]=useSearchParams(),selected=params.get('collection')||'';
  const [reading,setReading]=useState(false),[personal,setPersonal]=useState(false),[title,setTitle]=useState(''),[prayer,setPrayer]=useState('');
  const items=selected?c.collectionItems(selected):c.items;
  return <main className="section page"><div className="section-heading"><span className="eyebrow">YOUR PERSONAL COLLECTION</span><h2>My Du’as</h2><p>Your intentions, gathered in one place.</p></div><CollectionsPanel selected={selected} onSelect={id=>setParams(id?{collection:id}:{})}/><div className="collection-toolbar"><span>{items.length} du’as · {items.filter(d=>c.read.includes(d.id)).length} read this session</span><div><Link className="underlined" to="/calendar">My Du’a Calendar ↗</Link><button className="underlined" onClick={c.reset}>Reset reading progress</button><button className="button" disabled={!items.length} onClick={()=>setReading(true)}>Begin reading</button></div></div>
    {!items.length&&<div className="empty"><h3>{selected?'Make room for what matters.':'Your collection begins with one du’a.'}</h3><p>{selected?'Open a saved du’a’s Collections control to add it here.':'Save a du’a from the library or write your own below.'}</p><Link className="button" to={selected?'/my-duas':'/discover'}>{selected?'View all my du’as':'Discover du’as'} ↗</Link></div>}
    <div className="saved-list">{items.map((d,i)=><div className="saved-row" key={d.id}><div className="row-tools"><button aria-label={`${c.read.includes(d.id)?'Mark unread':'Mark read'}: ${d.title}`} aria-pressed={c.read.includes(d.id)} onClick={()=>c.mark(d.id)}>{c.read.includes(d.id)?<Check size={16}/>:i+1}</button>{!selected&&<><button disabled={i===0} aria-label={`Move ${d.title} up`} onClick={()=>c.move(d.id,-1)}><ArrowUp size={17}/></button><button disabled={i===items.length-1} aria-label={`Move ${d.title} down`} onClick={()=>c.move(d.id,1)}><ArrowDown size={17}/></button></>}</div><DuaCard dua={d}/></div>)}</div>
    <section className="personal-section"><button className="underlined" aria-expanded={personal} onClick={()=>setPersonal(!personal)}><Plus size={17}/> A prayer in your own words</button>{personal&&<form className="personal-form" onSubmit={e=>{e.preventDefault();if(!title.trim()||!prayer.trim())return;c.addPersonal(title.trim(),prayer.trim());setTitle('');setPrayer('');setPersonal(false)}}><p>Personal prayers are labeled separately from sourced supplications. They stay in this browser and are not uploaded.</p><label>Title<input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Your prayer<textarea required rows={4} maxLength={4000} value={prayer} onChange={e=>setPrayer(e.target.value)}/></label><button className="button">Add personal prayer</button></form>}</section>
    <p className="small">Stored on this device, without an account or cloud backup. Clearing browser data removes your collection and schedules.</p>{reading&&items.length>0&&<DuaReader items={items} onClose={()=>setReading(false)}/>}
  </main>
}
