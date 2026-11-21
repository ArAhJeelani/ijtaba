import {useRef,useState,type ChangeEvent} from 'react';
import {duas} from '../data/duas';
import type {OrganizerData} from '../data/organizer';
import {useCollection} from '../state/Collection';
import {maximumBackupBytes,exportOrganizerBackup,parseOrganizerBackup} from '../state/organizerBackup';
import {emptyData} from '../state/organizerStorage';
import {dateKey} from '../utils/calendar';
import {OrganizerDialog} from './OrganizerDialog';

function download(text:string,filename:string,type:string){
  const url=URL.createObjectURL(new Blob([text],{type}));
  const link=document.createElement('a');
  link.href=url;
  link.download=filename;
  document.body.append(link);
  try{link.click()}finally{
    link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}

type Preview={
  kind:'import'|'reset';
  next:OrganizerData;
  current:OrganizerData;
  recoveryRaw:string|null;
};

export function OrganizerBackupPanel({onRestored}:{onRestored:()=>void}){
  const {data,recoveryRaw,replaceOrganizer}=useCollection();
  const fileInput=useRef<HTMLInputElement>(null);
  const importButton=useRef<HTMLButtonElement>(null);
  const cancelButton=useRef<HTMLButtonElement>(null);
  const [preview,setPreview]=useState<Preview|null>(null);
  const [reading,setReading]=useState(false);
  const [error,setError]=useState('');
  const [status,setStatus]=useState('');

  const exportCurrent=()=>{
    setError('');
    try{
      const now=new Date();
      download(exportOrganizerBackup(data,now),`ijabah-backup-${dateKey(now)}.json`,'application/json');
      setStatus('Backup download started.');
    }catch{
      setError('The backup download could not start. Please try again.');
    }
  };

  const exportOriginal=()=>{
    if(recoveryRaw===null)return;
    setError('');
    try{
      download(recoveryRaw,`ijabah-recovery-${dateKey(new Date())}.txt`,'text/plain');
      setStatus('Original data download started.');
    }catch{
      setError('The original data download could not start. Please try again.');
    }
  };

  const chooseFile=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.currentTarget.files?.[0];
    event.currentTarget.value='';
    if(!file)return;
    setStatus('');
    setError('');
    if(file.size>maximumBackupBytes){
      setError('Backups must be 10 MB or smaller.');
      return;
    }
    setReading(true);
    try{
      let text:string;
      try{text=await file.text()}catch{throw new Error('This file could not be read. Please choose it again.')}
      const next=parseOrganizerBackup(text,duas);
      setPreview({kind:'import',next,current:data,recoveryRaw});
    }catch(reason){
      setError(reason instanceof Error?reason.message:'This backup could not be opened.');
    }finally{
      setReading(false);
    }
  };

  const closePreview=()=>{
    setPreview(null);
    setError('');
  };

  const confirm=()=>{
    if(!preview)return;
    const problem=replaceOrganizer(preview.next,preview.current,preview.recoveryRaw);
    if(problem){
      setError(problem);
      return;
    }
    const restored=preview.kind==='import';
    closePreview();
    setStatus(restored?'Backup restored to this browser.':'Stored Ijabah data reset.');
    onRestored();
    requestAnimationFrame(()=>importButton.current?.focus());
  };

  return <section className="personal-section" aria-labelledby="organizer-backup-heading">
    <h2 id="organizer-backup-heading">Backup &amp; recovery</h2>
    <p className="small">Clearing browser data can erase your organizer. Keep a backup in a private place. The JSON file contains your personal du’as and notes in plain text and stays on your device during export and import.</p>
    <div className="organizer-actions">
      <button type="button" className="button outline" onClick={exportCurrent}>Export My Data</button>
      <button ref={importButton} type="button" className="button outline" aria-disabled={reading} onClick={()=>{if(!reading)fileInput.current?.click()}}>Import Backup</button>
      <input type="file" ref={fileInput} accept=".json,application/json" hidden onChange={chooseFile}/>
    </div>
    {recoveryRaw!==null && <div>
      <p className="small">The original stored data could not be read and is still saved in this browser. Download a copy before restoring a backup or resetting your organizer.</p>
      <div className="organizer-actions">
        <button type="button" className="button outline" onClick={exportOriginal}>Download Original Data</button>
        <button type="button" className="underlined" disabled={reading} onClick={()=>{
          setError('');
          setStatus('');
          setPreview({kind:'reset',next:emptyData(),current:data,recoveryRaw});
        }}>Reset Stored Data</button>
      </div>
    </div>}
    {!preview && <div role="status">{reading?'Reading backup…':status}</div>}
    {!preview && error && <p role="alert">{error}</p>}
    {preview && <OrganizerDialog
      title={preview.kind==='import'?'Replace existing data?':'Reset stored data?'}
      onClose={closePreview}
      initialFocus={cancelButton}
    >
      {preview.kind==='import'?<>
        <p>This backup will replace your current organizer, including all personal du’as, collections, and schedules. Export your current data first if you want to keep it.</p>
        <dl className="backup-counts">
          <div><dt>Personal du’as</dt><dd>{preview.next.personal.length}</dd></div>
          <div><dt>Collections</dt><dd>{preview.next.collections.length}</dd></div>
          <div><dt>Schedules</dt><dd>{preview.next.schedules.length}</dd></div>
        </dl>
      </>:<p>This permanently clears your organizer from this browser. Download the original data first if you want to keep a copy for recovery.</p>}
      <div role="status">{status}</div>
      {error && <p role="alert">{error}</p>}
      <div className="organizer-actions">
        <button ref={cancelButton} type="button" className="button outline" onClick={closePreview}>Cancel</button>
        {recoveryRaw!==null && <button type="button" className="button outline" onClick={exportOriginal}>Download Original Data</button>}
        <button type="button" className="button outline" onClick={exportCurrent}>Export My Data</button>
        <button type="button" className="button" onClick={confirm}>{preview.kind==='import'?'Replace Existing Data':'Reset Organizer'}</button>
      </div>
    </OrganizerDialog>}
  </section>;
}
