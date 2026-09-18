'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, CopyPlus, FlipHorizontal2, HelpCircle, Layers3, LoaderCircle, RotateCcw, Trash2, X } from 'lucide-react';
import { assetById, catalog, type Asset } from '@/data/catalog';
import { useCamera } from '@/lib/use-camera';
import { MAX_OBJECTS, clamp, type SceneItem, type Transform } from '@/lib/composition';
import { useManipulation } from '@/lib/use-manipulation';
import { capturePhoto, type RenderBridge } from '@/lib/capture';
import { loadModel } from '@/lib/models';
import type { ShareConfig } from '@/lib/sharing';
import { Catalog } from './catalog';
import { Dialog } from './dialog';
import { PhotoResult, type Capture } from './photo-result';
const Scene=dynamic(()=>import('./scene'),{ssr:false});
export default function CameraApp() {
  const camera=useCamera(),bridge=useRef<RenderBridge|null>(null),surface=useRef<HTMLDivElement>(null);
  const [items,setItems]=useState<SceneItem[]>([]),[selected,setSelected]=useState<string|null>(null),[catalogOpen,setCatalogOpen]=useState(false),[help,setHelp]=useState(false),[clear,setClear]=useState(false),[loading,setLoading]=useState<string|null>(null),[photo,setPhoto]=useState<Capture|null>(null),[capturing,setCapturing]=useState(false),[toast,setToast]=useState(''),[capable,setCapable]=useState<boolean|null>(null),[hint,setHint]=useState(true);
  const [config,setConfig]=useState<ShareConfig>({available:false,days:7,reason:'Connexion au service de partage en cours.'});
  const pending=useRef(false),captureLock=useRef(false),photoUrl=useRef<string|null>(null);
  useEffect(()=>{const c=document.createElement('canvas');const context=c.getContext('webgl2');setCapable(!!context);context?.getExtension('WEBGL_lose_context')?.loseContext();try{setHint(localStorage.getItem('mario-ar-help')!=='seen');}catch{}fetch('/api/config').then(r=>r.json()).then(setConfig).catch(()=>setConfig({available:false,days:7,reason:'Le serveur est inaccessible.'}));return()=>{if(photoUrl.current)URL.revokeObjectURL(photoUrl.current);};},[]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),5500);return()=>clearTimeout(id);},[toast]);
  const update=useCallback((id:string,t:Partial<Transform>)=>setItems(prev=>prev.map(i=>i.id===id?{...i,...t}:i)),[]);
  const gestures=useManipulation(bridge,items,selected,setSelected,update),current=items.find(i=>i.id===selected);
  const reset=()=>{if(current){const a=assetById(current.assetId);update(current.id,{x:0,y:0,scale:a.initialScale,roll:0,yaw:a.initialRotation[1]});}};
  const failed=useCallback((id:string)=>{setItems(prev=>prev.filter(i=>i.id!==id));setSelected(prev=>prev===id?null:prev);setToast('Ce modèle n’a pas pu être chargé. Réessayez depuis le catalogue.');},[]);
  const lost=useCallback(()=>{setCapable(false);setToast('Le rendu 3D a été interrompu. Rechargez la page pour le réactiver.');},[]);
  async function add(asset:Asset) {
    if(pending.current)return;
    if(items.length>=MAX_OBJECTS){setToast('La scène contient déjà 10 éléments. Supprimez-en un pour continuer.');return;}
    if(!capable){setToast('Le rendu 3D nécessite un navigateur compatible WebGL 2.');return;}
    pending.current=true;setLoading(asset.id);
    try {if(asset.model)await loadModel(asset.model);const id=crypto.randomUUID();setItems(prev=>prev.length>=MAX_OBJECTS?prev:[...prev,{id,assetId:asset.id,x:0,y:0,scale:asset.initialScale,roll:0,yaw:asset.initialRotation[1]}]);setSelected(id);setCatalogOpen(false);}
    catch {setToast(`Impossible de charger ${asset.name}. Vérifiez le fichier et votre connexion.`);}finally{setLoading(null);pending.current=false;}
  }
  function duplicate(){if(!current)return;if(items.length>=MAX_OBJECTS){setToast('Maximum 10 éléments dans la scène.');return;}const id=crypto.randomUUID();setItems(prev=>[...prev,{...current,id,x:clamp(current.x+.12,-.88,.88),y:clamp(current.y-.08,-.78,.78)}]);setSelected(id);}
  async function capture(){
    if(captureLock.current||!bridge.current||!surface.current||!camera.videoRef.current)return;
    captureLock.current=true;setCapturing(true);
    try{const r=surface.current.getBoundingClientRect();const blob=await capturePhoto(camera.videoRef.current,bridge.current,camera.facing==='user',r.width,r.height);if(photoUrl.current)URL.revokeObjectURL(photoUrl.current);const url=URL.createObjectURL(blob);photoUrl.current=url;setPhoto({blob,url,key:crypto.randomUUID()});}
    catch(error){setToast(error instanceof Error?error.message:'Capture impossible.');}finally{captureLock.current=false;setCapturing(false);}
  }
  function dismissHint(){setHint(false);try{localStorage.setItem('mario-ar-help','seen');}catch{}}
  return <main className="camera-app">
    <div className="viewfinder" ref={surface} {...gestures} aria-label="Zone de composition 3D">
      <video ref={camera.videoRef} className={`camera-feed ${camera.facing==='user'?'mirrored':''}`} muted playsInline autoPlay aria-label="Flux de la caméra"/>
      {capable&&<Scene items={items} bridge={bridge} onError={failed} onContextLost={lost}/>}
      {current&&<div className="selection-marker" style={{left:`${(current.x+1)*50}%`,top:`${(1-current.y)*50}%`}}><span/>{assetById(current.assetId).name}</div>}
    </div>
    <header className="camera-header"><button className="icon-button" onClick={()=>setClear(true)} disabled={!items.length} aria-label="Vider la scène"><Trash2 size={19}/></button><button className="icon-button" onClick={()=>setHelp(true)} aria-label="Aide et crédits"><HelpCircle size={21}/></button></header>
    {camera.status!=='ready'&&<section className={`camera-start ${items.length?'compact':''}`} aria-live="polite">
      {camera.message&&<p className="camera-error"><CameraOff size={18}/>{camera.message}</p>}
      <button className="primary-button" onClick={()=>camera.start(camera.facing)} disabled={camera.status==='loading'||capable===false}>{camera.status==='loading'?<LoaderCircle className="spin" size={20}/>:<Camera size={20}/>} {camera.status==='loading'?'Ouverture de la caméra…':'Activer la caméra'}</button>
      {capable===false&&<p className="camera-error">Le rendu 3D est indisponible. Utilisez un navigateur récent avec WebGL 2 activé.</p>}
    </section>}
    {current&&<section className="transform-toolbar" aria-label="Modifier l’élément sélectionné"><div className="transform-heading"><span>{assetById(current.assetId).name}</span><button className="icon-button" onClick={()=>setSelected(null)} aria-label="Désélectionner"><X size={17}/></button></div><div className="transform-buttons"><button onClick={duplicate} aria-label="Dupliquer"><CopyPlus size={18}/><span>Dupliquer</span></button><button onClick={reset} aria-label="Réinitialiser la transformation"><RotateCcw size={18}/><span>Recentrer</span></button><button onClick={()=>{setItems(prev=>prev.filter(i=>i.id!==current.id));setSelected(null);}} aria-label="Supprimer l’élément"><Trash2 size={18}/><span>Supprimer</span></button></div><div className="sliders"><label>Taille<input aria-label="Taille de l’élément" type="range" min=".2" max="3" step=".02" value={current.scale} onChange={e=>update(current.id,{scale:Number(e.target.value)})}/></label><label>Direction<input aria-label="Direction du personnage" type="range" min={-Math.PI} max={Math.PI} step=".02" value={current.yaw} onChange={e=>update(current.id,{yaw:Number(e.target.value)})}/></label><label>Inclinaison<input aria-label="Inclinaison de l’élément" type="range" min={-Math.PI} max={Math.PI} step=".02" value={Math.atan2(Math.sin(current.roll),Math.cos(current.roll))} onChange={e=>update(current.id,{roll:Number(e.target.value)})}/></label></div></section>}
    <footer className="camera-footer">
      {hint&&camera.status==='ready'&&!current&&<div className="gesture-hint"><span>Choisis un élément, déplace-le et pince pour changer sa taille.</span><button aria-label="Masquer l’aide" onClick={dismissHint}><X size={16}/></button></div>}
      <div className="capture-controls"><button className="control-button" onClick={()=>setCatalogOpen(true)}><span><Layers3 size={23}/></span>Éléments</button><button className={`shutter ${capturing?'capturing':''}`} aria-label="Prendre une photo" disabled={camera.status!=='ready'||!capable||capturing||!!loading} onClick={capture}><span>{capturing&&<LoaderCircle className="spin" size={24}/>}</span></button><button className="control-button" onClick={camera.switchCamera} disabled={camera.status!=='ready'}><span><FlipHorizontal2 size={24}/></span>Retourner</button></div>
      <p className="footer-note">{config.available?`Photos partagées accessibles par leur lien pendant ${config.days} jours.`:'Capture locale · Partage indisponible'}</p>
    </footer>
    {toast&&<div className="toast" role="status">{toast}</div>}
    <Catalog open={catalogOpen} onClose={()=>setCatalogOpen(false)} onAdd={add} loading={loading}/>
    <Dialog open={clear} onClose={()=>setClear(false)} title="Vider le cadre ?"><p className="sheet-subtitle">Les {items.length} éléments de cette composition seront retirés.</p><div className="confirm-actions"><button className="secondary-button" onClick={()=>setClear(false)}>Garder la composition</button><button className="primary-button" onClick={()=>{setItems([]);setSelected(null);setClear(false);}}>Vider la scène</button></div></Dialog>
    <Dialog open={help} onClose={()=>setHelp(false)} title="Aide"><div className="help-content"><ol><li><strong>Choisissez un élément</strong><p>Ouvrez le catalogue et touchez un modèle disponible.</p></li><li><strong>Composez votre photo</strong><p>Glissez pour déplacer. Pincez pour redimensionner. Tournez deux doigts pour incliner. La barre de réglage permet aussi de changer sa direction.</p></li><li><strong>Capturez et emportez</strong><p>Téléchargez immédiatement. Si le partage est disponible, scannez le QR code depuis un autre appareil.</p></li></ol><p className="notice-text">Les objets restent dans le cadre de l’écran lorsque vous bougez. Ils ne sont pas ancrés dans la pièce.</p><h3>Crédits des modèles</h3>{catalog.map(a=><p key={a.id}><a href={a.source} target="_blank" rel="noreferrer">{a.name}</a> · {a.author} · <a href={a.licenseUrl} target="_blank" rel="noreferrer">{a.license}</a><br/><small>{a.note}</small></p>)}<p className="privacy-note">{config.reason} Les photos partagées expirent après {config.days} jours. Aucune galerie publique.</p></div></Dialog>
    <PhotoResult photo={photo} onClose={()=>setPhoto(null)} config={config}/>
  </main>;
}
