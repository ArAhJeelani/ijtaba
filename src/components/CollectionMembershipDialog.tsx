import {useState} from 'react';
import {useCollection} from '../state/Collection';
import type {Dua} from '../data/duas';
import {OrganizerDialog} from './OrganizerDialog';
export function CollectionMembershipDialog({dua,onClose}:{dua:Dua;onClose:()=>void}){
  const c=useCollection(),[name,setName]=useState('');
  const [addedTo,setAddedTo]=useState<string|null>(null);
  return <OrganizerDialog title="Keep this du’a in your collections" onClose={onClose}>
    <p>{dua.title}</p>
    <p className="small">Choose as many as you like. Each collection points to the same du’a.</p>
    <div className="membership-options">{c.data.collections.map(group=>{
      const checked=c.data.memberships.some(m=>m.collectionId===group.id&&m.duaId===dua.id);
      const count=c.collectionItems(group.id).length;
      return <label key={group.id}>
        <input type="checkbox" checked={checked} onChange={()=>{
          if(!c.toggleMembership(group.id,dua.id))return;
          setAddedTo(checked?null:group.id);
        }}/>
        {group.name}
        <span className="membership-count" aria-label={`${count} du’as`}>
          {count}
          {addedTo===group.id && <span className="collection-count-gain" aria-hidden="true">+1</span>}
        </span>
      </label>;
    })}</div>
    <div role="status" className="small">
      {addedTo && `+1 added to ${c.data.collections.find(group=>group.id===addedTo)?.name}. ${c.collectionItems(addedTo).length} total.`}
    </div>
    {!c.data.collections.length&&<p>No collections yet. Create your first below.</p>}
    <form className="organizer-form" onSubmit={e=>{
      e.preventDefault();
      if(!name.trim())return;
      const id=c.createCollection(name,dua.id);
      if(!id)return;
      setAddedTo(id);
      setName('');
    }}>
      <label>New collection name<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. My Tahajjud Du’as"/></label>
      <button className="button" type="submit">Create & add du’a</button>
    </form>
    <button className="underlined" type="button" onClick={onClose}>Done</button>
  </OrganizerDialog>
}
