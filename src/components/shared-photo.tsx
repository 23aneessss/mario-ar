'use client';
import { useEffect, useState } from 'react';
import { Download, Share2, ExternalLink, ImageOff } from 'lucide-react';
import { shareLink } from '@/lib/sharing';
export function SharedPhotoView({token,expiresAt,error}:{token?:string;expiresAt?:string;error?:string}){
  const [canShare,setCanShare]=useState(false),[imageError,setImageError]=useState(false),[notice,setNotice]=useState('');
  useEffect(()=>setCanShare(typeof navigator.share==='function'),[]);
  return <main className="shared-page"><div className="shared-container">
    {error?<section className="shared-message"><ImageOff size={36} style={{margin:'auto'}}/><h1>Photo indisponible</h1><p>{error}</p><a className="primary-button" href="/">Créer une photo</a></section>:<>
      <img className="shared-image" src={`/api/photos/${token}/image`} alt="Photo partagée avec des éléments 3D" onError={()=>setImageError(true)}/>
      <h1>Votre photo</h1><p>Disponible jusqu’au {new Date(expiresAt!).toLocaleString('fr-FR',{dateStyle:'long',timeStyle:'short',timeZone:'UTC'})} (UTC).</p>
      {imageError&&<p role="alert">L’image est momentanément inaccessible. Réessayez dans un instant.</p>}
      <div className="shared-actions"><a className="primary-button" href={`/api/photos/${token}/image?download=1`} download="mario-ar-photo.jpg"><Download size={19}/>Télécharger la photo</a>{canShare&&<button className="secondary-button" onClick={()=>shareLink(location.href).catch(()=>setNotice('Le partage n’a pas abouti. Copiez l’adresse de cette page.'))}><Share2 size={18}/>Partager</button>}</div>
      <p>Le téléchargement ne démarre pas ? <a href={`/api/photos/${token}/image`} target="_blank" rel="noreferrer">Ouvrir l’image <ExternalLink size={12} style={{display:'inline'}}/></a>, puis faites un appui long pour l’enregistrer.</p>{notice&&<p role="status">{notice}</p>}<p className="privacy-note">Cette photo est accessible à toute personne disposant de son lien jusqu’à son expiration.</p>
    </>}
  </div></main>;
}
