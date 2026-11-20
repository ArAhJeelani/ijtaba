import {useEffect,useRef,type ReactNode,type KeyboardEventHandler} from 'react';
import {X} from 'lucide-react';
export function OrganizerDialog({title,onClose,children,onKeyDown}:{title:string;onClose:()=>void;children:ReactNode;onKeyDown?:KeyboardEventHandler<HTMLDialogElement>}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.showModal();return()=>{ref.current?.close();document.body.style.overflow=overflow;previous?.focus()}},[]);
  return <dialog ref={ref} className="organizer-dialog" aria-label={title} onKeyDown={onKeyDown} onCancel={e=>{e.preventDefault();onClose()}}><div className="organizer-dialog-top"><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog"><X/></button></div>{children}</dialog>
}
