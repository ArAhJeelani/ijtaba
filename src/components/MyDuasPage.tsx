import {useRef,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {ArrowDown,ArrowUp,Check,Plus} from 'lucide-react';
import {useCollection} from '../state/Collection';
import {DuaCard} from './DuaCard';
import {DuaReader} from './DuaReader';
import {CollectionsPanel} from './CollectionsPanel';
import {personalDuaLimits} from '../data/organizer';
import type {Dua} from '../data/duas';
import {DeletePersonalDuaDialog,EditPersonalDuaDialog} from './PersonalDuaDialog';
import {OrganizerBackupPanel} from './OrganizerBackupPanel';
export function MyDuasPage(){
  const c=useCollection(),[params,setParams]=useSearchParams(),selected=params.get('collection')||'';
  const [reading,setReading]=useState(false),[personal,setPersonal]=useState(false),[title,setTitle]=useState(''),[prayer,setPrayer]=useState('');
  const [management,setManagement]=useState<{action:'edit'|'delete';id:string}|null>(null);
  const personalButton=useRef<HTMLButtonElement>(null);
  const items=selected?c.collectionItems(selected):c.items;
  const savedIds=new Set(c.data.ids);
  const unsavedPersonal=selected?[]:c.data.personal.filter(dua=>!savedIds.has(dua.id));
  const managedDua=c.data.personal.find(dua=>dua.id===management?.id);
  const closeManagement=()=>setManagement(null);
  const card=(dua:Dua)=><DuaCard
    dua={dua}
    onEditPersonal={dua.personal?()=>setManagement({action:'edit',id:dua.id}):undefined}
    onDeletePersonal={dua.personal?()=>setManagement({action:'delete',id:dua.id}):undefined}
  />;
  return <main className="section page"><div className="section-heading"><span className="eyebrow">YOUR PERSONAL COLLECTION</span><h2>My Du’as</h2><p>Your intentions, gathered in one place.</p></div><CollectionsPanel selected={selected} onSelect={id=>setParams(id?{collection:id}:{})}/><div className="collection-toolbar"><span>{items.length} du’as · {items.filter(d=>c.read.includes(d.id)).length} read this session</span><div><Link className="underlined" to="/calendar">My Du’a Calendar ↗</Link><button className="underlined" onClick={c.reset}>Reset reading progress</button><button className="button" disabled={!items.length} onClick={()=>setReading(true)}>Begin reading</button></div></div>
    {!items.length&&<div className="empty"><h3>{selected?'Make room for what matters.':'Your collection begins with one du’a.'}</h3><p>{selected?'Open a saved du’a’s Collections control to add it here.':'Save a du’a from the library or write your own below.'}</p><Link className="button" to={selected?'/my-duas':'/discover'}>{selected?'View all my du’as':'Discover du’as'} ↗</Link></div>}
    <div className="saved-list">{items.map((d,i)=><div className="saved-row" key={d.id}><div className="row-tools"><button aria-label={`${c.read.includes(d.id)?'Mark unread':'Mark read'}: ${d.title}`} aria-pressed={c.read.includes(d.id)} onClick={()=>c.mark(d.id)}>{c.read.includes(d.id)?<Check size={16}/>:i+1}</button>{!selected&&<><button disabled={i===0} aria-label={`Move ${d.title} up`} onClick={()=>c.move(d.id,-1)}><ArrowUp size={17}/></button><button disabled={i===items.length-1} aria-label={`Move ${d.title} down`} onClick={()=>c.move(d.id,1)}><ArrowDown size={17}/></button></>}</div>{card(d)}</div>)}</div>
    {unsavedPersonal.length>0&&<section className="personal-section" aria-labelledby="unsaved-personal-heading">
      <h2 id="unsaved-personal-heading">Unsaved personal du’as</h2>
      <div className="saved-list">{unsavedPersonal.map(dua=><div key={dua.id}>{card(dua)}</div>)}</div>
    </section>}
    <section className="personal-section"><button ref={personalButton} className="underlined" aria-expanded={personal} onClick={()=>setPersonal(!personal)}><Plus size={17}/> A prayer in your own words</button>{personal&&<form className="personal-form" onSubmit={e=>{e.preventDefault();if(!title.trim()||!prayer.trim())return;c.addPersonal(title.trim(),prayer.trim());setTitle('');setPrayer('');setPersonal(false)}}><p>Personal prayers are labeled separately from sourced supplications. They stay in this browser and are not uploaded.</p><label>Title<input required maxLength={personalDuaLimits.title} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Your prayer<textarea required rows={4} maxLength={personalDuaLimits.prayer} value={prayer} onChange={e=>setPrayer(e.target.value)}/></label><button className="button">Add personal prayer</button></form>}</section>
    {managedDua&&management?.action==='edit'&&<EditPersonalDuaDialog dua={managedDua} onClose={closeManagement} onSave={(nextTitle,nextPrayer)=>{
      c.editPersonal(managedDua.id,nextTitle,nextPrayer);
      closeManagement();
    }}/>}
    {managedDua&&management?.action==='delete'&&<DeletePersonalDuaDialog dua={managedDua} onClose={closeManagement} onDelete={()=>{
      c.deletePersonal(managedDua.id);
      closeManagement();
      requestAnimationFrame(()=>personalButton.current?.focus());
    }}/>}
    <OrganizerBackupPanel onRestored={()=>{setParams({});setReading(false);closeManagement()}}/>
    {reading&&items.length>0&&<DuaReader items={items} onClose={()=>setReading(false)}/>}
  </main>
}
