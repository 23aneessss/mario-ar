export type SharedPhoto = {url:string;expiresAt:string;token:string};
export type ShareConfig={available:boolean;days:number;reason?:string};
export function uploadPhoto(blob:Blob,key:string,onProgress:(percent:number)=>void,signal:AbortSignal):Promise<SharedPhoto> {
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();xhr.open('POST','/api/photos');xhr.timeout=45000;
    xhr.setRequestHeader('Content-Type','image/jpeg');xhr.setRequestHeader('X-Idempotency-Key',key);
    xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.round(e.loaded/e.total*90));};
    const abort=()=>xhr.abort();signal.addEventListener('abort',abort,{once:true});
    const cleanup=()=>signal.removeEventListener('abort',abort);
    xhr.onload=()=>{cleanup();try {const body=JSON.parse(xhr.responseText);if(xhr.status<200||xhr.status>=300)reject(new Error(body.error||'Enregistrement impossible.'));else {onProgress(100);resolve(body);}}catch {reject(new Error('Réponse du serveur invalide.'));}};
    xhr.onerror=()=>{cleanup();reject(new Error('Connexion interrompue. La photo reste disponible sur cet appareil.'));};
    xhr.ontimeout=()=>{cleanup();reject(new Error('Le serveur met trop de temps à répondre. Réessayez.'));};
    xhr.onabort=()=>{cleanup();reject(new DOMException('Envoi annulé','AbortError'));};
    if(signal.aborted)abort();else xhr.send(blob);
  });
}
export async function shareLink(url:string) {
  try {await navigator.share({title:'Ma photo',url});}catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))throw error;}
}
