import {useState} from 'react';
import type {Dua} from '../data/duas';
import {useCollection} from '../state/Collection';
import {OrganizerDialog} from './OrganizerDialog';
export function DuaReader({items,onClose}:{items:Dua[];onClose:()=>void}){
  const [index,setIndex]=useState(0),[trans,setTrans]=useState(false),c=useCollection(),dua=items[Math.min(index,items.length-1)];
  if(!dua)return null;
  return <OrganizerDialog title="A moment for your du’a" onClose={onClose} onKeyDown={e=>{
    if(e.key==='ArrowRight'){e.preventDefault();setIndex(i=>Math.min(items.length-1,i+1))}
    if(e.key==='ArrowLeft'){e.preventDefault();setIndex(i=>Math.max(0,i-1))}
  }}><div className="organizer-reading"><span className="eyebrow">{index+1} / {items.length} · {dua.category}</span><progress aria-label="Reading progress" max={items.length} value={index+1}/><h3>{dua.title}</h3>{dua.arabic&&<p className="arabic" lang="ar" dir="rtl">{dua.arabic}</p>}{trans&&dua.transliteration&&<p className="transliteration">{dua.transliteration}</p>}<p className="translation">{dua.translation}</p><p>{dua.context}</p>{dua.url?<a className="underlined" href={dua.url} target="_blank" rel="noreferrer">{dua.reference} ↗</a>:<p className="small">{dua.reference}</p>}<label className="checkbox"><input type="checkbox" checked={trans} onChange={e=>setTrans(e.target.checked)}/> Show transliteration</label><div className="organizer-actions"><button className="underlined" onClick={()=>c.mark(dua.id)}>{c.read.includes(dua.id)?'✓ Read · mark unread':'Mark as read'}</button><button className="button outline" disabled={index===0} onClick={()=>setIndex(index-1)}>Previous</button><button className="button" onClick={()=>index===items.length-1?onClose():setIndex(index+1)}>{index===items.length-1?'Finish':'Next →'}</button></div></div></OrganizerDialog>
}
