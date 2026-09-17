'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, RotateCcw, Share2, UploadCloud, AlertCircle } from 'lucide-react';
import { Dialog } from './dialog';
import { shareLink, uploadPhoto, type ShareConfig, type SharedPhoto } from '@/lib/sharing';
export type Capture={blob:Blob;url:string;key:string};
export function PhotoResult({photo,onClose,config}:{photo:Capture|null;onClose:()=>void;config:ShareConfig}) {
  const [state,setState]=useState<'uploading'|'error'|'done'|'unavailable'>('uploading'),[progress,setProgress]=useState(0),[error,setError]=useState(''),[shared,setShared]=useState<SharedPhoto|null>(null),[qr,setQr]=useState(''),[copied,setCopied]=useState(false),[nativeShare,setNativeShare]=useState(false);
  const busy=useRef(false),controller=useRef<AbortController|null>(null),photoKey=useRef<string|null>(null);
  const send=useCallback(async()=>{
    if(!photo||busy.current)return;busy.current=true;setState('uploading');setProgress(0);setError('');
    const current=new AbortController();controller.current=current;
    try {const result=await uploadPhoto(photo.blob,photo.key,setProgress,current.signal);if(current.signal.aborted)return;setShared(result);setState('done');try{setQr(await QRCode.toDataURL(result.url,{width:240,margin:4,errorCorrectionLevel:'M',color:{dark:'#211e1e',light:'#ffffff'}}));}catch{setError('Le QR code n’a pas pu être affiché. Le lien reste disponible.');}}
    catch(err){if(!current.signal.aborted){setError(err instanceof Error?err.message:'Envoi impossible.');setState('error');}}
    finally{if(controller.current===current)busy.current=false;}
  },[photo]);
  useEffect(()=>{setNativeShare(typeof navigator.share==='function');},[]);
  useEffect(()=>{
    if(!photo){controller.current?.abort();busy.current=false;photoKey.current=null;return;}
    if(photoKey.current===photo.key)return;
    photoKey.current=photo.key;setShared(null);setQr('');setCopied(false);setError('');
    if(config.available)void send();else setState('unavailable');
  },[photo,config.available,send]);
  useEffect(()=>()=>controller.current?.abort(),[]);
  async function copy(){if(!shared)return;try{await navigator.clipboard.writeText(shared.url);setCopied(true);}catch{setError('Copie indisponible. Sélectionnez le lien ci-dessous.');}}
  return <Dialog open={!!photo} onClose={onClose} title="Votre photo" wide>
    {photo&&<div className="result-layout"><div className="photo-preview"><img src={photo.url} alt="Votre photo avec les éléments 3D"/></div>
    <div className="result-actions">
      <a className="primary-button download" href={photo.url} download="mario-ar-photo.jpg"><Download size={19}/>Télécharger</a>
      {state==='uploading'&&<div className="upload-state" role="status"><UploadCloud size={24}/><strong>{progress>=90?'Préparation du lien…':`Enregistrement · ${progress} %`}</strong><progress max={100} value={progress}/><p>Votre photo est déjà prête à télécharger.</p></div>}
      {state==='done'&&shared&&<div className="share-ready">{qr&&<img className="qr" src={qr} alt="QR code vers votre photo partagée"/>}<h3>Scanne pour récupérer ta photo</h3><p>Disponible jusqu’au {new Date(shared.expiresAt).toLocaleDateString('fr-FR')}.</p><div className="share-buttons"><button className="secondary-button" onClick={copy}>{copied?<Check size={18}/>:<Copy size={18}/>} {copied?'Copié':'Copier le lien'}</button>{nativeShare&&<button className="secondary-button" onClick={()=>shareLink(shared.url).catch(()=>setError('Le partage a échoué. Vous pouvez copier le lien.'))}><Share2 size={18}/>Partager</button>}</div><input className="share-url" aria-label="Lien de la photo" readOnly value={shared.url} onFocus={e=>e.target.select()}/></div>}
      {state==='unavailable'&&<div className="notice"><AlertCircle size={20}/><div><strong>Partage indisponible</strong><p>{config.reason||'Le service de partage n’est pas configuré.'} Vous pouvez télécharger la photo ici.</p></div></div>}
      {error&&<div className="notice error" role="alert"><AlertCircle size={20}/><div><strong>{state==='error'?'Photo conservée sur cet appareil':'Information'}</strong><p>{error}</p>{state==='error'&&<button className="text-button" onClick={send}>Réessayer l’envoi</button>}</div></div>}
      <p className="privacy-note">Les photos partagées sont accessibles par leur lien pendant {config.days} jours. Toute personne disposant du lien peut les voir.</p>
      <button className="secondary-button retake" onClick={onClose}><RotateCcw size={18}/>Reprendre une photo</button>
    </div></div>}
  </Dialog>;
}
