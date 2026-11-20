import {useState} from 'react';
import {useCollection} from '../state/Collection';
import type {Dua} from '../data/duas';
import {OrganizerDialog} from './OrganizerDialog';
export function CollectionMembershipDialog({dua,onClose}:{dua:Dua;onClose:()=>void}){
  const c=useCollection(),[name,setName]=useState('');
  return <OrganizerDialog title="Keep this du’a in your collections" onClose={onClose}><p>{dua.title}</p><p className="small">Choose as many as you like. Each collection points to the same du’a.</p><div className="membership-options">{c.data.collections.map(g=><label key={g.id}><input type="checkbox" checked={c.data.memberships.some(m=>m.collectionId===g.id&&m.duaId===dua.id)} onChange={()=>c.toggleMembership(g.id,dua.id)}/>{g.name}</label>)}</div>{!c.data.collections.length&&<p>No collections yet. Create your first below.</p>}<form className="organizer-form" onSubmit={e=>{e.preventDefault();if(!name.trim())return;const id=c.createCollection(name);c.toggleMembership(id,dua.id);setName('')}}><label>New collection name<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. My Tahajjud Du’as"/></label><button className="button" type="submit">Create & add du’a</button></form><button className="underlined" type="button" onClick={onClose}>Done</button></OrganizerDialog>
}
