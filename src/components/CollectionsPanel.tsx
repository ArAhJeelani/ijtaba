import {useState} from 'react';
import {useCollection} from '../state/Collection';
import {OrganizerDialog} from './OrganizerDialog';
import {ScheduleDialog} from './ScheduleDialog';
export function CollectionsPanel({selected,onSelect}:{selected:string;onSelect:(id:string)=>void}){
  const c=useCollection(),[name,setName]=useState(''),[editing,setEditing]=useState<string|null>(null),[deleting,setDeleting]=useState<string|null>(null),[scheduling,setScheduling]=useState<string|null>(null);
  const group=c.data.collections.find(g=>g.id===selected);
  return <section className="collections-panel" aria-label="Custom collections"><div className="collection-tabs"><button className={!selected?'selected':''} aria-pressed={!selected} onClick={()=>onSelect('')}>All my du’as <span>{c.items.length}</span></button>{c.data.collections.map(g=><button key={g.id} className={selected===g.id?'selected':''} aria-pressed={selected===g.id} onClick={()=>onSelect(g.id)}>{g.name} <span>{c.collectionItems(g.id).length}</span></button>)}</div>
    <form className="collection-create" onSubmit={e=>{e.preventDefault();if(!name.trim())return;const id=c.createCollection(name);if(id){onSelect(id);setName('')}}}><label>New collection<input required value={name} onChange={e=>setName(e.target.value)} maxLength={80} placeholder="e.g. Du’as for My Parents"/></label><button className="button" type="submit">Create collection</button></form>
    {group&&<div className="organizer-actions"><button className="underlined" onClick={()=>{setEditing(group.id);setName(group.name)}}>Rename collection</button><button className="underlined" onClick={()=>setDeleting(group.id)}>Delete collection</button><button className="button" disabled={!c.collectionItems(group.id).length} onClick={()=>setScheduling(group.id)}>Schedule collection ↗</button></div>}
    {editing&&<OrganizerDialog title="Rename collection" onClose={()=>{setEditing(null);setName('')}}><form className="organizer-form" onSubmit={e=>{e.preventDefault();if(!name.trim())return;if(c.renameCollection(editing,name)){setEditing(null);setName('')}}}><label>Collection name<input autoFocus required maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label><button className="button">Save name</button></form></OrganizerDialog>}
    {deleting&&<OrganizerDialog title="Delete this collection?" onClose={()=>setDeleting(null)}><p>The collection and schedules for this whole collection will be removed. Your du’as, their individual schedules, and other collections will stay.</p><div className="organizer-actions"><button className="button outline" onClick={()=>setDeleting(null)}>Keep collection</button><button className="button" onClick={()=>{c.deleteCollection(deleting);setDeleting(null);onSelect('')}}>Delete collection</button></div></OrganizerDialog>}
    {scheduling&&<ScheduleDialog target={{kind:'collection',id:scheduling}} onClose={()=>setScheduling(null)}/>}
  </section>
}
