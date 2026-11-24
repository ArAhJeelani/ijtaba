import {useRef,useState} from 'react';
import type {Dua} from '../data/duas';
import {personalDuaLimits} from '../data/organizer';
import {OrganizerDialog} from './OrganizerDialog';

export function EditPersonalDuaDialog({dua,onClose,onSave}:{
  dua:Dua;onClose:()=>void;onSave:(title:string,prayer:string)=>void;
}){
  const [title,setTitle]=useState(dua.title);
  const [prayer,setPrayer]=useState(dua.translation);
  const [error,setError]=useState('');
  const titleInput=useRef<HTMLInputElement>(null);

  return <OrganizerDialog title="Edit personal du’a" onClose={onClose} initialFocus={titleInput}>
    <form className="organizer-form" onSubmit={event=>{
      event.preventDefault();
      if(!title.trim() || !prayer.trim()){
        setError('Enter a title and prayer text.');
        return;
      }
      if(title.trim().length>personalDuaLimits.title || prayer.trim().length>personalDuaLimits.prayer){
        setError('Keep the title within 120 characters and the prayer within 4,000 characters.');
        return;
      }
      onSave(title,prayer);
    }}>
      <label>Title<input ref={titleInput} required maxLength={personalDuaLimits.title} value={title} onChange={event=>setTitle(event.target.value)}/></label>
      <label>Your prayer<textarea required rows={5} maxLength={personalDuaLimits.prayer} value={prayer} onChange={event=>setPrayer(event.target.value)}/></label>
      {error && <p role="alert">{error}</p>}
      <div className="organizer-actions">
        <button type="submit" className="button">Save Changes</button>
        <button type="button" className="button outline" onClick={onClose}>Cancel</button>
      </div>
    </form>
  </OrganizerDialog>;
}

export function DeletePersonalDuaDialog({dua,onClose,onDelete}:{
  dua:Dua;onClose:()=>void;onDelete:()=>void;
}){
  const cancelButton=useRef<HTMLButtonElement>(null);
  return <OrganizerDialog title="Permanently delete this du’a?" onClose={onClose} initialFocus={cancelButton}>
    <p>“{dua.title}” will be permanently deleted from your organizer, along with its collection memberships, calendar entries, and individual schedules.</p>
    <div className="organizer-actions">
      <button type="button" className="button outline" ref={cancelButton} onClick={onClose}>Cancel</button>
      <button type="button" className="button" onClick={onDelete}>Delete permanently</button>
    </div>
  </OrganizerDialog>;
}
